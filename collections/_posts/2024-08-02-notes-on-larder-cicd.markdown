---
layout: post
title: "Notes on continuous deployment for React and ASP.NET Core with GitHub actions"
date: 2024-08-05 00:00:00 -0500
categories: blogging
permalink: /notes-on-larder-ci-cd-setup
emoji: 🤔
mathjax: false
---

Recently I did some work to set up continuous deployment for a [practice project (Larder)](https://github.com/eggrain/Larder/tree/0149000cd8178bd35dcb9222488ccee6c2310374), which is an ASP.NET Core web API with a React app frontend. This post is not intended to be a guide or show best practices, just some notes on how I got along which may provide some helpful hints to someone (probably future me).

# GitHub action job to build and deploy the React app

The `environment: development` sets the environment that the secrets are read from. The source code organizes the React app in a directory `client`, so after checking out the repo, the working directory for the `run` steps is set to `./client`.

`npm run build` builds the React app to `.client/build` and that is SCPed to the VM (using credentials read from GitHub secrets). The build is placed in the standard location for static assets served by Apache.

{% raw %}
```
name: my-github-action

on: [push]

jobs:
  build-and-deploy-react-client:
    environment: development
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./client
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 14.x
      - name: Install dependencies
        run: npm install
      - name: Build React app
        run: npm run build
      - name: SCP bundle to VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_SSH_KEY }}
          source: "./client/build"
          target: /var/www/larder_client
```
{% endraw %}

[Create React App documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/) explains using `.env.production` to set environment variables at build time, however for some reason I've been unable to get that to work, despite using `.env.development` without any issue. It is a TODO for me to figure that out, so for now my base class for API client services has this workaround:

{% highlight javascript %}
export default class ApiServiceBase
{
    constructor()
    {
        this.backendOrigin = process.env.REACT_APP_WEBAPI_ORIGIN;

        // TODO: Figure out why npm build does not read .env.production
        if (this.backendOrigin === undefined)
        {
            this.backendOrigin = "https://kylerego.net:49152";
        }
    }

    ...
}
{% endhighlight %}

# Apache configuration

Relevant directory: `/etc/apache2`

The following would be in `/etc/apache2/sites-available`. Apache listens to two ports for Larder, one for the React app and one for the API, and enforces HTTPS. The React app is served at port 446 as a static asset. The React app fetches JSON from the API, to do so it makes requests to Apache listening on 49152, which acts as a reverse proxy to the web API's built-in Kestrel web server listening on `localhost:5000`.

```
<VirtualHost *:446>
        ServerName kylerego.net
        DocumentRoot /var/www/larder_client/client/build

        <Directory /var/www/larder_client/client/build>
                Options Indexes FollowSymLinks
                AllowOverride All
                Require all granted
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        SSLEngine On
        SSLCertificateFile /path_to_certificate/kylerego_net.crt
        SSLCertificateKeyFile /path_to_certificate/kylerego.net.key
        SSLCertificateChainFile /path_to_certificate/kylerego_net.ca-bundle

        SSLProtocol -all +TLSv1.2
</VirtualHost>

<VirtualHost *:49152>
        ProxyPreserveHost On
        ProxyPass / http://localhost:5000/
        ProxyPassReverse / http://localhost:5000/
        ErrorLog ${APACHE_LOG_DIR}/app-error.log
        CustomLog ${APACHE_LOG_DIR}/app-access.log common

        SSLEngine On
        SSLCertificateFile /path_to_certificate/kylerego_net.crt
        SSLCertificateKeyFile /path_to_certificate/kylerego.net.key
        SSLCertificateChainFile /path_to_certificate/kylerego_net.ca-bundle

        SSLProtocol -all +TLSv1.2
</VirtualHost>
```

The ports that Apache listens to are specified in `/etc/apache2/ports.conf`. Any ports I use on this VM in the future will probably be in the dynamic/private range (49152 through 65535). In my situation, I am using an Azure VM so it is also necessary to open the ports with network security groups.

# GitHub action job to deploy the web API

This shows a self-contained publish which includes the .NET runtime (the app will be able to run on a machine which does not have the .NET framework installed). However, the runtime target needs to be specified (`linux-arm64`).  

{% raw %}
```
  build-test-and-deploy-webapi:
    environment: development
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
            dotnet-version: '8.0.x'
      - name: Run tests
        run: dotnet test WebApi.Tests
      - name: Publish self-contained executable
        run: dotnet publish WebApi -r linux-arm64 --self-contained true
      - name: SCP dotnet executable to VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_SSH_KEY }}
          source: "./WebApi/bin/Release/net8.0/linux-arm64/publish"
          target: ${{ secrets.WEBAPI_DEPLOY_DIRECTORY }}
```
{% endraw %}

Since the deployment directory target is not standard like `/var/www`, I figured it would be better to keep it a secret.

# systemd service for the web API

Relevant directory: `/etc/systemd/system`

```
[Unit]
Description=Larder

[Service]
Type=simple
WorkingDirectory=/path_to_webapi_deploy_directory/WebApi/bin/Release/net8.0/linux-arm64/publish
ExecStart=/path_to_webapi_deploy_directory/WebApi/bin/Release/net8.0/linux-arm64/publish/Larder
Environment="LARDER_DATABASE_PATH=Data Source=/path_to_sqlite_database/larder_database.db"

[Install]
WantedBy=multi-user.target
```

The working directory is set to be the publish directory so that the `appsettings.json` file there can be read. That configuration file includes the origin of the React app so that the CORS policy can be configured:

{% highlight c# %}
string corsPolicyName = "corsPolicy";
string clientReactAppOrigin = builder.Configuration["ClientReactAppOrigin"] ?? throw new ApplicationException();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicyName, policy  =>
        {
            policy.AllowAnyHeader()
                .AllowAnyMethod()
                .WithOrigins(clientReactAppOrigin);
        });
});
{% endhighlight %}

The service file also sets an environment variable for the SQLite database connection string.

{% highlight c# %}
else if (builder.Environment.IsProduction())
{
    // from an environment variable
    string databasePath = builder.Configuration["LARDER_DATABASE_PATH"] ?? throw new ApplicationException();

    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        options.UseSqlite(databasePath);
    });
}
{% endhighlight %}
