---
layout: post
title: "Notes on lilgobguides build and CI/CD (Razor pages)"
date: 2025-06-05 12:35:00 -0800
categories: ["programming", "c#", "razor pages"]
permalink: /lilgobguides-build-and-cicd-notes
emoji: 🖤
mathjax: false
---

Yesterday and today I did some work on CI/CD for my Old School Runescape blog/guides website lilgobguides, which I redeveloped recently as a Razor pages app with Bootstrap and an SQLite database. This post just notes some details on what I did for that.

## Bootstrap as an NPM package and SCSS compilation

There were some considerations with regards to Bootstrap; a new Razor pages app created with `dotnet new razor` has already compiled Bootstrap in the project inside `wwwroot/js` and `wwwroot/css`. This approach limits how much customization you can do (see [Customize Bootstrap docs](https://getbootstrap.com/docs/5.3/customize/overview/#overview)). In order to customize the Bootstrap theme, I install Bootstrap as an npm package and have this `scss/custom-bootstrap.scss` in the project root:

{% highlight scss %}
$primary: #ff00a6;
$body-bg: #121212;
$font-family-base: 'Segoe UI', sans-serif;

@import "../node_modules/bootstrap/scss/bootstrap";
{% endhighlight %}

Then in package.json, `sass` is included as a dependency, and there is an npm script to compile the Bootstrap SCSS and place the compiled Bootstrap CSS in `wwwroot/css`:

{% highlight json %}
{
  "name": "lilgobguides",
  "version": "1.0.0",
  "description": "Old School Runescape Guides For Ultimate Irons",
  "main": "index.js",
  "scripts": {
    "build-bootstrap-css": "sass scss/custom-bootstrap.scss wwwroot/css/bootstrap-custom.css",
    "build-bootstrap-js-win": "copy \"node_modules\\bootstrap\\dist\\js\\bootstrap.bundle.min.js\" \"wwwroot\\js\\bootstrap.bundle.min.js\"",
    "build-bootstrap-js-linux": "cp node_modules/bootstrap/dist/js/bootstrap.bundle.min.js wwwroot/js/bootstrap.bundle.min.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bootstrap": "^5.3.6",
    "sass": "^1.89.0"
  }
}
{% endhighlight %}

In the above there are also two scripts for copying the Bootstrap JS to `wwwroot/js`; one is for my Windows machine that I use to develop the site, and the other is for the GitHub Actions runner which is Linux.

## GitHub action

With those npm scripts, the GitHub action is:

{% highlight yaml %}{% raw %}
name: deploy-lilgobguides

on:
    workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install npm packages
        working-directory: .
        run: npm install
      - name: Build Bootstrap CSS
        working-directory: .
        run: npm run build-bootstrap-css
      - name: Build Bootstrap JS
        working-directory: .
        run: npm run build-bootstrap-js-linux
      - name: Publish self-contained executable
        run: dotnet publish . -r linux-arm64 --self-contained true
      - name: SCP dotnet executable to VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_SSH_KEY }}
          source: "./bin/Release/net8.0/linux-arm64/publish"
          target: ${{ secrets.lilgobguides_DEPLOY_DIRECTORY }}
{% endraw %}{% endhighlight %}

The above checks out the repo, installs .NET, Node, and the npm packages, runs those scripts in `package.json` to compile/copy the Bootstrap assets to `wwwroot`, compiles the .NET project (now including those frontend assets) into a self-contained assembly targeting linux-arm64 and SCPs the resultant artifact to the host machine with the `appleboy/scp-action`. 

## systemd service

On the Azure VM there is a systemd service file for the app `/etc/systemd/system/lilgobguides.service`:

{% highlight bash %}
[Unit]
Description=lilgobguides

[Service]
Type=simple
WorkingDirectory=/path_to/lilgobguides/bin/Release/net8.0/linux-arm64/publish
User=user-which-app-runs-as
ExecStart=/path_to/lilgobguides/bin/Release/net8.0/linux-arm64/publish/lilgobguides
Environment=ASPNETCORE_URLS="http://0.0.0.0:5002"
Environment=lilgobguides_DATABASE_PATH="Data Source=/path_to/lilgobguides.db"

[Install]
WantedBy=multi-user.target
{% endhighlight %}

This allows starting up the app with `sudo service lilgobguides start` or `sudo service lilgobguides restart`; if changes are made to that file it is necessary to run `sudo systemctl daemon-reload` first; and `sudo service lilgobguides status` shows the status and if that shows the app has exited `sudo journalctl -u lilgobguides.service -n 50` can be useful to see the problem.

`User=` sets the user that the process will start under; as the `Program.cs` has the SQLite database initially created by migrations, that affects the file ownership of that database.

Specifying the working directory avoids path-related errors. 

`Environment=ASPNETCORE_URLS="http://0.0.0.0:5002"` sets an environment variable that has the effect of the running app listening to HTTP on that port. If this environment variable was set to two origins, those would be for HTTP and HTTPS, and my experience with this work was that with two origins set, the app would listen on the HTTPS one. In my case I am using Apache to serve the site over port 443 with HTTPS and acting as a reverse proxy to the app server, so it's fine for it to use HTTP.

The above also sets an environment variable for the path to the SQLite database; in Program.cs it is used here:

{% highlight c# %}
string dbConnection = null!;
if (builder.Environment.IsDevelopment())
{
    dbConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("No database connection string");
}
else if (builder.Environment.IsProduction())
{
    dbConnection = builder.Configuration["lilgobguides_DATABASE_PATH"]
    ?? throw new InvalidOperationException("Is there environment variable for database path?");
}
builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(dbConnection));
{% endhighlight %}

If the `"DefaultConnection"` value in `appsettings.json` were used as in development, the database would be created in the deployment folder with the .NET assemblies. 

## Apache configuration

The Apache `.conf` file for the site:

{% highlight bash %}
<VirtualHost *:443>
        ServerName lilgobslayerguides.net
        ProxyPreserveHost On
        ProxyPass / http://localhost:5002/
        ProxyPassReverse / http://localhost:5002/
        ErrorLog ${APACHE_LOG_DIR}/app-error.log
        CustomLog ${APACHE_LOG_DIR}/app-access.log common

        SSLEngine On
        SSLCertificateFile /path_to/lilgobslayerguides_net.crt
        SSLCertificateKeyFile /path_to/lilgobslayerguides.net.key
        SSLCertificateChainFile /path_to/lilgobslayerguides_net.ca-bundle

        SSLProtocol -all +TLSv1.2
</VirtualHost>
{% endhighlight %}

With Apache virtual hosts, the VM is able to serve multiple websites over the same port and IP address (port 443 for HTTPS, and it is the same IP address since it is the same VM) by matching the `ServerName` with the request; this shows how Apache is used as a reverse proxy and conventional names for the TLS cert files.