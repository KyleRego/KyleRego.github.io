---
layout: post
title: "Serializing a list of derived class objects as a list of the base type (.NET)"
date: 2024-05-18 00:00:00 -0500
categories: blogging
permalink: /serializing-derived-class-objects-net
emoji: 🫡
mathjax: false
---

I noticed a problem with serializing a list of objects that derive from a base class as a list of the base class where the data of the derived type properties was missing after it was deserialized. It happened to me a bit ago and I resolved the problem then by some refactoring that fixed it incidentally by avoiding doing it at all in the newer design of that part of the app. Today I ran into wanting to do this again and learned a correct way to. [How to serialize properties of derived classes with System.Text.Json](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/polymorphism?pivots=dotnet-8-0) shows how to do it (it is simple but I didn't find this documentation right away). [This Stack Overflow answer](https://stackoverflow.com/questions/59308763/derived-types-properties-missing-in-json-response-from-asp-net-core-api) was what pointed me there too.

In my case, I have a base class `Card` with two derived types `BasicNote` and `ClozeNote`.

{% highlight ruby %}
[JsonDerivedType(typeof(BasicNote), typeDiscriminator: "BasicNote")]
[JsonDerivedType(typeof(ClozeNote), typeDiscriminator: "ClozeNote")]
public class Card : EntityBase, ICard
{
    ...

    [JsonIgnore]
    public Deck? Deck { get; set; }

    ...
}
{% endhighlight %}

This is what a working use of the `JsonDerivedType` attribute was for me. Unrelated to the derived classes serialization, the `JsonIgnore` attribute on the `Deck` property prevents that from being serialized, which would result in an object cycle as the `Deck` type has a collection property with its cards. 