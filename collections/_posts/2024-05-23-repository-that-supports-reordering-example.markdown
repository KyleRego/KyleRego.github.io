---
layout: post
title: "OrderedElementRepositoryBase in AnkiBooks"
date: 2024-05-23 00:00:00 -0500
categories: blogging
permalink: /ordered-element-repository-base-in-ankibooks
emoji: 🫥
mathjax: false
---

In my app, an article can have many elements, and each article element has a unique ordinal position from 0 up to 1 less than the total number of elements in the article. For example, an article can have a deck at position 0, a different kind of article element at position 1, and so on, and the elements can be reordered with drag and drop.

The article element classes derive from a base class and are stored in one database table with a discriminator column (I would call this single table inheritance but in EF Core it is called table-per-hierarchy mapping). There is a database constraint on this table that enforces uniqueness of the ordinal position for the elements of the same article. To change the ordinal position of an element without violating the constraint, some of the other elements need to be shifted up or down. Similarly, the sibling elements need to be shifted when adding a new element or deleting one.

The app uses a Clean Architecture approach where data access is encapsulated in an Infrastructure project that uses the Repository design pattern. Reordering things may not seem like a concern of the infrastructure layer, but in this case, it is necessary to do during data access with those ordered records.

My current approach is of an abstract repository interface with an API for create, update, and delete of an ordinal child entity:

{% highlight c# %}
namespace AnkiBooks.ApplicationCore.Repository;

public interface IOrderedElementRepository<T> where T : IOrdinalChild
{
    Task<T> InsertOrderedElementAsync(T element);

    Task DeleteOrderedElementAsync(T element);

    Task<T> UpdateOrderedElementAsync(T element);
}
{% endhighlight %}

This is in the application core project of the clean architecture; the infrastructure project will provide the implementation.

This is the `IOrdinalChild` interface:

{% highlight c# %}
namespace AnkiBooks.ApplicationCore.Interfaces;

public interface IOrdinalChild : IEntityBase
{
    public int OrdinalPosition { get; set; }
}
{% endhighlight %}

This is the base class for article element entity classes:

{% highlight c# %}
namespace AnkiBooks.ApplicationCore.Entities;

public abstract class ArticleElement : EntityBase, IArticleElement, IOrdinalChild
{
    [Required]
    public string? ArticleId { get; set; }

    [JsonIgnore]
    public Article? Article { get; set; }

    [Required]
    public int OrdinalPosition { get; set; }

    ...
}
{% endhighlight %}

Here is the base class that implements the interface:

{% highlight c# %}
namespace AnkiBooks.Infrastructure.Repository;

public abstract class OrderedElementRepositoryBase<T>(ApplicationDbContext dbContext)
        : IOrderedElementRepository<T> where T : IOrdinalChild
{
    protected readonly ApplicationDbContext _dbContext = dbContext;

    /// <summary>
    /// Retrieves the ordered siblings of element without including element
    /// </summary>
    /// <param name="element"></param>
    /// <returns></returns>
    protected abstract List<IOrdinalChild> GetAllOrdinalSiblings(T element);

    protected abstract int GetOriginalPosition(string elementId);

    public async Task<T> InsertOrderedElementAsync(T newElement)
    {
        List<IOrdinalChild> ordinalSiblings = GetAllOrdinalSiblings(newElement);
        int ordinalElementsCount = ordinalSiblings.Count;
        int insertPosition = newElement.OrdinalPosition;

        if (insertPosition > ordinalElementsCount || insertPosition < 0)
        {
            throw new OrdinalPositionException();
        }
        else
        {
            List<IOrdinalChild> siblingsToShift = ordinalSiblings.Where(
                e => e.OrdinalPosition >= insertPosition
            ).ToList();

            foreach (IOrdinalChild e in siblingsToShift) { e.OrdinalPosition += 1; }
        }

        _dbContext.Add(newElement);

        await _dbContext.SaveChangesAsync();

        return newElement;
    }

    public async Task DeleteOrderedElementAsync(T elementToDelete)
    {
        List<IOrdinalChild> ordinalSiblings = GetAllOrdinalSiblings(elementToDelete);

        int deletePosition = elementToDelete.OrdinalPosition;

        _dbContext.Remove(elementToDelete);

        List<IOrdinalChild> siblingsToShift = ordinalSiblings.Where(
            e => e.OrdinalPosition >= deletePosition
        ).ToList();

        foreach (IOrdinalChild e in siblingsToShift) { e.OrdinalPosition -= 1; }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<T> UpdateOrderedElementAsync(T newVersion)
    {
        int origOrdPos = GetOriginalPosition(newVersion.Id);
        int newOrdPos = newVersion.OrdinalPosition;

        if (newOrdPos == origOrdPos)
        {
            _dbContext.Entry(newVersion).State = EntityState.Modified;
            await _dbContext.SaveChangesAsync();
            return newVersion;
        }
        else
        {
            List<IOrdinalChild> ordinalSiblings = GetAllOrdinalSiblings(newVersion);
            int ordinalElementsCount = ordinalSiblings.Count + 1;

            if (newOrdPos >= ordinalElementsCount || newOrdPos < 0)
            {
                throw new OrdinalPositionException();
            }
            else
            {
                if (newOrdPos > origOrdPos)
                {
                    List<IOrdinalChild> siblingsToShiftDown = ordinalSiblings.Where(
                        e => e.OrdinalPosition > origOrdPos && e.OrdinalPosition <= newOrdPos
                    ).ToList();

                    foreach (IOrdinalChild e in siblingsToShiftDown) { e.OrdinalPosition -= 1; }
                }
                else
                {
                    List<IOrdinalChild> siblingsToShiftUp = ordinalSiblings.Where(
                        e => e.OrdinalPosition >= newOrdPos && e.OrdinalPosition < origOrdPos
                    ).ToList();

                    foreach (IOrdinalChild e in siblingsToShiftUp) { e.OrdinalPosition += 1; }
                }

                _dbContext.Entry(newVersion).State = EntityState.Modified;
                await _dbContext.SaveChangesAsync();

                return newVersion;
            }
        }
    }
}
{% endhighlight %}

And a class derived from that:

{% highlight c# %}
public class DeckRepository(ApplicationDbContext dbContext)
                    : OrderedElementRepositoryBase<Deck>(dbContext), IDeckRepository
{
    protected override List<IOrdinalChild> GetAllOrdinalSiblings(Deck mdContent)
    {
        return _dbContext.ArticleElements.Where(
            el => el.ArticleId == mdContent.ArticleId && el.Id != mdContent.Id
        ).Cast<IOrdinalChild>().ToList();
    }

    protected override int GetOriginalPosition(string elementId)
    {
        return _dbContext.Decks.AsNoTracking().First(md => md.Id == elementId).OrdinalPosition;
    }
    ...
}
{% endhighlight %}

`IDeckRepository` adds some interface that is not related to the ordered elements too:

{% highlight c# %}
public interface IDeckRepository : IOrderedElementRepository<Deck>
{
    Task<List<Deck>> GetDecksAsync();
    Task<Deck?> GetDeckAsync(string mdContentId);
    Task<bool> DeckExists(string mdContentId);
}

{% endhighlight %}

When updating an ordered element, it's necessary to retrieve the ordinal position of the record to be updated from the database. This can potentially lead to the Change Tracker tracking two instances of the same entity and `SaveChanges` will throw an error.
