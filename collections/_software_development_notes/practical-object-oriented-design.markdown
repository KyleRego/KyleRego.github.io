---
layout: post
title:  "Object-Oriented Design (book)"
categories: ruby programming
permalink: /practical-object-oriented-design
emoji: 😃
mathjax: false
---

These are some notes I took while reading [Practical Object-Oriented Design: An Agile Primer Using Ruby](https://www.amazon.com/Practical-Object-Oriented-Design-Agile-Primer/dp/0134456475/ref=asc_df_0134456475/?tag=hyprod-20&linkCode=df0&hvadid=312140868236&hvpos=&hvnetw=g&hvrand=14386545144526420910&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9002169&hvtargid=pla-362760961647&psc=1k), which is about object-oriented design. It is not so much about object-oriented Ruby syntax, but language-agnostic ways of thinking about the design of object-oriented code.

I think this book is really good (it's a buy). I would say that the way I think about the structure of ideal programs written in object-oriented style and their accompanying test suites has become clearer from studying this book.

# Summary

When the requirements of the application inevitably change, it will be the existing design that determines if the necessary code changes are joyful or painful. We should strive for code that works now, is reusable, and can be easily adapted in the future.

Code that meets this criteria may be TRUE (transparent, reasonable, usable, and exemplary), SOLID, and DRY.

## Messages

One of the major themes is the idea that the "messages" sent between the objects are as important to think about, or even more important, than the objects themselves.

The book includes many UML sequence diagrams to make the somewhat abstract discussion around this easier to understand. The following example was made with the [plantuml builder gem](https://github.com/svernidub/plantuml_builder):

![An example UML sequence diagram](/assets/uml-images/example.png)

These diagrams show the objects as two identical boxes connected by vertical lines. The horizontal lines are the messages. In this diagram, the `User` object calls the `perform` method of the other object which returns `true`. The box on the vertical line for `MyService` represents the `MyService` object executing the method.

These diagrams show that the interaction between objects is a lot like the interaction between clients and servers. The important thing is that they emphasize the messages.

Focusing on the messages can be very revealing about what the objects know about other objects. The less that an object needs to know in order to work, the more reusable it is, and the easier it will be to test.

## Dependencies

The more dependencies that an object has, the more likely it is to break when the dependencies change.

There are many types of dependencies that can manifest and many ways to reduce their impact. Some of the latter are using keyword arguments instead of positional arguments and dependency injection.

An important thing to not overlook is the direction of dependencies. A good rule of thumb is that an object should only depend on things that are less likely to change than itself.

## Testing

Any method in the public interface of an object should be tested, usually by making assertions about what the method returns. This covers the incoming messages to the object. 

But when is it necessary to test outgoing messages of the object? Using the terminology from the book, there are two types of outgoing messages: *queries* and *commands*.

Queries have no side effects and can be stubbed. Tests for them will be tests of the object for which they are incoming messages.

Commands have side effects, such as writing to a file or saving a record to the database, and should be tested. One way is to check that they have been sent the correct number of times and with the right arguments.

Other topics covered related to testing are injecting dependencies and doubles (and how to avoid tests that use doubles passing while the application is broken) and specific patterns to cleanly test classes sharing a duck type interface or parent and child classes.

{% include attribution-book.html
  book_title = "Practical Object-Oriented Design: An Agile Primer Using Ruby 2nd Edition"
  book_author = "Sandi Metz"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0134456478"
  book_link = "https://www.amazon.com/Practical-Object-Oriented-Design-Agile-Primer/dp/0134456475/ref=asc_df_0134456475/?tag=hyprod-20&linkCode=df0&hvadid=312140868236&hvpos=&hvnetw=g&hvrand=14386545144526420910&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9002169&hvtargid=pla-362760961647&psc=1"
%}