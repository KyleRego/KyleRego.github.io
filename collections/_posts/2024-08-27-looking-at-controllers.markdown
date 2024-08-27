---
layout: post
title: "Controller, service, and repository layers using ASP.NET Core"
date: 2024-08-27 00:00:00 -0500
categories: blogging
permalink: /comparison-of-ruby-on-rails-asp-net-core-design
emoji: 🤔
mathjax: false
---

Before learning .NET, I had a lot more experience with Ruby on Rails. One of the ideas I found in .NET development that I hadn't encountered in Ruby on Rails is this design of a web application with a service layer between the controller and repository, and so I want to illustrate the design.

In this post, I will start with a Ruby on Rails controller with one simple action, translate it to ASP.NET Core, and then refactor that into the design that I want to illustrate.

## The starting point: an action to get a book

Here is an example of a very simple Rails controller with one action:

{% highlight ruby %}
class BooksController < ApplicationController
  def show
    id = params[:id]
    @book = Book.find(id)
    render json: @book
  end
end
{% endhighlight %}

If I translate this to ASP.NET Core, it's roughly something like this (there are some differences, but they are not important for the comparison I'm making):

{% highlight c# %}
[ApiController, Route("books")]
public class BooksController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    [HttpGet("{id}")]
    public async ActionResult<Book> Show(string id)
    {
        Book? book = await _dbContext.Books.FirstOrDefaultAsync(book => book.Id == id);
    
        return (book == null) ? NotFound() : book;
    }
}
{% endhighlight %}

## Change the return type from using an entity type to a data transfer object

Currently the return type of the action is `ActionResult<Book>`. `Book` is an entity, which means it is a type that is mapped to the database in the object relational mapping (ORM), so the JSON structure of the API is coupled to the database. We can use a Data Transfer Object instead:

