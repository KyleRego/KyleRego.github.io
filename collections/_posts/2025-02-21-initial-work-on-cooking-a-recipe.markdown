---
layout: post
title: "Work on cooking a recipe in Larder"
date: 2025-02-20 23:35:00 -0800
categories: C#
permalink: /work-on-cooking-recipe-in-larder
emoji: 🕸️
mathjax: false
---

Today I decided to do some work on cooking a recipe in Larder, which in the controller-service-repository architecture involved rewriting a method `CookRecipe` of a service class `RecipeService`; I tried to use a test-driven development approach where I wrote the unit test first and like often happens, this lead to several refactors of the design, some of which I thought were noteworthy to document my thought process. There are still many areas of the design I am not quite sure I have got the abstraction right yet. This post is mainly about [this Larder commit](https://github.com/eggrain/Larder/commit/2360d2b879904e297e462200eb101b87e8577d5d).

## Parent classes of service test classes to reuse setup

As XUnit is used for the unit test project, the constructor prepares a new instance of the service test class instance members for each test, so it is very useful for following `DRY` to prepare the system under test (the service being tested) in the constructor of the parent class for all of the unit tests:

{% highlight c# %}
public abstract class QuantityServiceTests : ServiceTestsBase
{
    protected readonly IUnitRepository _unitData = new MockUnitData();
    protected readonly IUnitConversionRepository _unitConversionData;
    protected readonly IUnitService _unitService;
    protected readonly IUnitConversionService _unitConversionService;
    protected readonly IQuantityService _sut;

    public QuantityServiceTests()
    {
        _unitConversionData = new MockUnitConversionData(_unitData);
        _unitService = new UnitService(_serviceProvider.Object, _unitData);
        _unitConversionService = new UnitConversionService(
            _serviceProvider.Object, _unitData, _unitConversionData);
        _sut = new QuantityService(
            _serviceProvider.Object, _unitService, _unitConversionService);
    }
}
{% endhighlight %}

## Refactoring of the many-to-many relationship between ingredients (items) and recipes

With the entity-component architecture of `Item`s, the core `Item` class is meant to delegate pretty much everything to components; this lead to me having an `Ingredient` component which then had a many-to-many relationship through a join table to `Recipe`. This lead to some Law of Demeter sort of issues, and with how many-to-many relationships are done in EF Core, I decided to make the join table between `Item` and `Recipe` directly instead of through an `Ingredient` component class. A many-to-many relationship in this case can be 0 on the recipes side for an item, which I think is in favor of this decision.

## Change to the way NutritionBuilder works

In the domain logic of the `CookRecipe` method, it is necessary to build up the nutritional value of the produced food items from the total nutritional value of the ingredients divided by the amount of servings produced. This involved iterating over all of the recipe ingredients and summing the total calories, grams of protein, etc. and what I realized is that having the `WithCalories` and `WithProtein` methods of `NutritionBuilder` not set the private instance variable tracking each of those:

{% highlight c# %}
public NutritionBuilder WithCholesterol(double mg)
    {
        _milligramsCholesterol = mg;
        return this;
    }
{% endhighlight %}

but instead incrementing it by that amount:

{% highlight c# %}
public NutritionBuilder WithCholesterol(double mg)
    {
        _milligramsCholesterol += mg;
        return this;
    }
{% endhighlight %}

This also turns out to be a way that value types initialized to 0 in C# is useful.

## Mock repository design

I considered that all of the repositories need to share the same data as this is how the real database works (previously I had mock implementations of `IFoodRepository` and `IIngredientRepository` that did not share data, even though both foods and ingredients are `Item`s, and repositories that needed unit data were violating the dependency injection principle by making their own mock unit repository). 

Now a shared mock unit repository instance is injected to repositories that need it, and item data is kept an item repository which has derived classes for the mock food and ingredient repositories--this is following a redesign of the production item repositories from a few days ago that mirrors that change pretty closely, and that is still a part of the design of `Larder` that I am thinking through--thinking about it right now I think I may remove the `IFoodRepository` and `IIngredientRepository` and just have `IItemRepository` with methods related to foods and ingredients moved into it since those are items. This just means methods to retrieve items that have a nutrition component and have not been consumed (foods) and items that have at least one join record to a recipe (ingredients).

## The main work and unit test

In the end this work was to start one unit test:

{% highlight c# %}
public class CookRecipeTests : RecipeServiceTestsBase
{
    [Fact]
    public async void CookChickenAndRice()
    {
        Unit tablespoons = UntaskResult(
            _unitData.Get(testUserId, "tablespoons"));
        Unit grams = UntaskResult(
            _unitData.Get(testUserId, "grams"));

        CookRecipeDto input = new()
        {
            RecipeId = "chicken-and-rice",
            ServingsProduced = 2,
            Ingredients = [
                new()
                {
                    IngredientItemId = "butter",
                    QuantityCooked = new()
                    {
                        Amount = 4,
                        UnitId = tablespoons.Id
                    }
                },
                new()
                {
                    IngredientItemId = "chicken-leg-quarters",
                    QuantityCooked = new()
                    {
                        Amount = 4
                    }
                },
                new()
                {
                    IngredientItemId = "box-rice",
                    QuantityCooked = new()
                    {
                        Amount = 7 * 56,
                        UnitId = grams.Id
                    }
                }
            ]
        };

        ItemDto result = await _sut.CookRecipe(input);

        Assert.Equal(input.ServingsProduced, result.Quantity!.Amount);
        Assert.Equal(1, result.Nutrition!.ServingSize.Amount);
    }
}
{% endhighlight %}

and rewrite the `CookRecipe` to this now:

{% highlight c# %}
public class RecipeService(IServiceProviderWrapper serviceProvider,
                                    IRecipeRepository recipeData,
                                    IIngredientRepository ingredientData,
                                    IQuantityService quantityService)
                     : AppServiceBase(serviceProvider), IRecipeService
{
    private readonly IRecipeRepository _recipeData = recipeData;
    private readonly IIngredientRepository _ingredientData = ingredientData;
    private readonly IQuantityService _quantityService = quantityService;

    public async Task<ItemDto> CookRecipe(CookRecipeDto cookRecipeDto)
    {
        Recipe recipe = await _recipeData.Get(CurrentUserId(),
                                            cookRecipeDto.RecipeId)
            ?? throw new ApplicationException(
                $"Recipe with ID {cookRecipeDto.RecipeId} not found");

        double foodServingsMade = cookRecipeDto.ServingsProduced;
        ItemBuilder cookedFoodBuilder = new ItemBuilder(CurrentUserId(), recipe.Name)
                            .WithQuantity(foodServingsMade);
        NutritionBuilder nutritionBuilder = new NutritionBuilder()
                            .WithServingSize(1);

        foreach(CookRecipeIngredientDto cookedIngredient in cookRecipeDto.Ingredients)
        {
            string cookedItemId = cookedIngredient.IngredientItemId;

            Item ingredientItem = recipe.Ingredients
                .FirstOrDefault(item => item.Id == cookedItemId)
                ?? throw new ApplicationException(
                $"Recipe is missing an ingredient item with ID ${cookedItemId}"
            );

            if (ingredientItem.Nutrition == null)
            {
                throw new ApplicationException(
                    $"Ingredient item with ID ${cookedItemId} has no Nutrition component"
                );
            }

            QuantityDto quantityCooked = await _quantityService.SubtractUpToZero(
                                (QuantityDto)ingredientItem.Quantity,
                                    cookedIngredient.QuantityCooked);

            QuantityDto quantityRemaining = await _quantityService.Subtract(
                                (QuantityDto)ingredientItem.Quantity,
                                    quantityCooked);

            ingredientItem.Quantity = Quantity.FromDto(quantityRemaining);

            Nutrition nutrition = ingredientItem.Nutrition;
            double ingredientServingsCooked;
            try
            {
                ingredientServingsCooked = await _quantityService.Divide(
                        quantityCooked,
                        (QuantityDto)nutrition.ServingSize);
            }
            catch (ApplicationException e)
            {
                throw new ApplicationException(
                    $"{e.Message} - Does ingredient item with ID {cookedItemId} have a serving size?");
            }

            nutritionBuilder
                .WithCalories(nutrition.Calories * ingredientServingsCooked / foodServingsMade)
                .WithProtein(nutrition.GramsProtein * ingredientServingsCooked / foodServingsMade)
                .WithDietaryFiber(nutrition.GramsDietaryFiber * ingredientServingsCooked / foodServingsMade)
                .WithSaturatedFat(nutrition.GramsSaturatedFat * ingredientServingsCooked / foodServingsMade)
                .WithTotalCarbs(nutrition.GramsTotalCarbs * ingredientServingsCooked / foodServingsMade)
                .WithTotalFat(nutrition.GramsTotalFat * ingredientServingsCooked / foodServingsMade)
                .WithTotalSugars(nutrition.GramsTotalSugars * ingredientServingsCooked / foodServingsMade)
                .WithTransFat(nutrition.GramsTransFat * ingredientServingsCooked / foodServingsMade)
                .WithCholesterol(nutrition.MilligramsCholesterol * ingredientServingsCooked / foodServingsMade)
                .WithSodium(nutrition.MilligramsSodium * ingredientServingsCooked / foodServingsMade);
        }

        Item newFood = cookedFoodBuilder.WithNutrition(nutritionBuilder).Build();
        Item insertedFood = await _ingredientData.Insert(newFood);

        await _recipeData.Update(recipe);
        return ItemDto.FromEntity(insertedFood);
    }
    ...
}
{% endhighlight %}

There is a refactor to do here which I didn't get to today, which was to throw an error if the nutrition serving size quantity is 0 just before and instead of where it currently is passed as the divisor argument to `Divide` inside a try-catch block that handles that problem by rethrowing it with additional context, which is not a bad thing to do in all cases but in this case I prefer throwing the error earlier. Another one I just noticed is the `ingredientServingsCooked / foodServingsMade`...
