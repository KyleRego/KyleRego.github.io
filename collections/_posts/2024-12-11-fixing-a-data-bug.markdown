---
layout: post
title: "Fixing a bug caused by bad data (EF Core, SQLite)"
date: 2024-12-10 9:25:00 -0500
categories: programming
permalink: /fixing-a-data-bug
emoji: 😇
mathjax: false
---

Oftentimes software bugs can be caused by bad data rather than erroneous code. In my ASP.NET Core app Larder, auto-generated EF Core migration C# code is used to manage schema updates to the SQLite database.

In that project, a parent class `Item` with derived classes `Food` and `Ingredient` was refactored to where instead `Item` has nullable `Food` and `Ingredient` component properties which is meant to be a simple "entity-component architecture" like that found in game development.

When `Item` was a parent class with derived classes `Food` and `Ingredient`, objects of all three types were mapped to the same database table. In EF Core, it is called Table-Per-Hierarchy Inheritance, and I would also call it Single Table Inheritance. A column `Discriminator` is used to determine which of the types in the inheritance hierarchy the record is mapped to.

Despite after the removal of `Item` being a parent class, there is still a `Discriminator` column in that table (due to what changes the auto-generated migrations made).

Today I noticed that in the production app, when viewing the items table, the data did not load. There was a server error response being sent from the server for that fetch request which loads the data. On the server `journalctl` log there was this EF Core error:

`System.InvalidOperationException: Unable to materialize entity instance of type 'Item'. No discriminators matched the discriminator value 'Food'.`

I imagine this means the EF Core internals assume `Item` has a subclass `Food` because there is a value `"Food"` in the `Discriminator` column of at least one record, but there is no class `Food` to map it to.

To fix the problem I used `sqlite3` to delete the records where `Discriminator` value was anything but `"Item"`; this did resolve the issue:

{% highlight sql %}
sqlite> .mode column
sqlite> .headers on
sqlite> select count(discriminator) from items group by discriminator;
count(discriminator)
--------------------
278
4
3
sqlite> select discriminator from items group by discriminator;
Discriminator
-------------
Food
Ingredient
Item
sqlite> delete from items where discriminator = 'Food';
sqlite> delete from items where discriminator = 'Ingredient';
sqlite> select count(discriminator) from items group by discriminator;
count(discriminator)
--------------------
3
sqlite> .q
{% endhighlight %}

Because SQLite is a case-sensitive database, it is necessary to capitalize Food and Ingredient in the above to delete the records.

This post is just to show an example of how faults in software can be related to data and what fixing the problem can potentially look like. Other potential resolutions include code changes, especially when the fault is due to code not handling all possible data inputs, and scheduling jobs to periodically clean up data, especially if it is not viable to completely prevent some invalid data from appearing in the database occasionally.