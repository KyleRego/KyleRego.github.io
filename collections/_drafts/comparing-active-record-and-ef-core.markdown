
## Background on Active Record and Entity Framework Core

Active Record is the object relational mapping system (ORM) used in Ruby on Rails. There are very specific conventions involved when using it, for example a Rails model class `Book` will map to the `books` table, `Child` would map to the `children` table, etc. Some of the Active Record APIs are static methods called on the model class itself, for example `Book.find(id)` in the above.

With Entity Framework Core, a commonly used .NET ORM, database access is done through a class which derives from `DbContext` and has properties which determine the mapping between entity types (the types mapped to the database are called entities) and the database tables, for example:

{% highlight c# %}
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

    }
}
{% endhighlight c# %}

There will be something in `Program.cs` similar to this to add that to the dependency injection container:

{% highlight c# %}
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("SQLITE_DATABASE_CONNECTION_STRING"));
});
{% endhighlight %}

This allows the controller to receive the `AppDbContext` by dependency injection.