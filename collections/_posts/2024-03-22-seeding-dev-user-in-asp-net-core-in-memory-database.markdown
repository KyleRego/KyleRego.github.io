---
layout: post
title: "Custom initialization login for seeding a user in an ASP.NET Core web API"
date: 2024-03-22 08:15:00 -0500
categories: blogging
permalink: /seeding-a-user-in-an-asp-net-core-in-memory-database-for-development
emoji: 🫡
mathjax: false
---

In the initial development of my app (an ASP.NET Core Web API and Blazor Webassembly client), I'm currently using the in-memory database provider while I'm mostly focused on learning Blazor. Since the app has ASP.NET Core Identity set up to an extent with some endpoints requiring authorization, seeding a development user was needed to not waste time registering the user every time the API is started. I had a look at [Data Seeding](https://learn.microsoft.com/en-us/ef/core/modeling/data-seeding) and the section there on "Custom Initialization Logic" is essentially what I did, the main difference being I put the call to `DbContext.SaveChanges()` in a middleware that just checks if the user exists and creates the user if it doesn't exist. This is only for development though and I intend to remove it later probably when I stop using the in-memory provider. (3/23 update: **See later in post to see what I changed the approach to later, which I think is a lot better**) I had a look at [Write custom ASP.NET Core middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write?view=aspnetcore-8.0) to see an example of a middleware class and then modified it for what I needed:

{% highlight c# %}
using AnkiBooks.Backend.Database;
using AnkiBooks.Models.Identity;
using Microsoft.AspNetCore.Identity;

namespace AnkiBooks.Backend.Middleware;

public class SeedDevUser
{
    private readonly RequestDelegate _next;

    public SeedDevUser(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext httpContext, ApplicationDbContext dbContext)
    {
        ApplicationUser? testUser = dbContext.Users.FirstOrDefault(u => u.Email == "test@example.com");

        if (testUser == null)
        {
            PasswordHasher<ApplicationUser> passwordHasher = new();

            testUser = new()
            {
                Email = "test@example.com"
            };

            string hash = passwordHasher.HashPassword(testUser, "Asdf333!");

            testUser.PasswordHash = hash;

            dbContext.Users.Add(testUser);
            dbContext.SaveChanges();
        }

        // Call the next delegate/middleware in the pipeline.
        await _next(httpContext);
    }
}

public static class SeedDevUserMiddlewareExtensions
{
    public static IApplicationBuilder UseSeedDevUserMiddleware(
        this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SeedDevUser>();
    }
}
{% endhighlight %}

The `SeedDevUser` is the custom middleware class. The `ApplicationDbContext` instance is injected as a scoped service. If you try to inject the scoped service as a constructor parameter then you get an error `System.InvalidOperationException: Cannot resolve scoped service 'AnkiBooks.Backend.Database.ApplicationDbContext' from root provider`. The middleware just checks if the user with the hard-coded email exists and if not, creates it. The `SeedDevUserMiddlewareExtensions` adds an extension method to `IApplicationBuilder` that is called in `Program.cs`, in my case just before `app.Run()`:

{% highlight c# %}
if (app.Environment.IsDevelopment())
{
    app.UseSeedDevUserMiddleware();
}
{% endhighlight %}

As an aside, 3 things to note about writing an extension method: the class must be `static`, the method must be `static`, and the first parameter to the method must use the `this` keyword and that is the type that the extension method is added to. 

Also in case it is helpful here is where the `ApplicationDbContext` is added as a service, earlier in `Program.cs`:

{% highlight c# %}
builder.Services.AddDbContext<ApplicationDbContext>(
    options => options.UseInMemoryDatabase("AppDb")
);
{% endhighlight %}

## 3/23/2024 update

Today (the day after the post above) I switched to the SQLite database provider because it seemed like a composite index I set up to enforce uniqueness of the combination was not being enforced by the in-memory database (after switching to SQLite, it was). Switching to SQLite I changed the last snippet above to this:

{% highlight c# %}
builder.Services.AddDbContext<ApplicationDbContext>(
    options => options.UseSqlite(builder.Configuration.GetConnectionString("Database"))
);
{% endhighlight %}

That `GetConnectionString` method is "Shorthand for GetSection("ConnectionStrings")[name]" and gets the database connection string from the `appsettings.json` (in this case `appsettings.Development.json` for development):

{% highlight json %}
{
  "ConnectionStrings": {
    "Database": "Data Source=development.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.AspNetCore.Cors": "Information"
    }
  }
}

{% endhighlight %}

With an on-disk database, it's not necessary to register a new user everytime the web API is started, but I felt like still seeding the user in a similar way. Using a middleware to do that is clearly a janky thing to do, and while setting up the SQLite provider, I realized a much better way. In `Program.cs` I ended up with this:

{% highlight c# %}
WebApplication app = builder.Build();

using (IServiceScope scope = app.Services.CreateScope())
{
    ApplicationDbContext context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();

    string testUserEmail = "test@example.com";
    string testUserPassword = "Asdf333!";
    ApplicationUser? testUser = context.Users.FirstOrDefault(u => u.Email == testUserEmail);

    if (testUser == null)
    {
        PasswordHasher<ApplicationUser> passwordHasher = new();

        testUser = new()
        {
            Email = testUserEmail,
            NormalizedEmail = testUserEmail.ToUpper(),
            UserName = testUserEmail,
            NormalizedUserName = testUserEmail.ToUpper()
        };

        string hash = passwordHasher.HashPassword(testUser, testUserPassword);

        testUser.PasswordHash = hash;

        context.Users.Add(testUser);
        context.SaveChanges();
    }
}
{% endhighlight %}

The above snippet started as a way to just ensure the database was created. That can be done in `Program.cs` by creating a scope, getting an instance of the `DbContext`, and calling `EnsureCreated()` on the `Database` property, and then from there I realized this would be a better place to create the test user. I did notice after changing to this provider that it became necessary to set some of the other properties for logging in to work (`NormalizedEmail`, `UserName`, `NormalizedUserName`) which must be due to some aspect of the ASP.NET Core Identity API that I don't know about.

This could be used to seed more of the database too but the test user is all I want to seed at the moment. To me this is a clear improvement compared to the seeding using a middleware but the approach using migrations is probably preferred.