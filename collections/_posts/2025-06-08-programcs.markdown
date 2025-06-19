---
layout: post
title: "Explanation of a Program.cs file"
date: 2025-06-18 12:35:00 -0800
categories: ["programming", "c#", "razor pages"]
permalink: /programcs
emoji: 🖤
mathjax: false
---

You’ll often see me refer to Program.cs in my blog posts. It’s the entry point of a .NET executable project and defines how the application is configured and started. In modern C# projects, top-level statements are used here instead of a traditional Main method. This blog post is an explanation of this `Program.cs` from a Todo list app I've been working on recently:

{% highlight c# %}
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using todolist.Data;
using todolist.Models;

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

# Explanation

{% highlight c# %}
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using todolist.Data;
using todolist.Models;
{% endhighlight %}
Brings in necessary namespaces for ASP.NET Core Identity, EF Core, and project files. Typically namespaces in .NET C# projects follow the folders' structure. EF Core is an object-relational mapping (ORM) library for working with databases using C# classes. ASP.NET Core is another bread-and-butter .NET framework that adds authentication and authorization APIs/services.

{% highlight c# %}
var builder = WebApplication.CreateBuilder(args);
{% endhighlight %}
Sets up the app builder, loading configuration and preparing services. `builder` is a `WebApplicationBuilder`.

{% highlight c# %}
builder.Services.AddRazorPages();
{% endhighlight %}
Registers Razor Pages support in the DI (Dependency Injection) container.

{% highlight c# %}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
{% endhighlight %}
Registers your `AppDbContext` (derived EF Core class) with SQLite using the connection string from config. `GetConnectionString` is a good example of a language API being way too big. That same value can be accessed with `builder.Configuration["DefaultConnection"]`. GetConnectionString is a wrapper for accessing connection strings via configuration, which means `appsettings.json` has `"ConnectionStrings"`:

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

In my opinion, adding that to the language was ill-considered, since `builder.Configuration["DefaultConnection"]` works just as well. I use it anyway since it's a recognizable method.

{% highlight c# %}
builder.Services.AddIdentity<AppUser, IdentityRole>(
    options => options.SignIn.RequireConfirmedAccount = false)
        .AddEntityFrameworkStores<AppDbContext>();
{% endhighlight %}
Adds ASP.NET Core Identity with your custom `AppUser` and default roles, storing data in your EF Core context. Also disables email confirmation requirement for sign-in. `AppUser` is derived from ASP.NET Core `IdentityUser`.

{% highlight c# %}
var app = builder.Build();
{% endhighlight %}
Builds the configured web app, including all registered services and middleware.
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
If not in development, uses a generic error handler and enables HTTP Strict Transport Security.

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
Adds authentication and authorization to the middleware pipeline (ASP.NET Core Identity).

{% highlight c# %}
app.MapRazorPages();
{% endhighlight %}
Maps Razor Pages to routes in the app.

{% highlight c# %}
app.Run();
{% endhighlight %}
Starts the web application.
