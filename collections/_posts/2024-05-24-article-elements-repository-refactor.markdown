---
layout: post
title: "ArticleElementRepository in AnkiBooks (refactor of OrderedElementRepositoryBase)"
date: 2024-05-24 00:00:00 -0500
categories: blogging
permalink: /article-elements-repository-refactor
emoji: 🫥
mathjax: false
---

After writing the post yesterday, I was thinking about it some more, and wondering about the design. I also noticed some other small issues while writing the post:

- I didn't really like the naming inconsistency happening with the use of "OrdinalChild" and "OrderedElement" in the naming
- Querying for all the sibling elements in the delete method was not necessary, it did save work by reusing a method though
- Wondering if `IOrdinalChild` interface can be removed

I thought about a few different ways to change the design today. I think it may have been a mistake to couple the abstraction of this to the "OrderedElements" aspect of the article elements. It's possible that other tables in the database could have ordered elements in the same way and an abstract repository to handle all cases of it would be good. However at this point for me, only article elements are doing this. I also considered that the handling of article elements ordinal positions will probably evolve to a more special case to allow moving article elements from one article to a different article.

After refactoring, the main class relevant to the post is the following `ArticleElementRepository`. A repository specific to each article element type will derive from it and add the read methods. The main reason for not including the read methods here is eager loading related entities will be specific for each type. I am still thinking over the possibilities with this but I think this is a better design, and the above design was coupling too much to an abstraction that is not necessary yet.

Here is what the repository interface looks like in the application core:

{% highlight c# %}
using AnkiBooks.ApplicationCore.Interfaces;

namespace AnkiBooks.ApplicationCore.Repository;

public interface IArticleElementRepository<T> where T : IArticleElement
{
    Task<T> InsertAsync(T element);

    Task DeleteAsync(T element);

    Task<T> UpdateAsync(T element);
}
{% endhighlight %}

{% highlight c# %}
namespace AnkiBooks.ApplicationCore.Repository;

public interface IDeckRepository : IArticleElementRepository<Deck>
{
    Task<List<Deck>> GetDecksAsync();

    Task<Deck?> GetDeckAsync(string mdContentId);

    Task<bool> DeckExists(string mdContentId);
}
{% endhighlight %}

This is the implementation, it is still a good example of the logic for handling the ordinal positions in this situation with EF Core (the query to get the ordinal position to check if it has changed in an update must be non-tracking):

{% highlight c# %}
namespace AnkiBooks.Infrastructure.Repository;

public class ArticleElementRepository<T>(ApplicationDbContext dbContext)
            : IArticleElementRepository<T> where T : IArticleElement
{
    protected readonly ApplicationDbContext _dbContext = dbContext;

    /// <summary>
    /// Retrieves the siblings of element without including element
    /// </summary>
    /// <param name="element"></param>
    /// <returns></returns>
    protected List<IArticleElement> GetArticleElementSiblings(T element)
    {
        return _dbContext.ArticleElements
                .Where(el => el.ArticleId == element.ArticleId && el.Id != element.Id)
                .Cast<IArticleElement>().ToList();
    }

    public async Task<T> InsertAsync(T newElement)
    {
        List<IArticleElement> ordinalSiblings = GetArticleElementSiblings(newElement);

        int ordinalElementsCount = ordinalSiblings.Count;
        int insertPosition = newElement.OrdinalPosition;

        if (insertPosition > ordinalElementsCount || insertPosition < 0)
        {
            throw new OrdinalPositionException();
        }
        else
        {
            List<IArticleElement> siblingsToShift = ordinalSiblings.Where(
                e => e.OrdinalPosition >= insertPosition
            ).ToList();

            foreach (IArticleElement e in siblingsToShift)
            {
                e.OrdinalPosition += 1;
            }
        }

        _dbContext.Add(newElement);

        await _dbContext.SaveChangesAsync();

        return newElement;
    }

    public async Task DeleteAsync(T elementToDelete)
    {
        int deletePosition = elementToDelete.OrdinalPosition;

        List<IArticleElement> siblingsToShift = _dbContext.ArticleElements.Where(
            el => el.OrdinalPosition >= deletePosition && el.ArticleId == elementToDelete.ArticleId
        ).Cast<IArticleElement>().ToList();

        _dbContext.Remove(elementToDelete);

        foreach (IArticleElement e in siblingsToShift)
        {
            e.OrdinalPosition -= 1;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<T> UpdateAsync(T newVersion)
    {
        int origOrdPos = _dbContext.ArticleElements.AsNoTracking()
                            .First(el => el.Id == newVersion.Id).OrdinalPosition;

        int newOrdPos = newVersion.OrdinalPosition;

        if (newOrdPos == origOrdPos)
        {
            _dbContext.Entry(newVersion).State = EntityState.Modified;
            await _dbContext.SaveChangesAsync();
            return newVersion;
        }
        else
        {
            List<IArticleElement> ordinalSiblings = GetArticleElementSiblings(newVersion);
            int ordinalElementsCount = ordinalSiblings.Count + 1;

            if (newOrdPos >= ordinalElementsCount || newOrdPos < 0)
            {
                throw new OrdinalPositionException();
            }
            else
            {
                if (newOrdPos > origOrdPos)
                {
                    List<IArticleElement> siblingsToShiftDown = ordinalSiblings.Where(
                        e => e.OrdinalPosition > origOrdPos && e.OrdinalPosition <= newOrdPos
                    ).ToList();

                    foreach (IArticleElement e in siblingsToShiftDown)
                    {
                        e.OrdinalPosition -= 1;
                    }
                }
                else
                {
                    List<IArticleElement> siblingsToShiftUp = ordinalSiblings.Where(
                        e => e.OrdinalPosition >= newOrdPos && e.OrdinalPosition < origOrdPos
                    ).ToList();

                    foreach (IArticleElement e in siblingsToShiftUp)
                    {
                        e.OrdinalPosition += 1;
                    }
                }

                _dbContext.Entry(newVersion).State = EntityState.Modified;

                await _dbContext.SaveChangesAsync();

                return newVersion;
            }
        }
    }
}
{% endhighlight %}

