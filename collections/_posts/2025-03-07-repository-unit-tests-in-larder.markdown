---
layout: post
title: Repository unit tests in Larder (C#)
date: 2025-03-07 12:35:00 -0800
categories: c#
permalink: /repositoryunittestsinlarder
emoji: 🕸️
mathjax: false
---

Recently I noticed a fault in my foods and ingredients inventory-taking application project Larder. The bug was the table showing foods was showing foods which had been eaten already. The location of the bug was pretty clear--the EF Core query retrieving the food items. Today I fixed the bug, and I used it as an opportunity to practice test-driven development. Since I had not previously been unit testing my repositories, the initial design of the repository unit tests that I worked on today is what I want to note in this post. 

In this app, the design/modeling of items is meant to be an entity-component architecture where an `Item` has a name and nullable properties like `Nutrition` which are the components that can belong to the `Item` entity. In the current design of the app, there is a component `ConsumedTime` which an item has if it is a food which has been eaten (in order to track nutrition over time).

Unit tests so far had focused on the services, and used mock repository implementations. Since now I wanted to test the repository, the dependency that had to be mocked was the database/`AppDbContext` (the application class derived from EF Core's `DbContext` class). I decided that the best approach to test the repositories would be to use an in-memory SQLite database for that `AppDbContext`. Since the setup of that would be shared across all of the repository tests, the first abstract class for these tests was `RepositoryTestBase`:

{% highlight c# %}
namespace Larder.Tests.Repository;

public abstract class RepositoryTestBase
{
    private readonly SqliteConnection _connection;
    protected readonly AppDbContext _dbContext;
    protected static readonly string testUserId = TestUserData.TestUserId();

    public RepositoryTestBase()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _dbContext = new AppDbContext(options);
        _dbContext.Database.EnsureCreated();

        ApplicationUser testUser = new()
        {
            Id = testUserId
        };

        _dbContext.Users.Add(testUser);
    }
}
{% endhighlight %}

This sets up an in-memory SQLite database (via the in-memory connection string) with the schema of `AppDbContext` with a test user added (I just noticed there is no call to `SaveChanges` here-one of the later calls is inserting it). `ApplicationUser` is the application user class derived from the user type from ASP.NET Core; it just adds to that the relationships to the application data (for example, model classes with `UserId` belonging to the user in many-to-one relationships).

Sharing data setup across unit tests for `ItemRepository` (which is the class with the method with the bug) necessitated a second abstract class `ItemRepositoryTestsBase`:

{% highlight c# %}
namespace Larder.Tests.Repository.ItemRepositoryTests;

public abstract class ItemRepositoryTestsBase : RepositoryTestBase
{
    protected readonly IItemRepository _sut;
    protected DateTimeOffset _foodsEatenTime = DateTimeOffset.Now;
    protected int _numEatenFoods;
    protected int _numFoods;
    protected int _numTotalItems;

    public ItemRepositoryTestsBase()
    {
        SetupGenericItems();
        SetupFoods();
        SetupConsumedFoods();
        _sut = new ItemRepository(_dbContext);
    }

    private void SetupGenericItems()
    {
        Item item1 = new ItemBuilder(testUserId, "Pencil", "For writing")
                        .Build();
    
        Item[] genericItems = [item1];

        _numTotalItems += genericItems.Length;

        _dbContext.AddRange(genericItems);
        _dbContext.SaveChanges();
    }

    private void SetupFoods()
    {
        Item food1 = new ItemBuilder(testUserId, "Toaster pastries")
                        .WithNutrition(new NutritionBuilder()
                                            .WithCalories(120)
                                            .WithProtein(2))
                        .Build();

        Item[] foods = [food1];

        int numFoods = foods.Length;

        _numFoods = numFoods;
        _numTotalItems += numFoods;

        _dbContext.AddRange(foods);
        _dbContext.SaveChanges();
    }

    private void SetupConsumedFoods()
    {
        Item consumedFood1 = new ItemBuilder(testUserId, "Apples")
                                    .WithNutrition(new NutritionBuilder()
                                                .WithCalories(100))
                                    .WithConsumedTime(new ConsumedTimeBuilder()
                                                .WithTime(_foodsEatenTime))
                                    .Build();
        Item consumedFood2  = new ItemBuilder(testUserId, "Apples")
                                    .WithNutrition(new NutritionBuilder()
                                                .WithCalories(100))
                                    .WithConsumedTime(new ConsumedTimeBuilder()
                                                .WithTime(_foodsEatenTime))
                                    .Build();

        Item[] eatenFoods = [consumedFood1, consumedFood2];
        _numEatenFoods = eatenFoods.Length;

        _dbContext.AddRange(eatenFoods);
        _dbContext.SaveChanges();
    }
}
{% endhighlight %}

This class adds `Item` data to the in-memory database for the unit tests, and has some `protected` variable members to track the expected count of various types of items, which it useful for `DRY`ness and keeping this in sync with the tests as more data is added. I expect that depending on the needs of the tests, some of this setup may possibly need to be pushed up into the `RepositoryTestsBase` later.

This is the unit test I wrote to start the red-green-refactor cycle:

{% highlight c# %}
namespace Larder.Tests.Repository.ItemRepositoryTests;

public class GetAllFoodsTests : ItemRepositoryTestsBase
{
    [Fact]
    public async void GetAllFoodsDoesNotReturnConsumedFoods()
    {
        List<Item> result = await _sut.GetAllFoods(testUserId);

        Assert.Equal(_numFoods, result.Count);

        foreach (Item item in result)
        {
            Assert.Null(item.ConsumedTime);
        }
    }
}
{% endhighlight %}

This is the method with the bug being tested--the method was also renamed to `GetAllFoods` so that the corresponding unit test file could have the name `GetAllFoodsTests.cs`--before the tests, there were a few methods `GetAll` overloaded by the `sortBy` argument having a different enum type for the different kinds of items:

{% highlight c# %}
public Task<List<Item>> GetAll(string userId,
            FoodSortOptions sortBy = FoodSortOptions.AnyOrder, string? search = null)
    {
        var query = _dbContext.Items
                                .Include(item => item.Nutrition)
                                .Where(item =>
            item.UserId == userId && item.Nutrition != null);


        query = (search == null) ? query : query.Where(
            food => food.Name.Contains(search)
        );

        switch(sortBy)
        {
            case FoodSortOptions.Name:
                query = query.OrderBy(item => item.Name);
                break;

            ...

            default:
                break;
        }

        return query.ToListAsync();
    }
{% endhighlight %}

Fixing the issue just required changing this part to specify that it should only retrieve the foods where there is no `ConsumedTime` component:

{% highlight c# %}
var query = _dbContext.Items
                    .Include(item => item.Nutrition)
                    .Where(item =>
item.UserId == userId && item.Nutrition != null
&& item.ConsumedTime == null);
{% endhighlight %}

## Takeaways

It seems to be a good approach for tests of a class to derive from an abstract class which sets up an instance to act as the system under test. With XUnit, the test setup is run before each test, so the tests remain idempotent while sharing the setup. Using an in-memory SQLite database to test EF Core repositories also seems to be a good approach, especially if the production database is SQLite (which is true of Larder). It is possible that some feature differences between in-memory and on disk databases might have to be considered, and at that point it would be good to have some integration tests testing against a real database.