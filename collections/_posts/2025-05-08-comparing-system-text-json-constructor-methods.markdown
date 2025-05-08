---
layout: post
title: "Day thought about System.Text.Json constructors"
date: 2025-05-07 23:35:00 -0800
categories: ["programming", "c#"]
permalink: /constructors-system-text-json
emoji: 🖤
mathjax: false
---

It occurred to me there may have been an issue if I had continued to use the parameterless constructor that I added for System.Text.Json (see previous two posts).

The main thing I was thinking is that if System.Text.Json is using that constructor in deserialization (instantiating objects from the JSON content of an HTTP response), then this first parameterless constructor:

{% highlight c# %}
public class ApiResponse<T>
{
    public T? Data { get; set; }
    public string Message { get; set; }
    public ApiResponseType Type { get; set; }

    // This parameterless constructor is needed for System.Text.Json deserialization
    public ApiResponse()
    {
        Message = "";
    }
    ...
}
{% endhighlight %}

would have made all instances of the type with just `null` for `Data`, 0 for `ApiResponseType`, and a blank string `Message`.

However, this test:

{% highlight c# %}
public class ItemIndexTest(TestAppFactory<Program> factory) : IntegrationTestBase(factory)
[Fact]
    public async Task PostItems_CreatesBasicItem()
    {
        ItemDto payload = new()
        {
            Name = "New basic item",
            Description = "Description"
        };

        HttpResponseMessage response = await _client.PostAsJsonAsync("/api/items", payload);
        response.EnsureSuccessStatusCode();
        
        ApiResponse<ItemDto>? itemResponse = await response.Content.ReadFromJsonAsync<ApiResponse<ItemDto>>();
        Assert.NotNull(itemResponse);
        Assert.NotNull(itemResponse.Data);
        Assert.Equal("New basic item", itemResponse.Data.Name);
    }
{% endhighlight %}

would indicate that issue was not happening because the `Data` property was not null and the test was passing. I did some research which confirmed that even though that constructor is used, JSON assignment happens and overwrites those defaults.

## I still don't completely understand

I guess this implies the constructor is called to instantiate the object, and then JSON assignment happens? But then why the requirement of a `[JsonConstructor]` to case-insensitive match the property names? It must be some other reason I do not know.

## Summary

In short, System.Text.Json deserializes in two steps:
1. **Constructor call** – it always invokes your public parameterless, sole constructor, or `[JsonConstructor]` constructor.  
2. **Property population** – it then sets each matching public property from the JSON, overwriting any defaults you set.