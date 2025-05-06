---
layout: post
title: "[JsonConstructor] constructor for System.Text.Json"
date: 2025-05-06 01:35:00 -0800
categories: programming c#
permalink: /jsonconstructor-constructor-for-system-text-json
emoji: 🖤
mathjax: false
---

I was reading my previous post about adding a parameterless constructor to a type for System.Text.Json to use in deserialization. My initial priority was just to get the deserialization working in the integration test, but after thinking about the constructor requirements that System.Text.Json requires of a type, it seemed more intuitive why the requirements are like that.

Essentially, if there is only one constructor, then that is the one System.Text.Json uses. Classes in C# have a parameterless constructor by default if no other constructors are defined, so for a class with no defined constructor, that will be used. If there is a single constructor defined for the class, then there is no parameterless constructor, but there is only one constructor, so System.Text.Json uses that one. If there is more than one defined constructor, then System.Text.Json will not know which to use, resulting in the error when it tries to deserialize data to the type. That problem can be resolved by adding a parameterless constructor (what I did in the last post), but it may also be solved by decorating one of the constructors with `[JsonConstructor]`, and I decided that I would prefer that approach instead of having an extra parameterless constructor just for System.Text.Json.

In my case, my class had two constructors (before adding the parameterless constructor):

{% highlight c# %}
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
{% endhighlight %}

Adding the `[JsonConstructor]` attribute to the three parameter constructor is not sufficient for it to work, as there is this requirement (again see [Use immutable types and properties](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/immutability)):

> The parameter names of a parameterized constructor must match the property names and types. Matching is case-insensitive, and the constructor parameter must match the actual property name even if you use [JsonPropertyName] to rename a property.

The properties of the type are:

{% highlight c# %}
public T? Data { get; set; }
public string Message { get; set; }
public ApiResponseType Type { get; set; }
{% endhighlight %}

So the `msg` parameter must be renamed `message` so it matches the property name:

{% highlight c# %}
[JsonConstructor]
public ApiResponse(T data, string message, ApiResponseType type)
{
    Data = data;
    Message = message;
    Type = type;
}
{% endhighlight %}

and with that, there is no need for the parameterless constructor that was added just for System.Text.Json anymore.