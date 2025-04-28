---
layout: post
title: "Parameterless constructor for System.Text.Json"
date: 2025-04-28 01:35:00 -0800
categories: programming c#
permalink: /parameterless-constructor-for-system-text-json
emoji: 🖤
mathjax: false
---

Today I needed to deserialize an HTTP response to my custom type `ApiResponse<T>` in an integration test:

{% highlight c# %}
ApiResponse<ItemDto>? itemResponse = await response.Content.ReadFromJsonAsync<ApiResponse<ItemDto>>();
{% endhighlight %}

This resulted in the error `System.NotSupportedException : Deserialization of types without a parameterless constructor, a singular parameterized constructor, or a parameterized constructor annotated with 'JsonConstructorAttribute' is not supported.`

This was my custom type `ApiResponse<T>`:

{% highlight c# %}
public class ApiResponse<T>
{
    public T? Data { get; set; }
    public string Message { get; set; }
    public ApiResponseType Type { get; set; }

    public ApiResponse(T data, string msg, ApiResponseType type)
    {
        Data = data;
        Message = msg;
        Type = type;
    }

    public ApiResponse(string msg, ApiResponseType type)
    {
        Data = default;
        Message = msg;
        Type = type;
    }
}
{% endhighlight %}

I added this parameterless constructor, which solved the issue:

{% highlight c# %}
public ApiResponse()
{
    Message = "";
}
{% endhighlight %}

`ApiResponseType` is an enum (a value type) so it gets a default value of 0.

The relevant documentation on this issue seems to be [Use immutable types and properties](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/immutability) which explains:

> By default, System.Text.Json uses the default public parameterless constructor.

In C#, classes have a default parameterless constructor only if they do not have any other constructors defined.

> However, you can tell it to use a parameterized constructor, which makes it possible to deserialize an immutable class or struct.

> For a class, if the only constructor is a parameterized one, that constructor will be used.

> For a struct, or a class with multiple constructors, specify the one to use by applying the [JsonConstructor] attribute. When the attribute is not used, a public parameterless constructor is always used if present.

So in my case of a class with constructor overloads and none with the `JsonConstructor` attribute, `System.Text.Json` is unable to determine a constructor to use leading to the exception, and adding a parameterless constructor to the class provides a solution.