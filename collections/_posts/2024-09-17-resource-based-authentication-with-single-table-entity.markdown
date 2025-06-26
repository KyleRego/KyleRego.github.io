---
layout: post
title: "Resource-based authorization with polymorphic UserId model (ASP.NET Core, EF Core)"
date: 2024-09-17 12:30:00 -0500
categories: programming csharp
permalink: /resource-based-authorization-with-polymorp-user-id
emoji: 😇
mathjax: false
---

I added resource-based authorization to my ASP.NET Core project today; the approach that I used was to add a property `UserId` to an abstract entity class and then a requirement handler class that takes that type as the resource parameter to compare the current user's ID to. It's not groundbreaking at all, but it is another example of resource-based authorization in ASP.NET Core which I personally find the API to be somewhat confusing in design to use, and overall the approach builds on [my previous example of resource-based authorization in ASP.NET Core](/asp-net-core-resourced-based-authorization-example).

With this, authorization will be possible for entity classes derived from this:

{% highlight c# %}
public abstract class EntityBase
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [ForeignKey(nameof(UserId))]
    public ApplicationUser? User { get; set; }
    public required string UserId { get; set; }
}
{% endhighlight %}

In order to add the column to the database and then make it non-nullable, the above would have `public required string? UserId { get; set; }` instead for the first migration, and after it is ensured that all records in the database across the relevant tables have a non-null `UserId`, the not null constraint can be added. The `required` ensures that all constructors of a descended `EntityBase` will set the `UserId` during that time between migrations (for a small non-enterprise app with no traffic in a staging environment like this).

To implement resource-based authorization, both a requirement and handler are needed:

{% highlight c# %}
namespace Larder.Policies.Requirements;

public class UserCanAccessEntityRequirement : IAuthorizationRequirement
{
    public static readonly string Name = "UserCanAccessEntity";
}
{% endhighlight %}

{% highlight c# %}
namespace Larder.Policies.Handlers;

public class UserCanAccessEntityHandler
        : AuthorizationHandler<UserCanAccessEntityRequirement, EntityBase>
{
    protected override Task HandleRequirementAsync(
                            AuthorizationHandlerContext context,
                            UserCanAccessEntityRequirement requirement,
                                            EntityBase resource)
    {
        string? userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId != null && userId == resource.UserId)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;        
    }
}
{% endhighlight %}

I realized that a string value is needed in two places so I put this in the requirement class as a static property (otherwise that class is just empty).

Then in `Program.cs` I changed this:

{% highlight c# %}
builder.Services.AddAuthorization();
{% endhighlight %}

to this:

{% highlight c# %}
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(UserCanAccessEntityRequirement.Name,
            policy => policy.Requirements.Add(new UserCanAccessEntityRequirement()));
});
{% endhighlight %}

It is necessary to register the handler for dependency injection with `AddSingleton`:

{% highlight c# %}
builder.Services.AddSingleton<IAuthorizationHandler, UserCanAccessEntityHandler>();
{% endhighlight %}

Here is the class which has the `IAuthorizationHandler` injected into it:

{% highlight c# %}
namespace Larder.Services;

public abstract class ApplicationServiceBase(IHttpContextAccessor httpConAcsr,
                                            IAuthorizationService authService)
{
    private readonly IHttpContextAccessor _httpConAcsr = httpConAcsr;
    private readonly IAuthorizationService _authService = authService;

    protected string CurrentUserId()
    {
        return _httpConAcsr.HttpContext?.User?
                            .FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new ApplicationException("No user id in the HTTP context");
    }

    protected async Task ThrowIfUserCannotAccess(EntityBase resource)
    {
        ClaimsPrincipal user = _httpConAcsr.HttpContext?.User
            ?? throw new ApplicationException("No claims principal/ user");

        AuthorizationResult authorizationResult =
            await _authService.AuthorizeAsync(user, resource, UserCanAccessEntityRequirement.Name);

        if (!authorizationResult.Succeeded)
            throw new ApplicationException("Authorization did not succeed");
    }
}
{% endhighlight %}

Above is also the second place that string that was made a static property of the requirement handler class needs to be used. It is also where unit tests that mock the `IAuthorizationService` would pass while the app throws a runtime exception if you forgot to register the requirement handler for dependency injection in `Program.cs` (learned the hard way).
