---
layout: post
title: "Notes on new ASP.NET Core API setup with Swagger, EF Core, SQLite"
date: 2024-12-28 9:25:00 -0500
categories: programming
permalink: /notes-on-new-asp-net-core-api-swagger-ef-core-sqlite
emoji: 😋
mathjax: false
---

Today I made a new ASP.NET Core project for a hobby website; these are some notes on what I did which is mainly similar to what I've settled on in my past projects.

Use `dotnet` to make a new web API in the output directory that you want (it will make the directory too):

`dotnet new webapi -o GobGuides`
`cd GobGuides`

Create a `.gitignore` file with at least `bin/` and `obj/`.

Now add these packages for Entity Framework Core:

{% highlight bash %}
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.AspNetCore.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Design
{% endhighlight %}

Create a derived `DbContext` to serve as your application's database context class, I put mine in a folder/namespace `Data`:

{% highlight c# %}
using Microsoft.EntityFrameworkCore;

namespace GobGuides.Data;

public class AppDbContext(DbContextOptions opts) : DbContext(opts)
{

}

{% endhighlight %}

In the `appsettings.Development.json`, add some SQLite database connection string to the JSON:

{% highlight json %}
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "SQLiteDbConnString": "Data Source=gob_guides_dev.db"
}

{% endhighlight %}

Now edit `Program.cs` to like this:

{% highlight c# %}
using Microsoft.EntityFrameworkCore;

using GobGuides.Data;

var builder = WebApplication.CreateBuilder(args);

string sqliteConn = builder.Configuration["SQLiteDbConnString"]
    ?? throw new InvalidOperationException(
        "Database connection string missing");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
                                    options.UseSqlite(sqliteConn));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        options.RoutePrefix = string.Empty;
    });
}

app.MapControllers();

app.Run();

{% endhighlight %}

I believe `InvalidOperationException` is a standard practice exception for when configuration data is missing.

This part:

{% highlight c# %}
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}
{% endhighlight %}

will make it so starting the app executes any outstanding migrations, that would be found in the same assembly and scaffolded with `dotnet-ef`. If the migrations are in a different assembly, the way the app database context is registered in the services will have to be like this:

{% highlight c# %}
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
    options.UseSqlite
        (
            builder.Configuration.GetConnectionString("Database"),
            b => b.MigrationsAssembly("Infrastructure")
        );
    }
);
{% endhighlight %}

The web API project file would also need a project reference to the `Infrastructure` project.

This is a nice way to setup the Swagger UI to be served at `/` instead of `/swagger`, which is convenient for development:

{% highlight c# %}
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        options.RoutePrefix = string.Empty;
    });
}
{% endhighlight %}

When the app is started, it will create the SQLite database, `gob_guides_dev.db` in this example. Files `gob_guides_dev.db-shm`, `gob_guides_dev.db-wal` will also be created when the database is used; in my case I add all three to the `.gitignore`.