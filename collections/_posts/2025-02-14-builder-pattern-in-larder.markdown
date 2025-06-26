---
layout: post
title: "Builder pattern in Larder (C#)"
date: 2025-02-14 01:35:00 -0800
categories: linux
permalink: /builder-pattern-in-larder
emoji: 🕸️
mathjax: false
---

In the past I noted [some thoughts on object initialization syntax vs constructors with Entity Framework Core entities](/ef-core-constructor-and-object-initialization-syntax). The post was mainly a note that not all properties of an EF Core entity type could be set via a constructor (for example, navigation properties cannot be) and that a mix of object initialization syntax with some properties set by the constructor resulted in a more concise syntax for instantiating objects, for example:

{% highlight c# %}
Item peanutButter = new(testUserId, "Peanut Butter")
{
    Id = "peanut-butter",
    Quantity = new() { Amount = 189, Unit = grams, UnitId = grams.Id }
};
{% endhighlight %}

The `UserId` and `Name` properties of the `Item` are set via the constructor and object initialization syntax is used to set the `Id` and `Quantity`. This is more concise than if every property was set with object initialization syntax, but object initialization syntax may still be needed for properties of types that cannot be set by the constructor (EF Core will complain about not being able to find a suitable constructor at runtime).

When I was working on some unit tests, I decided that it would be worth implementing the Builder pattern for object creation, which would be an improvement on the above. In my application, the design of `Item` is inspired by an entity-component architecture where `Item` has a name, description, and quantity, and can for example have a `Nutrition` component like if the item is a food or ingredient. Currently that looks like this:

{% highlight c# %}
public class Item(string userId, string name, string? description = null)
                                                : UserOwnedEntity(userId)
{
    ...

    public string Name { get; set; } = name;

    public string? Description { get; set; } = description;

    public required Quantity Quantity { get; set; }

    public Nutrition? Nutrition { get; set; }

    ...
}

public abstract class ItemComponent : EntityBase
{
    public string? ItemId { get; set; }

    [ForeignKey(nameof(ItemId))]
    public required Item Item { get; set; }
}

public class Nutrition : ItemComponent
{
    public Quantity ServingSize { get; set; }
            = new() { Amount = 1, UnitId = null};

    public double Calories { get; set; }

    public double GramsProtein { get; set; }

    ...
}

{% endhighlight %}

and so in order to instantiate an `Item` with a `Nutrition` component, the syntax was like so:

{% highlight c# %}
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
{% endhighlight %}

which felt clunky to me and thus I felt it would be worth introducing a Builder. This was the first version:

{% highlight c# %}
public class ItemBuilder(string userId, string name,
                                string? description = null)
{
    private readonly string _userId = userId;
    private readonly string _name = name;
    private readonly string? _description = description;
    private string _id = Guid.NewGuid().ToString();
    private Quantity _quantity = Quantity.One();
    private readonly List<Action<Item>> _componentSetters = [];

    public ItemBuilder WithId(string id)
    {
        _id = id;
        return this;
    }

    public ItemBuilder WithQuantity(Quantity quantity)
    {
        _quantity = quantity;
        return this;
    }

    public ItemBuilder WithQuantity(double amount, Unit? unit = null)
    {
        _quantity = new()
        {
            Amount = amount,
            UnitId = unit?.Id
        };
        return this;
    }

    public ItemBuilder WithNutrition(double calories, double gramsProtein)
    {
        _componentSetters.Add(item =>
        {
            item.Nutrition = new Nutrition
            {
                Item = item,
                ItemId = item.Id,
                Calories = calories,
                GramsProtein = gramsProtein
            };
        });
        return this;
    }

    public Item Build()
    {
        Item item = new(_userId, _name, _description)
        {
            Id = _id,
            Quantity = _quantity
        };
        foreach (var setter in _componentSetters)
        {
            setter(item);
        }
        return item;
    }
}
{% endhighlight %}

As the `Item` must exist to instantiate the `Nutrition` component with, it was not possible to have an `ItemBuilder` with a method that takes a `Nutrition` as an argument, or `Nutrition` properties (like serving size, grams protein) as arguments to add a `Nutrition`--with the Builder, the `Item` does not get made until `Build` is called. So it was necessary to have a two step build process where in `Build` the item is instantiated and then the `Nutrition` component is attached by a callback in `_componentSetters`, which is added by the `WithNutrition` method.

With that, this:

{% highlight c# %}
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
{% endhighlight %}

becomes:

{% highlight c# %}
Item peanutButter = new ItemBuilder(testUserId, "Peanut Butter")
            .WithQuantity(189, grams)
            .WithNutrition(190, 8)
            .Build();
{% endhighlight %}

This approach was an improvement, however I did not like a method call like `.WithNutrition(190, 8)` which I felt could lead to faults where a nutrition amount was given to the wrong parameter, for example assigning the total grams of carbohydrates to the total grams of sugars. In order to have methods like `WithCalories` and `WithTotalFat` which would avoid that potential pitfall, the second design involved separate `ItemBuilder` and `NutritionBuilder` classes (which is also what I wanted as I felt that made sense). For that to work, the `ItemBuilder` has a `WithNutrition` method that takes a `NutritionBuilder`:

{% highlight c# %}
public class ItemBuilder(string userId, string name,
                                string? description = null)
{
    private readonly string _userId = userId;
    private readonly string _name = name;
    private readonly string? _description = description;
    private string _id = Guid.NewGuid().ToString();
    private Quantity _quantity = Quantity.One();
    private NutritionBuilder? _nutritionBuilder;

    public ItemBuilder WithId(string id)
    {
        _id = id;
        return this;
    }

    public ItemBuilder WithQuantity(Quantity quantity)
    {
        _quantity = quantity;
        return this;
    }

    public ItemBuilder WithQuantity(double amount, Unit? unit = null)
    {
        _quantity = new()
        {
            Amount = amount,
            UnitId = unit?.Id
        };
        return this;
    }

    public ItemBuilder WithNutrition(NutritionBuilder nutritionBuilder)
    {
        _nutritionBuilder = nutritionBuilder;
        return this;
    }

    public Item Build()
    {
        Item item = new(_userId, _name, _description)
        {
            Id = _id,
            Quantity = _quantity
        };

        if (_nutritionBuilder is not null)
        {
            item.Nutrition = _nutritionBuilder.Build(item);
        }

        return item;
    }
}

public class NutritionBuilder
{
    private Quantity _servingSize = Quantity.One();
    private double _calories;
    private double _gramsProtein;
    private double _gramsTotalFat;
    private double _gramsSaturatedFat;
    private double _gramsTransFat;
    private double _milligramsCholesterol;
    private double _milligramsSodium;
    private double _gramsTotalCarbs;
    private double _gramsDietaryFiber;
    private double _gramsTotalSugars;

    public NutritionBuilder WithServingSize(Quantity servingSize)
    {
        _servingSize = servingSize;
        return this;
    }

    public NutritionBuilder WithServingSize(double amount, Unit unit)
    {
        _servingSize = new()
        {
            Amount = amount,
            UnitId = unit?.Id
        };
        return this;
    }

    public NutritionBuilder WithCalories(double calories)
    {
        _calories = calories;
        return this;
    }

    public NutritionBuilder WithProtein(double gramsProtein)
    {
        _gramsProtein = gramsProtein;
        return this;
    }

    public NutritionBuilder WithTotalFat(double grams)
    {
        _gramsTotalFat = grams;
        return this;
    }

    public NutritionBuilder WithSaturatedFat(double grams)
    {
        _gramsSaturatedFat = grams;
        return this;
    }

    public NutritionBuilder WithTransFat(double grams)
    {
        _gramsTransFat = grams;
        return this;
    }

    public NutritionBuilder WithCholesterol(double mg)
    {
        _milligramsCholesterol = mg;
        return this;
    }

    public NutritionBuilder WithSodium(double mg)
    {
        _milligramsSodium = mg;
        return this;
    }

    public NutritionBuilder WithTotalCarbs(double grams)
    {
        _gramsTotalCarbs = grams;
        return this;
    }

    public NutritionBuilder WithDietaryFiber(double grams)
    {
        _gramsDietaryFiber = grams;
        return this;
    }

    public NutritionBuilder WithTotalSugars(double grams)
    {
        _gramsTotalSugars = grams;
        return this;
    }

    public Nutrition Build(Item item)
    {
        return new Nutrition
        {
            Item = item,
            ItemId = item.Id,
            ServingSize = _servingSize,
            Calories = _calories,
            GramsProtein = _gramsProtein,
            GramsTotalFat = _gramsTotalFat,
            GramsSaturatedFat = _gramsSaturatedFat,
            GramsTransFat = _gramsTransFat,
            MilligramsCholesterol = _milligramsCholesterol,
            MilligramsSodium = _milligramsSodium,
            GramsTotalCarbs = _gramsTotalCarbs,
            GramsDietaryFiber = _gramsDietaryFiber,
            GramsTotalSugars = _gramsTotalSugars
        };
    }
}
{% endhighlight %}

and with this, the instantiation of peanut butter above is:

{% highlight c# %}
Item peanutButter = new ItemBuilder(testUserId, "Peanut Butter")
            .WithId("peanut-butter")
            .WithQuantity(189, grams)
            .WithNutrition(new NutritionBuilder()
                    .WithCalories(190)
                    .WithProtein(2))
            .Build();
{% endhighlight %}

and an example using more of the `NutritionBuilder` API:

{% highlight c# %}
Item wheatBread = new ItemBuilder(testUserId, "Wheat bread")
            .WithId("wheat-bread")
            .WithQuantity(21, breadSlices)
            .WithNutrition(new NutritionBuilder()
                    .WithServingSize(1, breadSlices)
                    .WithCalories(60)
                    .WithTotalFat(1)
                    .WithSaturatedFat(0)
                    .WithTransFat(0)
                    .WithCholesterol(0)
                    .WithSodium(100)
                    .WithTotalCarbs(12)
                    .WithDietaryFiber(2)
                    .WithTotalSugars(1)
                    .WithProtein(3))
            .Build();
{% endhighlight %}

With this, the syntax for instantiating `Item`s is much more fluent and intuitive and will reduce the effort of writing more unit tests in my application, so overall I am happy with the `Builder` pattern and for now plan to continue to extend this design with additional component builders as more item components are introduced to the project.