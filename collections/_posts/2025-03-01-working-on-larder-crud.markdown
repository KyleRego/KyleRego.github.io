---
layout: post
title: ICrudServiceBase&lt;TDto, TEntity&gt; and ICrudRepositoryBase&lt;TEntity&gt (C#)
date: 2025-03-01 12:35:00 -0800
categories: c#
permalink: /icrudservicetdotentityandicrudrepositorytentity
emoji: 🕸️
mathjax: false
---

There are many issues I've been grappling with in developing a practice project with controller-service-repository architecture ([Larder](https://larder.lol)), for example:

- From what layers should dependencies be injected from into other layers (should this service `QuantityService` use `UnitConversionService` or `UnitConversionRepository` to retrieve a unit conversion it needs)?
- Where to use entities vs data transfer objects (should services only return data transfer objects)?
- How to map between DTOs and entities (such as static methods like `public static Quantity FromDto(QuantityDto dto)`, defining explicit cast operators, by service methods like in the example this post is about, [AutoMapper](https://automapper.org/))?
- Many design problems regarding the inheritance hierarchies (for example [when I changed the parent class of services to inject a `Service Locator` instead of two dependencies](/service-locator-pattern-derived-services)--update on that post, `AppServiceBase` was changed to not need one of those dependencies anymore, and that change was made easily without having to refactor any of the derived classes as a result of using the `Service Locator` pattern).

Recently I did some work related to this last issue, specifically using inheritance and generic types to DRY up CRUD functionality.

## Background

In the controller-service-repository architecture, controllers have the responsibility of binding incoming HTTP data and sending HTTP responses (choosing the type of response). Controllers delegate business logic to services, and neither controllers nor services do any data access themselves. The repositories are responsible for data access, which allows for fast running unit tests with mock repository implementations or stubbing the return values of the repositories.

In addition to controllers, services, and repositories, data transfer objects and entities are types relevant to the design. Data transfer objects are used to define the API service of the web application, and in ASP.NET Core Model Binding, DTO types used in action method parameters are automatically instantiated from the data in the HTTP requests (400 response given if not possible). Entities refers to types mapped to the database in the Entity Framework Core ORM mapping.

A potential issue with this kind of design is the following. Consider a situation where there are multiple types which need a RESTful controller and CRUD functionality implemented. Any type like that will need a controller with action methods to respond to `GET /books`, `GET /books/id`, `POST /books`, `PUT /books/id`, `DELETE /books/id`, which delegates to a service with 5 methods to be used by those actions, which will use a repository again with 5 methods doing the data access, and the service methods are pretty much just pass-through methods calling the repository method and mapping the entity type to a data transfer object (in the case like my application where services return data transfer objects--in some cases I believe there may be domain specific non-DTO and non-entity types used by services).

## ICrudServiceBase and ICrudRepositoryBase

To avoid this problem of code duplication in my practice project, I decided to implement `ICrudServiceBase<TDto, TEntity>`:

{% highlight c# %}
namespace Larder.Services.Interface;

public interface ICrudServiceBase<TDto, TEntity>
    where TDto : EntityDto<TEntity> where TEntity : UserOwnedEntity
{
    public Task<TDto?> Get(string id);
    public Task<TDto> Add(TDto dto);
    public Task<List<TDto>> AddAll(List<TDto> dtos);
    public Task<TDto> Update(TDto dto);
    public Task Delete(string id);
}
{% endhighlight %}

and

{% highlight c# %}
namespace Larder.Repository.Interface;

public interface ICrudRepositoryBase<T> where T : UserOwnedEntity
{
    public Task<T?> Get(string userId, string id);
    public Task<T> Insert(T newEntity);
    public Task<List<T>> InsertAll(List<T> newEntities);
    public Task<T> Update(T editedEntity);
    public Task Delete(T entity);
}
{% endhighlight %}

which use C# generic types as well as constraints to constrain `TEntity` to be a `UserOwnedEntity` (in my app this parent class has the `UserId` property so the record belongs to a user) and constraint `TDto` to be derived from a new class `TEntityDto<TEntity>` which I introduced for the purpose of constraining it here as well as because the class implementing `ICrudServiceBase` will have two abstract methods that derived classes will need to implement to determine how the mapping between the entity and DTO is accomplished (`MapToEntity` and `MapToDto`):

{% highlight c# %}
namespace Larder.Services.Impl;

public abstract class CrudServiceBase<TDto, TEntity>
                        (IServiceProviderWrapper serviceProvider,
                        ICrudRepositoryBase<TEntity> repository)
        : AppServiceBase(serviceProvider),
            ICrudServiceBase<TDto, TEntity>
    where TDto : EntityDto<TEntity>
    where TEntity : UserOwnedEntity
{
    protected readonly ICrudRepositoryBase<TEntity>
        _repository = repository;

    protected abstract Task<TEntity> MapToEntity(TDto dto);
    protected abstract TDto MapToDto(TEntity entity);

    public async Task<TDto> Add(TDto dto)
    {
        TEntity entity = await MapToEntity(dto);
        TEntity insertedEntity = await _repository.Insert(entity);
        return MapToDto(insertedEntity);
    }

    public async Task Delete(string id)
    {
        TEntity? entity = await _repository.Get(CurrentUserId(), id);

        if (entity != null)
            await _repository.Delete(entity);
    }

    public async Task<TDto?> Get(string id)
    {
        TEntity? entity = await _repository.Get(CurrentUserId(), id);
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<TDto> Update(TDto dto)
    {
        TEntity entity = await MapToEntity(dto);
        TEntity updatedEntity = await _repository.Update(entity);
        return MapToDto(updatedEntity);
    }

    public async Task<List<TDto>> AddAll(List<TDto> dtos)
    {
        List<TEntity> entities = [];

        foreach (TDto dto in dtos)
        {
            TEntity ntt = await MapToEntity(dto);
            entities.Add(ntt);
        }

        List<TEntity> inserted = await _repository.InsertAll(entities);

        return [.. inserted.Select(MapToDto)];
    }
}
{% endhighlight %}

### How this restricts services to use services instead of repositories

An implication/intention of this design is also that services will only use services for data access, with the exception that services implementing `ICrudServiceBase` derived from `CrudServiceBase` get a repository implementing `ICrudRepositoryBase` for the entity type relevant to that service.

### Why MapToEntity returns a Task

The reason for `MapToEntity` being asynchronous is due to my design decision in `RecipeService` to create items for ingredients that do not exist already for the user (`ItemDto ingItem = await _itemService.FindOrCreate(ingredientDto.Name);` in the following). In other words, a recipe has many ingredient items, and so it may be necessary to create the ingredient items in mapping the recipe DTO to a recipe entity which includes those items.

{% highlight c# %}
protected async override Task<Recipe> MapToEntity(RecipeDto recipeDto)
{
    Recipe recipe = new(CurrentUserId(), recipeDto.Name);

    List<RecipeIngredient> recipeIngredients = [];

    foreach (RecipeIngredientDto ingredientDto in recipeDto.Ingredients)
    {
        if (ingredientDto.Quantity.UnitId == "")
        {
            ingredientDto.Quantity.UnitId = null;
        }

        ItemDto ingItem = await _itemService.FindOrCreate(ingredientDto.Name);

        Quantity quantity = new()
        {
            Amount = ingredientDto.Quantity.Amount,
            UnitId = ingredientDto.Quantity.UnitId
        };

        RecipeIngredient recipeIngredient = new(CurrentUserId(), recipe.Id, ingItem.Id!)
        {
            DefaultQuantity = quantity
        };

        recipeIngredients.Add(recipeIngredient);
    }

    recipe.RecipeIngredients = recipeIngredients;

    return recipe;
}
{% endhighlight %}

The class implementation of `ICrudRepositoryBase` has an abstract `Get` method so that derived classes can determine what related entities are eager-loaded:

{% highlight c# %}
public abstract class CrudRepositoryBase<T>(AppDbContext dbContext)
                                : ICrudRepositoryBase<T>
                                            where T : UserOwnedEntity
{
    protected readonly AppDbContext _dbContext = dbContext;
    protected readonly DbSet<T> _dbSet = dbContext.Set<T>();
    public abstract Task<T?> Get(string userId, string id);

    public async Task<T> Insert(T newEntity)
    {
        ArgumentNullException.ThrowIfNull(newEntity);

        _dbContext.Add(newEntity);

        await _dbContext.SaveChangesAsync();

        return newEntity;
    }

    public async Task<List<T>> InsertAll(List<T> newEntities)
    {
        ArgumentNullException.ThrowIfNull(newEntities);

        await _dbSet.AddRangeAsync(newEntities);
        await _dbContext.SaveChangesAsync();

        return [.. newEntities];
    }

    public async Task<T> Update(T editedEntity)
    {
        ArgumentNullException.ThrowIfNull(editedEntity);

        _dbContext.Entry(editedEntity).State = EntityState.Modified;

        await _dbContext.SaveChangesAsync();

        return editedEntity;
    }

    public async Task Delete(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);

        _dbContext.Entry(entity).State = EntityState.Deleted;

        await _dbContext.SaveChangesAsync();
    }
}
{% endhighlight %} 

With this work, the next step may be to do the same for controllers and implement `IRestControllerBase<TDto>` which would in principle be very similar.

In my opinion, using inheritance and generic types to implement common functionality like CRUD and REST methods is probably a good idea in most implementations of controller-service-repository architecture, with the details being specific to what the application's needs are. The next time I start a practice project intending to follow this kind of architecture, I will probably begin with fleshing out something like these types at the beginning.
