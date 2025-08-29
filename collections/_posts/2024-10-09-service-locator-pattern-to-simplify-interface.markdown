---
layout: post
title: "Service Locator Pattern to provide services to an abstract base class (ASP.NET Core)"
date: 2024-10-08 08:30:00 -0500
categories: programming csharp
permalink: /service-locator-pattern-derived-services
emoji: 😇
mathjax: false
---

Today I refactored a base class of service classes in an ASP.NET Core project, so that instead of two services (`IHttpContextAccessor` and `IAuthorizationService` in this example) being injected, an `IServiceProviderWrapper` service is injected instead, and that is used to resolve the two services inside the base class. This is an implementation of the Service Locator Pattern as I understand it in this context.

This refactor was motivated by wanting to simplify the interfaces of all of the classes derived from this base class. Each derived class previously had to have a constructor signature with the two services so that it could pass them to the parent constructor. With the Service Locator Pattern, only the `IServiceProvider` is needed in the constructor signature of all the service classes. 

This post is regarding [this commit](https://github.com/eggrain/Larder/commit/9eff3842cabbd7094aaae8bfdf72ac0ece1e8484).

Here is what my base service class had previously:

{% highlight csharp %}
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

So then every class derived from it had to pass the two arguments to the parent constructor, for example:

{% highlight csharp %}
public class IngredientService(IIngredientRepository repository,
                                IHttpContextAccessor httpConAcsr,
                                IAuthorizationService authService)
        : ApplicationServiceBase(httpConAcsr, authService), IIngredientService
{% endhighlight %}

The child class is instantiated with those provided from dependency injection.

In unit tests, the system-under-test service had to have both supplied as well:

{% highlight csharp %}
FoodService sut = new(_mockFoodRepo.Object, _mockConsFoodRepo.Object,
                        mockHttpContextAccessor.Object, mockAuthorizationService.Object);
{% endhighlight %}

The change I made to try to make this interface that is needed everywhere for the derived services less inconvenient was the "service locator pattern." The [Wikipedia article](https://en.wikipedia.org/wiki/Service_locator_pattern) suggests that this can be seen as an anti-pattern due to it obscuring dependencies, but also that this could be desirable:

> [In some cases], the disadvantages may actually be considered as an advantage (e.g., no need to supply various dependencies to every class and maintain dependency configurations).

The implementation in my project was to use dependency injection to provide the `IServiceProvider` to the service base class, which is then used to access the dependency injection services to get the two services `IHttpContextAccessor` and `IAuthorizationService` which were being provided with dependency injection before.

Due to the Moq API not allowing mocking the extension methods `GetService<T>`, `GetRequiredService<T>` of `IServiceProvider`, I had to define an interface `IServiceProviderWrapper` to wrap that class to provide a non-extension method that could be mocked.

{% highlight csharp %}
namespace Larder.Services;
// Wraps IServiceProvider to be able to mock GetRequiredService<T>
// "Extension methods may not be used in setup
//                             / verification expressions." - Moq
public interface IServiceProviderWrapper
{
    public T GetRequiredService<T>() where T : notnull;
}
public class ServiceProviderWrapper(IServiceProvider serviceProvider)
                                                : IServiceProviderWrapper
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    public T GetRequiredService<T>() where T : notnull
    {
        return _serviceProvider.GetRequiredService<T>();
    }
}
{% endhighlight %}

Here is the base service class, now receiving that as the constructor parameter instead of `IHttpContextAccessor` and `IAuthorizationService` parameters:

{% highlight csharp %}
public abstract class AppServiceBase(IServiceProviderWrapper serviceProvider)
{
    private readonly IHttpContextAccessor _httpContextAccessor
                = serviceProvider.GetRequiredService<IHttpContextAccessor>();
    private readonly IAuthorizationService _authzService
                = serviceProvider.GetRequiredService<IAuthorizationService>();

    protected string CurrentUserId()
    {
        return _httpContextAccessor.HttpContext?.User?
                            .FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new ApplicationException("Current user id is missing");
    }

    protected async Task ThrowIfUserCannotAccess(EntityBase resource)
    {
        ClaimsPrincipal user = _httpContextAccessor.HttpContext?.User
            ?? throw new ApplicationException("No claims principal/ user");

        AuthorizationResult authorizationResult =
                            await _authzService.AuthorizeAsync(user, resource,
                                        UserCanAccessEntityRequirement.Name);

        if (!authorizationResult.Succeeded)
            throw new ApplicationException("Authorization did not succeed");
    }
}
{% endhighlight %}

This of course requires registering an `IServiceProviderWrapper` implementation for dependency injection in `Program.cs`: `builder.Services.AddScoped<IServiceProviderWrapper, ServiceProviderWrapper>();`

Now all of the derived service classes have a smaller constructor signature:

{% highlight csharp %}
public class IngredientService(IServiceProviderWrapper serviceProvider,
                                            IIngredientRepository repository)
                : AppServiceBase(serviceProvider), IIngredientService
{% endhighlight %}

The base class for service tests was refactored as well with this change to use the new service provider wrapper:

{% highlight csharp %}
public abstract class ServiceTestsBase
{
    protected readonly Mock<IServiceProviderWrapper> mSP;
    protected static readonly string mockUserId = Guid.NewGuid().ToString();
    protected readonly Claim mockUserClaim = new(ClaimTypes.NameIdentifier,
                                                                mockUserId);

    public ServiceTestsBase()
    {
        mSP = new Mock<IServiceProviderWrapper>();

        var mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        var mockAuthorizationService = new Mock<IAuthorizationService>();
        var mockHttpContext = new Mock<HttpContext>();
        var mockClaimsPrincipal = new Mock<ClaimsPrincipal>();

        mockHttpContextAccessor.Setup(_ => _.HttpContext)
                                            .Returns(mockHttpContext.Object);
        mockHttpContext.Setup(_ => _.User).Returns(mockClaimsPrincipal.Object);
        mockClaimsPrincipal.Setup(_ => _.FindFirst(ClaimTypes.NameIdentifier))
                                                    .Returns(mockUserClaim);
        mockAuthorizationService.Setup(_ =>
                                _.AuthorizeAsync(mockClaimsPrincipal.Object,
                                                        It.IsAny<EntityBase>(),
                                        UserCanAccessEntityRequirement.Name))
                                .ReturnsAsync(AuthorizationResult.Success());
        mSP.Setup(_ => _.GetRequiredService<IHttpContextAccessor>())
                                    .Returns(mockHttpContextAccessor.Object);
        mSP.Setup(_ => _.GetRequiredService<IAuthorizationService>())
                                    .Returns(mockAuthorizationService.Object);
    }
}
{% endhighlight %}

A unit test in a test class derived from that:

{% highlight csharp %}
UnitConversionService sut = new(mSP.Object, mockUnitRepo.Object,
                                                    mockUnitConvRepo.Object);
{% endhighlight %}

This does illustrate how dependencies are obscured by the pattern. Previously the dependency every derived service class had to `IAuthorizationService` and `IHttpContextAccessor` was explicit as they were explicitly constructor method parameters. Now with the `IServiceProviderWrapper` dependency being injected instead, it's necessary to look into the base class to see that service provider is being used to access those services.

I think that simplifying the service interface in this way is worth obscuring those dependencies, and agree that doing so in this case is desirable as I would say it is hiding that complexity in the base class. If further work requires the base class have access to another service from the dependency injection container, with this design, that change can be made in the base class without changing the signature of every derived class.