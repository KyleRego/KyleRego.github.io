---
layout: post
title: "Explanation of a Program.cs file"
date: 2025-06-18 12:35:00 -0800
categories: ["programming", "c#", "razor pages"]
permalink: /programcs
emoji: 🖤
mathjax: false
---

You’ll often see me refer to Program.cs in my blog posts. It’s the entry point of a .NET executable program and defines how the application is configured and started. In modern C# projects, top-level statements are used here instead of a traditional `Program` class with a `Main` method (this is typically the only file in the project that uses top-level statements, since only one file can contain them in an application). This blog post is an explanation of this `Program.cs` from a Todo list app I've been working on recently:

{% highlight c# %}
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<AppUser, IdentityRole>(
    options => options.SignIn.RequireConfirmedAccount = false)
        .AddEntityFrameworkStores<AppDbContext>();

var app = builder.Build();

using IServiceScope scope = app.Services.CreateScope();
AppDbContext db = scope.ServiceProvider
                .GetRequiredService<AppDbContext>();
db.Database.Migrate();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();

app.Run();
{% endhighlight %}

This includes some of the comments that come with a new project scaffolded by `dotnet new`.

# Explanation

Program.cs doesn't include individual using statements because they're defined globally in a `GlobalUsings.cs` file:

{% highlight c# %}
global using Microsoft.AspNetCore.Identity;
global using todolist.Data;
global using todolist.Models;
global using Microsoft.AspNetCore.Mvc;
global using Microsoft.EntityFrameworkCore;
{% endhighlight %}

Global usings are a .NET 6+ feature that apply using directives project-wide, reducing boilerplate.

Typically namespaces in C# projects follow the folders' structure, so the `Models` folder has the namespace `appname.Models`, for example. EF Core is an object-relational mapping (ORM) library for working with databases using C# classes. ASP.NET Core Identity is a library within ASP.NET Core that provides authentication and user management features. ASP.NET Core MVC is a framework within ASP.NET Core used to build web apps using the MVC pattern. Razor Pages, which this project uses, is built on top of ASP.NET Core MVC, focusing on page-based routing rather than controllers.

{% highlight c# %}
var builder = WebApplication.CreateBuilder(args);
{% endhighlight %}

Instantiates the app builder, which has a `Configuration` property to access the configuration, and is used to register services into the Dependency Injection (DI) container. `builder` is a `WebApplicationBuilder`.

{% highlight c# %}
builder.Services.AddRazorPages();
{% endhighlight %}

Registers support for Razor Pages, including the services and routing needed to handle `.cshtml` pages. In general, `WebApplicationBuilder` methods which start with `Add` are registering services into the DI container.
 
{% highlight c# %}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
{% endhighlight %}

Registers `AppDbContext` (class derived from EF Core `DbContext`) with an SQLite connection string taken from the config.

## Aside on GetConnectionString

`GetConnectionString` is a good example of .NET development having a very big API. GetConnectionString is a wrapper for accessing connection strings via configuration, and its use means `appsettings.json` has `"ConnectionStrings"`:

{% highlight json %}
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=todolist.db"
  }
}
{% endhighlight %}

In my opinion, the more generally applicable syntax `builder.Configuration["ConnectionStrings:DefaultConnection"]` works just as well. Since `GetConnectionString` is a recognizable method, I use it sometimes anyway.

{% highlight c# %}
builder.Services.AddIdentity<AppUser, IdentityRole>(
    options => options.SignIn.RequireConfirmedAccount = false)
        .AddEntityFrameworkStores<AppDbContext>();
{% endhighlight %}

Registers ASP.NET Core Identity services with `AppUser` (class derived from ASP.NET Core Identity `IdentityUser`) and the default ASP.NET Core Identity `IdentityRole` class. The `.AddEntityFrameworkStores<AppDbContext>` is what makes ASP.NET Core Identity work with the database EF Core is configured to.

{% highlight c# %}
var app = builder.Build();
{% endhighlight %}

Builds the app with its configuration, registered services, and middleware. `app` is a `WebApplication`.

{% highlight c# %}
using IServiceScope scope = app.Services.CreateScope();
AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
db.Database.Migrate();
{% endhighlight %}

Creates a service scope, gets the `AppDbContext`, and applies any pending migrations to ensure the database is up-to-date.

{% highlight c# %}
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
{% endhighlight %}

If not in development, uses a generic error handler and enables HTTP Strict Transport Security. This is part of the default `Program.cs` scaffolded by `dotnet new`.

{% highlight c# %}
app.UseHttpsRedirection();
{% endhighlight %}

Redirects all HTTP requests to HTTPS.

{% highlight c# %}
app.UseStaticFiles();
{% endhighlight %}

Enables serving static files (e.g. CSS, JS, images) from `wwwroot`.

{% highlight c# %}
app.UseRouting();
{% endhighlight %}

Enables endpoint routing system.

{% highlight c# %}
app.UseAuthentication();
app.UseAuthorization();
{% endhighlight %}

Adds authentication and authorization to the middleware pipeline (ASP.NET Core Identity). It is important to call these methods in this order since authentication must happen before authorization.

{% highlight c# %}
app.MapRazorPages();
{% endhighlight %}

Maps Razor Pages to routes in the app.

{% highlight c# %}
app.Run();
{% endhighlight %}

Starts the web application.
