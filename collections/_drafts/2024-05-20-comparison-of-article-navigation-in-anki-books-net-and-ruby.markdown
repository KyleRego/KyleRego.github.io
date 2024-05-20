---
layout: post
title: "Rails vs .NET Anki Books: navigation"
date: 2024-05-20 00:00:00 -0500
categories: blogging
permalink: /comparison-of-articles-navigation-in-ruby-and-net-ankibooks
emoji: 🫡
mathjax: false
---

One of the biggest weakness of the Ruby on Rails version of Anki Books was navigation between articles. When I didn't have many notes taken using the app, it wasn't much of an issue, but over time it became limiting. After logging in to Rails Anki Books, the user is redirected to this page which shows all of their books, alphabetically and as a tree:

![Ruby on Rails Anki Books books pages showing books in alphabetical order and as a tree side by side](assets/comparison-of-articles-navigation/ruby-on-rails-books-tree.png)

In Rails Anki Books, each book can have a parent book and children books, and a book is a container for a group of articles. From the above page, the user can navigate to the page for a book which shows that book's parent book, children books, and articles:

![Ruby on Rails Anki Books book overview page](assets/comparison-of-articles-navigation/ruby-on-rails-book-overview.png)

Overall this is not a great experience of navigating the app where ultimately the user wants to arrive at an article. It's possible to move books and articles to different books but the user experience of doing it is not very good, especially if you wanted to reorganize a lot. For example, the manage page for a book has some interfaces for moving the book and moving articles:

![Ruby on Rails Anki Books book manage page](assets/comparison-of-articles-navigation/ruby-on-rails-book-manage.png)

The similar manage page for an article has a drop down select to set the article's book.

In writing a new version of Anki Books with .NET, the user interface for navigating the app and organizing things was an area that I wanted to improve on.

This screenshot shows the articles tree in current .NET Anki Books:

![.NET Anki Books articles tree](assets/comparison-of-articles-navigation/net-article.png)

With this version there is a tree structure to articles instead of books (there will be books in the app too, but they will be secondary to articles, despite the name of the app being Anki Books). The article tree is a part of the page showing an article which is convenient for switching articles quickly and will allow more convenient drag and drop functionality like moving a part of an article to a different article. The screenshot shows how it can be searched too, which expands the tree as needed to highlight the articles with a title matching the search string. There is a placeholder "[Articles Tree Switcher]" that may be for switching between the user's article tree and other article trees (like if the user belonged to a group, the group could have its own article tree).

For comparison with the above, here is an article in the Ruby on Rails version:

![Ruby on Rails Anki Books article](assets/comparison-of-articles-navigation/ruby-on-rails-article.png)

I am fond of this but I have to admit the experience of navigation left a lot of room for improvement.