---
layout: post
title: "Mock repositories vs Moq"
date: 2025-02-09 02:35:00 -0800
categories: programming C#
permalink: /mock-repositories-vs-moq
emoji: 🕸️
mathjax: false
---

In my ASP.NET Core web API project `Larder` I try to follow the dependency inversion principle with services injected into controllers as interfaces, repositories and services injected into services as interfaces. This allows for fast running unit tests, but in my previous approach, I was using Moq to stub repository method calls, and I found this added a lot of work to set up each unit test with stuff like this:

{% highlight c# %}
_mockFoodRepo.Setup(m =>
            m.Update(foodItem)
        ).ReturnsAsync(foodItem);
{% endhighlight %}

and for testing that database updates were done with the expected result, the assertion had to be done indirectly by testing that the mock repository was receiving the correct value:

{% highlight c# %}
_mockFoodRepo.Verify(_ => _.Update(It.Is<Item>(item =>
            item != null && item.Quantity != null && item.Quantity.Amount == expectedNewQuantity.Amount
        )), Times.Once);
{% endhighlight %}

instead of asserting against the return value of the system under test method call. With services returning non-entity (in the object-relational mapping Entity Framework Core entity refers to a type mapped to the database table) types, and sometimes in my app as tuples, I found it was necessary to make assertions like for the database entity. There are multiple lambda expressions needed, specifying the generic type of `It.Is<T>`, checks for null values, it really adds to the work of writing the test.

I decided to try a different approach where instead I implement mock repository classes for the tests, to define some test user data that can be used across tests:

{% highlight c# %}
public class MockFoodData : MockRepositoryBase, IFoodRepository
{
    private readonly List<Item> foodItems = [];

    public MockFoodData()
    {
        Item apples = new(testUserId, "apples")
        {
            Id = "apples",
            Quantity = new() { Amount = 4 }
        };
        Nutrition applesNutrition = new()
        {
            Item = apples,
            Calories = 100,
            GramsProtein = 2
        };
        apples.Nutrition = applesNutrition;

        Unit grams = new(testUserId, "grams", UnitType.Mass);

        Item peanutButter = new(testUserId, "Peanut Butter")
        {
            Id = "peanut-butter",
            Quantity = new() { Amount = 189, Unit = grams, UnitId = grams.Id }
        };

        Nutrition peanutButterNutrition = new()
        {
            Item = peanutButter,
            Calories = 190,
            GramsProtein = 8
        };
        peanutButter.Nutrition = peanutButterNutrition;

        foodItems.AddRange([apples, peanutButter]);
    }

    ...
}
{% endhighlight %}

I found this to be a better approach for my app which has pretty much every record with a `UserId` and so setting up a mock repository implementation for a single user (and possibly in the future a few users depending on how the app evolves) is useful across many tests and makes writing more tests easier.

I am still going to use Moq in my unit tests, but in a more limited way than typical internal app-specific test data that will be needed all over the place. For example, in the abstract parent class for the service unit test classes in the project, the current way the mock authorization service, HTTP context service that retrieves the claims principal (Microsoft security term for a user or a claim that the user is this string ID), claim types name identifier (the same ID as the claims principal), etc uses the Moq API, and Moq is certainly useful for that.
