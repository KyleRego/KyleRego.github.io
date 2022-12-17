---
layout: post
title:  "Practical Object-Oriented Design"
date:   2022-12-17 13:00:00 -0500
categories: ruby programming [book reviews]
permalink: /practical-object-oriented-design
emoji: 🙂
long_title: true
book_review: true
book_title: Practical Object-Oriented Design&#58; An Agile Primer Using Ruby 2nd Edition
book_author: Sandi Metz
book_publisher: Addison-Wesley Professional
book_isbn: 978-0134456478
book_link: https://www.amazon.com/Practical-Object-Oriented-Design-Agile-Primer/dp/0134456475/ref=asc_df_0134456475/?tag=hyprod-20&linkCode=df0&hvadid=312140868236&hvpos=&hvnetw=g&hvrand=14386545144526420910&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9002169&hvtargid=pla-362760961647&psc=1
---
The subject of [Practical Object-Oriented Design: An Agile Primer Using Ruby]({{page.book_link}}) is object-oriented design, the goal of which is to produce code that will be easily changeable in the future. When the requirements of the application inevitably change, it will be the existing design that determines if the necessary code changes are joyful or painful. We should strive for code that works now, is reusable, and can be easily adapted in the future.

The book uses Ruby and MiniTest but is really about general principles. The audience is mainly junior programmers who have worked on object-oriented applications. The actual code examples are mostly about bicycles and may be somewhat interesting if you enjoy things like geometry and mechanical advantage.

The goal is to write code that is TRUE (transparent, reasonable, usable, and exemplary), SOLID, and DRY.

Some of the general takeaways I got were:
- Write tests first.
- Avoid testing private methods.
- Delete unused interfaces.
- If you have a choice between making a decision now or later and think that you will have more information in the future, make the decision later.
- If a simple description of what a class does includes the word "or" or "and," then the class may be violating the single responsibility principle. 
- If you have an object with an instance variable with a name like `@type` or `@category` that is used to decide what method to send to `self`, you may want two sibling classes.
- When refactoring a class hierarchy, focus on moving the abstract behavior into the parent class rather than the concrete behavior into the child class. 
- You should never have a child class implementing a method that raises an exception to override a method it inherited. 
- If the child classes are expected to implement a method, it may be a good idea to define a method on the parent class that raises a `NotImplementedError` with a helpful error message. 
- Instead of calling `super` in the child class, you might have the parent class call a hook method, which the child class is expected to implement.
- If an object is deciding what message to send to its collaborators by checking their classes in a case statement, this may indicate the need for a duck type.

One of the themes which I found to be quite specific to this book is the idea that you should focus at least as much on the messages sent between the objects as the objects themselves. Objects take the spotlight in object-oriented programming so it is easy to not think about the messages sent between the objects as much.

UML sequence diagrams are used to make the discussion about messages more comprehensible. I made the following one using the [plantuml builder gem](https://github.com/svernidub/plantuml_builder) (which works well despite having only 6 commits since it was developed over 3 years ago):

![An example UML sequence diagram](/assets/uml_images/example.png)

These diagrams show the objects as two identical boxes connected by vertical lines. The horizontal lines are the messages. In this diagram, the `User` object calls the `perform` method of the other object which returns `true`. The box on the vertical line for `MyService` represents the `MyService` object executing the method.

Focusing on the messages can be very revealing about what the objects have to know in order to work. An object knowing things about other objects is a form of coupling between the objects, and of course loosely coupled code is better than tightly coupled code.

Ideally the object should only have to know what it wants back in order to send the right message. It may not be necessary for it to know the type of the object it sends the message to, and it definitely shouldn't know how that object works internally. The less that an object needs to know in order to work, the more reusable it is, and the easier it will be to test.

Here is an example of `User` knowing way too much about how `BookService` works (this also shows `BookService` is exposing methods in its public interface that it probably shouldn't):

![UML sequence diagram showing an object that knows too much about how another object works](/assets/uml_images/knows_how_it_works.png)

Something that the object has to know in order to work is also a type of dependency. The more dependencies the object has, the more likely it is to break when the dependencies change. The book discusses many ways dependencies can manifest and potential ways to minimize them. 

Some examples would be:
- Using keyword arguments instead of positional arguments replaces a dependency on argument order with one on the argument names, which is preferable.
- Wrapping a method around the access logic into a data structure contains the dependency the object has on knowing the structure of the data.
- Dependency injection

The direction of dependencies is another important thing to consider. The worst situation to be in would be having a class that is both very likely to change and has a lot of dependencies. A good rule of thumb is a class should only depend on things that are less likely to change than itself.

The last and longest chapter in the book is about testing.

Any method in the public interface of an object should be tested. Usually this is done by making assertions about what the method returns. This covers the incoming messages to the object. 

But when is it necessary to test outgoing messages of the object? Using the terminology from the book, there are two types of outgoing messages: queries and commands.

Queries have no side effects and do not need to be tested. Tests for them will be tests of the object for which they are incoming messages. Queries can generally be stubbed.

Commands have side effects, such as writing to a file or saving a record to the database, and do need to be tested. These are generally tested by ensuring that they have been sent the correct number of times and with the right arguments.

Another reason to inject dependencies is to make testing easier. Injecting a double can increase the test speed, but it can introduce the risk of tests passing while the application is broken. This may happen if the interface of the actual object the double is replacing changes its interface and the double does not. A test that asserts the production object implements the correct interface can be used to prevent this situation.

To test a duck type, write a module that defines tests around what interface the duck type classes should implement, and include it into the duck type test classes.

To test parent and child classes:
- Keep the Liskov substitution principle in mind.
- Write a module that defines tests around the interface of the parent class and include it into the parent test class and child test classes.
- Write a module for any methods the child classes are expected to implement and include that into the child test classes. 
- Add tests to the child test classes for anything that is specific to those child classes.
- To finish testing the parent class, create a child class of it to serve as a double, and in that double class stub any methods that the child classes are expected to implement.

In general this book is excellent and highly recommended if you are a Ruby programmer. My review: it's a buy.
