---
layout: post
title: "Notes on new ASP.NET Core API setup with EF Core model, ASP.NET Core Identity, CORS policy (part 2)"
date: 2024-12-28 15:25:00 -0500
categories: programming
permalink: /notes-on-new-asp-net-core-api-aspnetcore-identity-cors
emoji: 😋
mathjax: false
---

The next steps for my hobby project were to add some EF Core entities and ASP.NET Core Identity, including adding the ASP.NET Core Identity types to the EF Core model/SQLite database.

## The EF Core model

I usually have an abstract entity base type that gives the derived entity classes a string Id property for the ORM to map to the database primary key, generated as a GUID:

{% highlight c# %}
namespace GobGuides.Model;

public abstract class EntityBase
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
}

{% endhighlight %}

Conventionally the EF Core entity types go in a folder/namespace `Model`.

For my project, this was the first concrete entity type I added:

{% highlight c# %}
namespace GobGuides.Model;

public class Post(string title,
                    string description) : EntityBase
{
    public string Title { get; set; } = title;

    public string Description { get; set; } = description;

    public required DateTime DateTime { get; set; }
}
{% endhighlight %}

The `DateTime` property is set by mandatory (using the `required` keyword) property injection (object initialization syntax) instead of as a constructor parameter because as a constructor parameter, EF Core will be unable to find a suitable constructor, which seems to be true of most reference types.

### Derived DbContext changes for ASP.NET Core Identity

`AppDbContext`, the derived `DbContext`, is changed to be a child class of `IdentityDbContext<AppUser>` which will make the next dotnet-ef migration include the ASP.NET Core Identity tables:

{% highlight c# %}{% raw %}
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

using GobGuides.Model;

namespace GobGuides.Data;

public class AppDbContext(DbContextOptions opts) : IdentityDbContext<AppUser>(opts)
{
    public required DbSet<Post> Posts { get; set; }
}
{% endraw %}{% endhighlight %}

That also shows how adding the `DbSet<T>` property adds a collection of type `T` which will add a table for that to the database (for example by the `dotnet-ef` migration). `AppUser` is a child class of `IdentityUser`:

{% highlight c# %}
using Microsoft.AspNetCore.Identity;

namespace GobGuides.Model;

public class AppUser : IdentityUser
{

}
{% endhighlight %}

In `Program.cs` there will be this too for adding ASP.NET Core Identity services:

{% highlight c# %}
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();
{% endhighlight %}

`IdentityRole` is another ASP.NET Core Identity type (there are many ASP.NET Core Identity classes which you can customize with inheritance).

You will also need `UseAuthentication()` and `UseAuthorization()` toward the end of Program.cs to register those middleware:

{% highlight c# %}
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapSwagger();

app.MapControllers();

app.Run();
{% endhighlight %}

## CORS

For setting up the CORS policy, define a string for the policy name since it's needed in two places in `Program.cs`, add the client app origin to the configuration, and use that in the `builder.Services.AddCors()`:

{% highlight c# %}
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

using GobGuides.Data;
using GobGuides.Model;

string corsPolicyName = "myCorsPolicy";

var builder = WebApplication.CreateBuilder(args);

string clientOrigin = builder.Configuration["ClientAppOrigin"]
    ?? throw new InvalidOperationException(
        "Client origin missing from configuration"
    );

string sqliteConn = builder.Configuration["SQLiteDbConnString"]
    ?? throw new InvalidOperationException(
        "Database connection string missing from configuration");

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.WithOrigins(clientOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
{% endhighlight %}

Continuing the previous code snippet, once the web application `app` is built, that is the second place the CORS policy name is used:

{% highlight c# %}
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
                                    options.UseSqlite(sqliteConn));

builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors(corsPolicyName);
{% endhighlight %}
