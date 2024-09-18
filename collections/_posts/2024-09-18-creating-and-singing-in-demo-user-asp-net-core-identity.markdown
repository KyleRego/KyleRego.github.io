---
layout: post
title: "Creating and signing in a user with ASP.NET Core Identity (in a service)"
date: 2024-09-18 08:30:00 -0500
categories: programming csharp
permalink: /creating-and-signing-in-demo-user-asp-net-identity
emoji: 😇
mathjax: false
---

As I implemented resource-based authorization in my project recently, I also did the initial work of a demo feature, where clicking this "Try it out!" button will create a demo user and sign that user in:

![Home page of Larder](assets/larder/larder-try-it-out.png)

After clicking the button (this is the same app with a larger screen width):

![Foods page of Larder seen after trying demo](assets/larder/larder-unauthenticated.png)

This is just the starting point of this feature, which I hope will help drive engagement. The next work for this will be to decide on what the initial data for the demo user should be to show how the app is useful. As more features are developed, the demo can be updated with more initial data to show them well.

The main hurdle to overcome was figuring out the ASP.NET Core Identity API to use. Usually user creation and signing in with ASP.NET Core Identity is done through ASP.NET Core Identity web API endpoints that accept requests with data from HTML forms. In this case, I want to create and sign in the user without using those web API endpoints at all. Here is how I have this currently:

{% highlight c# %}
public class DemoService(UserManager<ApplicationUser> userManager,
                        SignInManager<ApplicationUser> signInManager,
                        IFoodService foodService,
                        IRecipeService recipeService,
                        IUnitService unitService) : IDemoService
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
    private readonly IFoodService _foodService = foodService;
    private readonly IRecipeService _recipeService = recipeService;
    private readonly IUnitService _unitService = unitService;

    public async Task CreateDemo()
    {
        string userName = $"demo-user-{Guid.NewGuid()}@larder.lol";

        ApplicationUser demoUser = new()
        {
            UserName = userName
        };

        IdentityResult result = await _userManager.CreateAsync(demoUser);

        if (!result.Succeeded)
        {
            throw new ApplicationException("Unable to create the demo user");
        }

        await _signInManager.SignInAsync(demoUser, false);
    }
}
{% endhighlight %}

The two services to inject are the `UserManager<T>` and `SignInManager<T>` with `T` being either `IdentityUser` or a child class that you derive from it. This is what mine looks like at the moment:

{% highlight c# %}
using Microsoft.AspNetCore.Identity;

namespace Larder.Models;

public class ApplicationUser : IdentityUser
{
    public List<Food> Foods { get; set; } = [];
    public List<Ingredient> Ingredients { get; set; } = [];
    public List<Recipe> Recipes { get; set; } = [];
    public List<Unit> Units { get; set; } = [];
}
{% endhighlight %}

The reason for generating a GUID and assigning it to the `UserName` property of the `demoUser` is to ensure every user has a unique name, which is a reason why `if (!result.Succeeded)` there would skip.

# Aside

I think the `AllowCredentials()` call here is needed here (adding the CORS policy) to set the `Set-Cookie` response header in the response:

{% highlight c# %}
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicyName,
        policy =>
        {
            policy.AllowAnyHeader()
                .AllowAnyMethod()
                .WithOrigins(clientReactAppOrigin)
                .AllowCredentials();
        });
});
{% endhighlight %}

On the client side, the Fetch API should be used with `credentials: "include"` to send the cookies with requests and also grab the `Set-Cookie` value from responses.
