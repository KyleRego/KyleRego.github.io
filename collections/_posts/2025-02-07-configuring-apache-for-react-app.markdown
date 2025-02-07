---
layout: post
title: "Apache configuration for React Router app"
date: 2025-02-07 11:35:00 -0800
categories: programming
permalink: /apache-configuration-for-react-router-app
emoji: 🕸️
mathjax: false
---

For a while now the deployed version of an ASP.NET Core/React project (which uses React Router) I am working on has had this issue where a full page refresh resulted in a Not Found response from Apache if the browser address path was anything but "/". Since the app uses React Router for client-side routing, that this happened did not surprise me much, however I didn't know exactly how to address it and I procrastinated actually looking into it, but today I looked into it and worked out how to address it with the Apache configuration.

For my `sites-available/larder.conf` Apache configuration I just had to add:

```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
```

inside the `<VirtualHost>` block for the client (in my case the `larder.conf` has the configuration for serving the static React app as well as the ASP.NET Core API). This does require enabling the `mod_rewrite` module (`sudo a2enmod rewrite` and restarting Apache). I guess the above is a "rewrite rule."

This enables the `mod_rewrite` module's URL manipulation and redirection, with 2 conditions to continue processing the rewrite rule: if the request is not for a file that exists or a directory that exists, continue, and then the request is redirected to `index.html` which allows React Router to take over with the client-side routing.