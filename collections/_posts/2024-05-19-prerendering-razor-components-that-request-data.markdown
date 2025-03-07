---
layout: post
title: "Considerations when prerendering Razor components that request data in a Blazor Web App"
date: 2024-05-19 00:00:00 -0500
categories: blogging
permalink: /prerendering-razor-components-that-request-data-in-a-blazor-web-app
emoji: 🫡
mathjax: false
---

It's common for a single page application to request data from an API. In my Blazor web app, the same Razor components that would request data over HTTP can be prerendered on the server. There are two things I have been doing related to this. The first is to abstract the service that gets data with a server implementation and a client implementation where only the client version makes an HTTP request. The second is to persist the data state of the prerendered component and then retrieve that data instead of using the client service to request it.

`IBookService` is a good example because it is a small interface:

{% highlight c# %}
namespace AnkiBooks.ApplicationCore.Services;

public interface IBookService
{
    public Task<List<Book>?> GetPublicBooks();
}
{% endhighlight %}

This has a client implementation:

{% highlight c# %}
namespace AnkiBooks.WebApp.Client.Services;

public class BookService(HttpClient httpClient) : HttpServiceBase(httpClient), IBookService
{
    public async Task<List<Book>?> GetPublicBooks()
    {
        HttpRequestMessage request = new(HttpMethod.Get, $"api/Books");
        request.SetBrowserRequestCredentials(BrowserRequestCredentials.Include);

        HttpResponseMessage response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        string responseBody = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<Book>>(responseBody, _jsonOptions);
    }
}
{% endhighlight %}

And a server implementation:

{% highlight c# %}
namespace AnkiBooks.WebApp.Services;

public class BookService(   IBookRepository repository,
                            IUserIdProvider userIdProvider) : IBookService
{
    private readonly IBookRepository _repository = repository;
    private readonly IUserIdProvider _userIdProvider = userIdProvider;

    public async Task<List<Book>?> GetPublicBooks()
    {
        return await _repository.GetPublicBooksAsync();
    }
}
{% endhighlight %}

With dependency injection the Razor component uses the server implementation in prerendering and the client implementation if the component is rendered from the client. It is a good example of the usefulness of dependency inversion allowing plugging in different implementations of the interface.

This Razor component shows how to use the `PersistentComponentState` to persist the prerendered component's state and retrieve it.

{% highlight c# %}
@implements IDisposable

@using System.Text.Json
@using System.Text.Json.Serialization
@using AnkiBooks.ApplicationCore.Entities
@using AnkiBooks.ApplicationCore.Interfaces
@using System.Security.Claims
@using AnkiBooks.ApplicationCore.Services

@inject IUserArticleService UserArticleService
@inject ILogger<ArticlesTree> Logger
@inject PersistentComponentState ApplicationState

<div>
    @if (articles == null)
    {
        <p class="p-4 text-center">Requesting articles...</p>
    }
    else
    {
        <div class="m-4">
            <InputText @bind-Value="@articlesSearch" type="search" class="p-1 w-100-percent" placeholder="Search articles:" />
        </div>

        <CascadingValue Value="@articlesSearch" Name="ArticlesSearch">
        <ul>
            @for(int i = 0; i < articles.Count; i++)
            {
                Article article = articles[i];

                <ArticlesTreeNode @bind-Articles="@articles" Article="@article" />
            }
        </ul>
        </CascadingValue>

        <NewArticle @bind-Articles="@articles" ParentArticle="@(null)" />
    }
</div>

@code {
    public string articlesSearch = "";

    private List<Article>? articles;

    private PersistingComponentStateSubscription persistingSubscription;

    protected override async Task OnInitializedAsync()
    {
        persistingSubscription = ApplicationState.RegisterOnPersisting(PersistData);

        if (!ApplicationState.TryTakeFromJson<List<Article>>(nameof(articles), out var restored))
        {
            articles = await UserArticleService.GetUserArticles();
        }
        else
        {
            articles = restored;
        }
    }

    private Task PersistData()
    {
        ApplicationState.PersistAsJson(nameof(articles), articles);

        return Task.CompletedTask;
    }

    void IDisposable.Dispose()
    {
        persistingSubscription.Dispose();
    }
}
{% endhighlight %}
