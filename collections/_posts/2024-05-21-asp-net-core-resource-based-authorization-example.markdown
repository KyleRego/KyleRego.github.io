---
layout: post
title: "ASP.NET Core resource-based authorization example"
date: 2024-05-21 00:00:00 -0500
categories: blogging
permalink: /asp-net-core-resourced-based-authorization-example
emoji: 🫡
mathjax: false
---

I spent some time understanding [Resource-based authorization in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased?view=aspnetcore-3.1) today and implemented a simple example using it (also see [Policy-based authorization in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-3.1#security-authorization-policies-based-authorization-handler)). This post is an alternative example to what's in the documentation and some notes for reference.

In this example, authorization is a simple check that the `UserId` of the resource (an `Article`) is equal to the ID of the user requesting it. The check happens in a controller action after the resource is retrieved from a database via a repository.

> Create a custom requirement class, and implement a requirement handler class.

In my case the requirement class is an empty class implementing `IAuthorizationRequirement`:

{% highlight c# %}
using Microsoft.AspNetCore.Authorization;

namespace AnkiBooks.WebApp.Policies.Requirements;

public class UserOwnsArticleRequirement : IAuthorizationRequirement { }
{% endhighlight %}

The requirement handler:

{% highlight c# %}
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;

using AnkiBooks.ApplicationCore.Entities;
using AnkiBooks.WebApp.Policies.Requirements;

namespace AnkiBooks.WebApp.Policies.Handlers;

public class UserOwnsArticleHandler : AuthorizationHandler<UserOwnsArticleRequirement, Article>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context,
                                                    UserOwnsArticleRequirement requirement,
                                                    Article resource)
    {
        if (context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value == resource.UserId)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
{% endhighlight %}

`ClaimTypes.NameIdentifier` here is the claim type for the user ID claim (it is the default value of the `ClaimsIdentityOptions.UserIdClaimType` property).

> Register the requirement and handler in Program.cs:

This is the setup needed in `Program.cs`:

{% highlight c# %}
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("UserOwnsArticle",
            policy => policy.Requirements.Add(new UserOwnsArticleRequirement()));
});

builder.Services.AddSingleton<IAuthorizationHandler, UserOwnsArticleHandler>();
{% endhighlight %}

Inject `IAuthorizationService` into the controller:

{% highlight c# %}
[ApiController]
public class ArticlesController(IArticleRepository repository,
                                IAuthorizationService authorizationService,
                                ILogger<ArticlesController> logger) : ApplicationController
{
    private readonly IArticleRepository _repository = repository;
    private readonly IAuthorizationService _authorizationService = authorizationService;
    private readonly ILogger<ArticlesController> _logger = logger;

    ...
}
{% endhighlight %}

A controller action using this:

{% highlight c# %}
[HttpGet("api/Articles/{articleId}")]
public async Task<ActionResult<Article>> GetArticle(string articleId)
{
    ClaimsPrincipal user = HttpContext.User;
    if (user == null) return new ForbidResult();

    Article? article = await _repository.GetArticleAsync(articleId);
    if (article == null) return NotFound();

    AuthorizationResult authorizationResult =
            await _authorizationService.AuthorizeAsync(user, article, "UserOwnsArticle");

    if (authorizationResult.Succeeded)
    {
        _logger.LogInformation("Article authorization was successful");
        return article;
    }
    else
    {
        _logger.LogInformation("Article authorization failed");
        return NotFound();
    }
}
{% endhighlight %}

Signature of this `IAuthenticationService` `AuthorizeAsync` overload:

{% highlight c# %}
Task<AuthorizationResult> AuthorizeAsync(ClaimsPrincipal user,
                          object resource,
                          string policyName);
{% endhighlight %}

Other comments:
- `HttpContext.User` is one way to get the current `ClaimsPrincipal`.
- Adding `[Authorize]` to the controller/action would be somewhat similar to the `user == null` check.
- Sending a Not Found response instead of Forbidden for when the resource was found but the user was not authorized to see it is a good practice as it prevents giving away the existence of the resource.