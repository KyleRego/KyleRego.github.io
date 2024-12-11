---
layout: post
title: "Note on mixing constructor and object initialization syntax with EF Core entity classes"
date: 2024-11-03 08:30:00 -0500
categories: programming bootstrap selenium
permalink: /ef-core-constructor-and-object-initialization-syntax
emoji: 😇
mathjax: false
---

I had a small realization today about a different way to instantiate EF Core entities compared to what I've been doing. In the past when defining constructor methods for my EF Core entity classes, I encountered some problems with EF Core throwing errors with the constructor not being suitable, which made me avoid defining constructors and instead just use object initialization syntax everywhere like so:

{% highlight C# %}
RecipeIngredient recipeIngredient = new()
{
    UserId = CurrentUserId(),
    RecipeId = recipe.Id,
    IngredientId = ingItem.Id,
    Quantity = new()
    {
        Amount = ingredientDto.Quantity.Amount,
        UnitId = ingredientDto.Quantity.UnitId
    }
};
{% endhighlight %}

for this entity class:

{% highlight C# %}
public class RecipeIngredient : UserOwnedEntity
{
    [Required]
    public required string RecipeId { get; set; }

    [ForeignKey(nameof(RecipeId))]
    public Recipe? Recipe { get; set; }

    [Required]
    public required string IngredientId { get; set; }

    [ForeignKey(nameof(IngredientId))]
    public Ingredient Ingredient { get; set; } = null!;

    public required Quantity Quantity { get; set; } = new() { Amount = 1 };
}
{% endhighlight %}

or 

{% highlight C# %}
UnitConversion unitConversion = new()
{
    UserId = CurrentUserId(),
    UnitId = unit.Id,
    TargetUnitId = targetUnit.Id,
    UnitType = unit.Type,
    TargetUnitsPerUnit = dto.TargetUnitsPerUnit
};
{% endhighlight %}

for 

{% highlight C# %}
public class UnitConversion : UserOwnedEntity
{
    public required string UnitId { get; set; }
    public Unit? Unit { get; set; }

    public required string TargetUnitId { get; set; }
    public Unit? TargetUnit { get; set; }

    public double TargetUnitsPerUnit { get; set; }

    public UnitType UnitType { get; set; }
}
{% endhighlight %}

This works fine but it is a more verbose syntax compared to using a constructor in the usual way:

{% highlight C# %}
RecipeIngredient recipeIngredient = new(CurrentUserId(), recipe.Id, ingItem.Id, quantity);
{% endhighlight %}

{% highlight C# %}
UnitConversion unitConversion = new(userId, unit.Id, targetUnit.Id,
                                            targetUnitsPerUnit, unit.Type);
{% endhighlight %}

with the entities now being:

{% highlight C# %}
public class RecipeIngredient(  string userId,
                                string recipeId,
                                string ingredientId,
                                Quantity? quantity) 
                                            : UserOwnedEntity(userId)
{
    [Required]
    public string RecipeId { get; set; } = recipeId;

    [ForeignKey(nameof(RecipeId))]
    public Recipe? Recipe { get; set; }

    [Required]
    public string IngredientId { get; set; } = ingredientId;

    [ForeignKey(nameof(IngredientId))]
    public Ingredient Ingredient { get; set; } = null!;

    public Quantity Quantity { get; set; } = quantity ?? new() { Amount = 1 };
}
{% endhighlight %}

and 

{% highlight C# %}
public class UnitConversion(string userId, string unitId, string targetUnitId,
                                    double targetUnitsPerUnit, UnitType type)
                                                    : UserOwnedEntity(userId)
{
    public string UnitId { get; set; } = unitId;
    public Unit? Unit { get; set; }

    public string TargetUnitId { get; set; } = targetUnitId;
    public Unit? TargetUnit { get; set; }

    public double TargetUnitsPerUnit { get; set; } = targetUnitsPerUnit;

    public UnitType UnitType { get; set; } = type;
}
{% endhighlight %}

This is using the primary constructor syntax, and the `required` keyword on properties was removed as I found it wasn't satisfied when using constructor parameters like this (it is satisfied using object initialization syntax).

This was working for me today while writing unit tests, but on actually `dotnet run`ing the application, I got the same kind of EF Core errors on startup that had steered me away from using constructors before. Here is some of the output:

```
Unhandled exception. System.InvalidOperationException: No suitable constructor was found for entity type 'RecipeIngredient'. The following constructors had parameters that could not be bound to properties of the entity type:
    Cannot bind 'quantity' in 'RecipeIngredient(string userId, string recipeId, string ingredientId, Quantity quantity)'
Note that only mapped properties can be bound to constructor parameters. Navigations to related entities, including references to owned types, cannot be bound.
```

And so the realization I had is that a better approach is to mix the constructor initialization with object initialization syntax:

{% highlight C# %}
public class RecipeIngredient(  string userId,
                                string recipeId,
                                string ingredientId) 
                                            : UserOwnedEntity(userId)
{
    [Required]
    public string RecipeId { get; set; } = recipeId;

    [ForeignKey(nameof(RecipeId))]
    public Recipe? Recipe { get; set; }

    [Required]
    public string IngredientId { get; set; } = ingredientId;

    [ForeignKey(nameof(IngredientId))]
    public Ingredient Ingredient { get; set; } = null!;

    public required Quantity Quantity { get; set; } = new() { Amount = 1 };
}
{% endhighlight %}

{% highlight C# %}
public class UnitConversion(string userId,
                            string unitId,
                            string targetUnitId,
                            double targetUnitsPerUnit)
                                            : UserOwnedEntity(userId)
{
    public string UnitId { get; set; } = unitId;
    public Unit? Unit { get; set; }

    public string TargetUnitId { get; set; } = targetUnitId;
    public Unit? TargetUnit { get; set; }

    public double TargetUnitsPerUnit { get; set; } = targetUnitsPerUnit;

    public required UnitType UnitType { get; set; }
}
{% endhighlight %}

This results in a less verbose syntax than using only object initialization syntax:

{% highlight C# %}
RecipeIngredient newRecipeIngredient
                            = new(CurrentUserId(), recipe.Id, ingItem.Id)
{
    Quantity = Quantity.FromDto(ingDto.Quantity)
};
{% endhighlight %}

{% highlight C# %}
UnitConversion unitConversion
            = new(userId, unit.Id, targetUnit.Id, targetUnitsPerUnit)
{
    UnitType = targetUnit.Type
};
{% endhighlight %}

and the `required` keyword can be applied to the properties being set with object initialization syntax as well.

So this is the approach I am going to use: properties with value and string types will be set through a constructor, and `required` properties, reference navigations, enum types like `UnitType` above, and any others that EF Core does not like in the constructor will be set with object initialization syntax. 