{% highlight c# %}
namespace AppName.Dtos;

public class BookDto
{
    public string? Id { get; set; }

    public required string Name { get; set; }
}
{% endhighlight %}

For completeness, the `Book` entity might look like this:

{% highlight c# %}
namespace AppName.Models;

public class Book
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public required string Name { get; set; }
}
{% endhighlight %}

With the data transfer object, the example is now:

{% highlight c# %}
[ApiController, Route("books")]
public class BooksController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    [HttpGet("{id}")]
    public async ActionResult<BookDto> Show(string id)
    {
        Book? book = await _dbContext.Books.FirstOrDefaultAsync(bk => bk.Id == id);

        if (book == null) return NotFound();

        BookDto dto = new()
        {
            Id = book.Id,
            Name = book.Name
        }

        return dto;
    }
}
{% endhighlight %}

Now the API surface is not coupled to the entity type and can be designed independently to fit the needs of the application.

There are different approaches to mapping between types, and the above shows a straightforward way. Here is another:

{% highlight c# %}
public class BookDto
{
    public string? Id { get; set; }

    public required string Name { get; set; }

    public static BookDto FromEntity(Book book)
    {
        return new()
        {
            Id = book.Id,
            Name = book.Name
        }
    }
}
{% endhighlight %}

{% highlight c# %}
[ApiController, Route("books")]
public class BooksController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    [HttpGet("{id}")]
    public async ActionResult<BookDto> Show(string id)
    {
        Book? book = await _dbContext.Books.FirstOrDefaultAsync(bk => bk.Id == id);

        if (book == null) return NotFound();

        return BookDto.FromEntity(book);
    }
}
{% endhighlight %}

### Another reason to use data transfer objects: prevent overposting attacks

Consider this example:

{% highlight c# %}
[ApiController, Route("books")]
public class BooksController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    [HttpPut("{id}")]
    public async ActionResult Update(Book book, string id)
    {
        if (book.Id != id) return BadRequest();

        _dbContext.Entry(book).State = EntityState.Modified;
        await _dbContext.SaveChangesAsync();

        return Ok();
    }
}
{% endhighlight %}

With ASP.NET Core model binding, the incoming request data is used to instantiate the argument for the action's `book` parameter. This is then used to update the corresponding record and could allow for an overposting attack, as any property of `Book` can be assigned through model binding, and then updated in the database. If a data transfer object is used to bind the incoming data instead, this sort of vulnerability is ruled out.

In Rails, the Strong Parameters feature protects against this sort of vulnerability.

## Using a repository to do database access instead of the DbContext

The next refactor is to implement a Repository pattern for database access. At the very least this provides an interface for mocking the database in unit tests. I've also found it useful for implementing a deep interface for supporting sorting, searching kind of features as an abstract base repository, since those operations are most efficiently carried out by the database, and also for encapsulating what the standard eager loading behavior is for each entity.

{% highlight c# %}
public interface IBookRepository
{
    public Task<Book?> Get(string id);
}

public class BookRepository(AppDbContext dbContext) : IBookRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Book?> Get(string id)
    {
        return await _dbContext.FirstOrDefaultAsync(book => book.Id == id);
    }
}
{% endhighlight %}

That will need to be registered in `Program.cs` for dependency injection:

{% highlight c# %}
builder.Services.AddScoped<IBookRepository, BookRepository>();
{% endhighlight %}

Now the controller can do database access using the repository instead:

{% highlight c# %}
[ApiController, Route("books")]
public class BooksController(IBookRepository bookRepository) : ControllerBase
{
    private readonly IBookRepository _bkRep = bookRepository;

    [HttpGet("{id}")]
    public async ActionResult<BookDto?> Show(string id)
    {
        Book? book = await _bkRep.Get(id);

        if (book == null) return null;

        return BookDto.FromEntity(book);
    }
}
{% endhighlight %}

However in this design we do not want the controller to do database access even through the repository.

## Adding a service layer

The last change is to add a service layer between the controller and repository.

{% highlight c# %}
public interface IBookService
{
    public Task<Book> GetBook(string id);
}

public class BookService(IBookRepository bookRepository) : IBookService
{
    private readonly IBookRepository _bookRepository = bookRepository;

    public async Task<BookDto?> GetBook(string id)
    {
        Book? book = await _bookRepository.Get(id);

        return (book == null) ? null : BookDto.FromEntity(book);
    }
}
{% endhighlight %}

Since there is no real business logic for this example, this is kind of just a pass-through method, but this layer is for business logic and can be unit tested by mocking the repository.

## Putting it all together

So here is the simple Rails controller example that I started with:

{% highlight c# %}
class BooksController < ApplicationController
  def show
    id = params[:id]
    @book = Book.find(id)
    render json: @book
  end
end
{% endhighlight %}

Here is the same implemented in ASP.NET Core with the data transfer object, service, and repository layers design:

{% highlight c# %}
[ApiController, Route("books")]
public class BooksController(IBookService bookService) : ControllerBase
{
    private readonly IBookService _bookService = bookService;

    [HttpGet("{id}")]
    public async ActionResult<BookDto> Show(string id)
    {
        BookDto? bookDto = await _bookService.GetBook(id);

        return (bookDto == null) ? NotFound() : bookDto;
    }
}
{% endhighlight %}

{% highlight c# %}
public interface IBookService
{
    public Task<BookDto?> GetBook(string id);
}

public class BookService(IBookRepository bookRepository) : IBookService
{
    private readonly IBookRepository _bookRepository = bookRepository;

    public async Task<BookDto?> GetBook(string id)
    {
        Book? book = await _bookRepository.Get(id);

        return (book == null) ? null : BookDto.FromEntity(book);
    }
}
{% endhighlight %}

{% highlight c# %}
public interface IBookRepository
{
    public Task<Book?> Get(string id);
}

public class BookRepository(AppDbContext dbContext) : IBookRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Book?> Get(string id)
    {
        return await _dbContext.FirstOrDefaultAsync(book => book.Id == id);
    }
}
{% endhighlight %}
