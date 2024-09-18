---
layout: post
title: "Mocking IHttpContextAccessor and IAuthorizationService in ASP.NET Core unit tests"
date: 2024-09-17 10:30:00 -0500
categories: programming csharp
permalink: /mocking-http-user
emoji: 😇
mathjax: false
---

Today I did some refactoring of an ASP.NET Core project with a controller-service-repository architecture to add resource-based authorization. As a result of this, my service classes are derived from an abstract class that has `IHttpContextAccessor` and `IAuthorizationService` injected with dependency injection. As a result, unit tests of the service classes need mock implementations.

This shows exactly what is is that I am mocking for the unit tests:

{% highlight csharp %}
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

Since the mocks are going to be needed for the tests of every service derived from this, I chose to put the mocks for these dependencies in an abstract class for service test classes:

{% highlight csharp %}
namespace Larder.Tests.Services;

public abstract class ServiceTestsBase
{
    protected readonly string mockUserId = Guid.NewGuid().ToString();
    protected readonly Mock<IHttpContextAccessor> mockHttpContextAccessor;
    protected readonly Mock<IAuthorizationService> mockAuthorizationService;

    public ServiceTestsBase()
    {
        mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        var mockHttpContext = new Mock<HttpContext>();
        mockHttpContextAccessor.Setup(_ => _.HttpContext).Returns(mockHttpContext.Object);

        var mockClaimsPrincipal = new Mock<ClaimsPrincipal>();
        mockHttpContext.Setup(_ => _.User).Returns(mockClaimsPrincipal.Object);

        var claim = new Claim(ClaimTypes.NameIdentifier, mockUserId);

        mockClaimsPrincipal.Setup(_ => _.FindFirst(ClaimTypes.NameIdentifier)).Returns(claim);

        mockAuthorizationService = new Mock<IAuthorizationService>();

        mockAuthorizationService.Setup(_ => _.AuthorizeAsync(mockClaimsPrincipal.Object,
                                                    It.IsAny<EntityBase>(),
                                                    UserCanAccessEntityRequirement.Name))
                                    .ReturnsAsync(AuthorizationResult.Success());
    }
}
{% endhighlight %}

For now this works, but I imagine I will need something more to cover tests of cases where the user is unauthenticated. In discovering the above solution, I found I could not use `FindFirstValue` of `ClaimsPrincipal` because I could not mock it due to it being an extension method.

Unit tests that use this will pass while in the running app things are failing if you forgot to register the authorization handler for dependency injection in `Program.cs` (I made this mistake today):

{% highlight c# %}
builder.Services.AddSingleton<IAuthorizationHandler, UserCanAccessEntityHandler>();
{% endhighlight %}