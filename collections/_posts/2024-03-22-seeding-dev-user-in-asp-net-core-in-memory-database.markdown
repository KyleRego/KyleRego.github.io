---
layout: post
title: "Seeding a user in an ASP.NET Core in-memory database for development"
date: 2024-03-22 08:15:00 -0500
categories: blogging
permalink: /seeding-a-user-in-an-asp-net-core-in-memory-database-for-development
emoji: 🫡
mathjax: false
---

In the initial development of my app (an ASP.NET Core Web API and Blazor Webassembly client), I'm currently using the in-memory database provider while I'm mostly focused on learning Blazor. Since the app has ASP.NET Core Identity set up to an extent with some endpoints requiring authorization, seeding a development user was needed to not waste time registering the user every time the API is started. I had a look at [Data Seeding](https://learn.microsoft.com/en-us/ef/core/modeling/data-seeding) and the section there on "Custom Initialization Logic" is essentially what I did, the main difference being I put the call to `DbContext.SaveChanges()` in a middleware that just checks if the user exists and creates the user if it doesn't exist. This is only for development though and I intend to remove it later probably when I stop using the in-memory provider. I had a look at [Write custom ASP.NET Core middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write?view=aspnetcore-8.0) to see an example of a middleware class and then modified it for what I needed:

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