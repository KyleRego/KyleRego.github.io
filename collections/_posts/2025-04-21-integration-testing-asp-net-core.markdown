---
layout: post
title: "Initial work on an ASP.NET Core integration tests project"
date: 2025-04-24 01:35:00 -0800
categories: programming c#
permalink: /aspnetcoreintegrationtesting
emoji: 🖤
mathjax: false
---

I recently spent many hours working on setting up an ASP.NET Core integration tests project ([Integration tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-9.0) is the documentation on this). That time was mostly spent trying to figure out why the response to `POST /login` was not including a `Set-Cookie` header, which turned out to be a subtle difference in the test `POST /login` request compared to the production app. Since I don't want to repeat that mistake again (I'm pretty sure I had to debug that once before and forgot about it) this is a note on the initial working example, which may be helpful to make sense of the documentation, as well as the specific thing which was an issue for me getting it working.

## CustomWebApplicationFactory<TProgram>

The documentation linked to above explains:

> WebApplicationFactory<TEntryPoint> is used to create a TestServer for the integration tests. TEntryPoint is the entry point class of the SUT, usually Program.cs... Web host configuration can be created independently of the test classes by inheriting from WebApplicationFactory<TEntryPoint> to create one or more custom factories:
>
> Inherit from WebApplicationFactory and override ConfigureWebHost. The IWebHostBuilder allows the configuration of the service collection with IWebHostBuilder.ConfigureServices"

Here is my implementation of this. In this example, the `AppDbContext` service that was registered in Program.cs is removed, and then a new service for the database context using in-memory SQLite is added; the documentation describes this scenario:

> The SUT's database context is registered in Program.cs. The test app's builder.ConfigureServices callback is executed after the app's Program.cs code is executed. To use a different database for the tests than the app's database, the app's database context must be replaced in builder.ConfigureServices.

{% highlight c# %}
public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram>
                                                            where TProgram : class
{
    private SqliteConnection _connection = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection = new("DataSource=:memory:");
        _connection.Open();

        builder.ConfigureServices(services =>
        {
            ServiceDescriptor dbContextDescriptor = services.Single(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(dbContextDescriptor);

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlite(_connection);
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
            _connection.Dispose();
    }
}
{% endhighlight %}

With the .NET minimal hosting model, Program.cs has top-level statements instead of a `Program` class with a `Main` method, so `public partial class Program { }` is needed at the end of Program.cs for there to be a concrete `Program` type to serve as `TProgram` in the above (not fully shown here).

I figured I would have an abstract class to serve as the parent class of integration test classes, and this inherits from `IClassFixture<CustomWebApplicationFactory<Program>>`, and does some stuff such as setting up an HTTP client, database context, and logging in a test user (so I predict further work on integration tests may see this class become `AuthedUserTestsBase`):

{% highlight c# %}
public abstract class IntegrationTestBase : IClassFixture<CustomWebApplicationFactory<Program>>
{
    protected readonly HttpClient _client;
    protected readonly IServiceScope _scope;
    protected readonly AppDbContext _dbContext;
    protected readonly string _testUserEmail = "testuser@example.com";
    protected readonly string _testUserPassword = "Test1234!";
    protected ApplicationUser _testUser = null!;

    protected IntegrationTestBase(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        _scope = factory.Services.CreateScope();
        _dbContext = _scope.ServiceProvider.GetRequiredService<AppDbContext>();

        InitializeAsync().GetAwaiter().GetResult();
    }

    private async Task InitializeAsync()
    {
        var userManager = _scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        _testUser = (await userManager.FindByEmailAsync(_testUserEmail))!;

        if (_testUser == null)
        {
            _testUser = new ApplicationUser
            {
                UserName = _testUserEmail,
                Email = _testUserEmail
            };
            IdentityResult result = await userManager.CreateAsync(_testUser, _testUserPassword);
            if (!result.Succeeded)
                throw new Exception("Failed to create test user: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        var loginPayload = new { email = _testUserEmail, password = _testUserPassword };

        var loginResponse = await _client.PostAsJsonAsync("/login?useCookies=true", loginPayload);
        loginResponse.Headers.TryGetValues("Set-Cookie", out var cookies);

        if (cookies == null)
            throw new Exception("No Set-Cookie header received!");

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    ~IntegrationTestBase()
    {
        _scope.Dispose();
    }
}
{% endhighlight %}

And this was my first test using that:

{% highlight c# %}
public class ItemIndexTest(CustomWebApplicationFactory<Program> factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task GetItems_ReturnsSeededItem()
    {
        await SeedItems();

        var response = await _client.GetAsync("/api/items");
        response.EnsureSuccessStatusCode();

        List<ItemDto>? items = await response.Content.ReadFromJsonAsync<List<ItemDto>>();
        Assert.NotNull(items);
        Assert.Equal(3, items.Count);
    }

    private async Task SeedItems()
    {
        Item item1 = new ItemBuilder(_testUser.Id, "Spoon").Build();
        Item item2 = new ItemBuilder(_testUser.Id, "Fork").Build();
        Item item3 = new ItemBuilder(_testUser.Id, "Plate").Build();

        await _dbContext.AddRangeAsync([item1, item2, item3]);
        await _dbContext.SaveChangesAsync();
    }
}
{% endhighlight %}

## The issue that wasted me a lot of time

When I wrote the above test, it failed in the auth middleware; I determined that while the response to POST /login was 200, that 200 response did not include a Set-Cookie header. In my case, I was using ASP.NET Core Identity, and configuring things like so:

{% highlight c# %}
builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
                .AddEntityFrameworkStores<AppDbContext>();
…
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapIdentityApi<ApplicationUser>();
{% endhighlight %}

It turns out with this, a cookie will not be issued unless there is a query string `useCookies=true`; having that in the JSON body:

{% highlight c# %}
var loginPayload = new {
    email    = _testUserEmail,
    password = _testUserPassword,
    useCookies = true            // ← this does nothing...
};
{% endhighlight %}

does not work; this does work:

{% highlight c# %}
var loginPayload = new { email = _testUserEmail, password = _testUserPassword };

var loginResponse = await _client.PostAsJsonAsync("/login?useCookies=true", loginPayload);
{% endhighlight %}

which is just a detail of the ASP.NET Core Identity API that I overlooked.
