---
layout: post
title:  "Practical Object-Oriented Design"
categories: ruby programming
permalink: /practical-object-oriented-design
emoji: 😃
mathjax: false
---

[Practical Object-Oriented Design: An Agile Primer Using Ruby]({{page.book_link}}) is about object-oriented design: principles to design code that will be maintainable into the future. When the requirements of the application inevitably change, it will be the existing design that determines if the necessary code changes are joyful or painful. We should strive for code that works now, is reusable, and can be easily adapted in the future.

The book explores this topic using Ruby and MiniTest. The code examples are mostly about bicycles and may be somewhat interesting if you enjoy things like geometry and mechanical advantage. In general, the book is excellent and highly recommended if you are a Ruby programmer. My review: it's a buy.

# Summary

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

# Messages

One of the themes of the book is the idea that the "messages" sent between the objects are as important, or even more important, than the objects themselves.

The book uses UML sequence diagrams to make the somewhat abstract discussion around this easier to understand. The following example is an example made with the [plantuml builder gem](https://github.com/svernidub/plantuml_builder):

![An example UML sequence diagram](/assets/uml_images/example.png)

These diagrams show the objects as two identical boxes connected by vertical lines. The horizontal lines are the messages. In this diagram, the `User` object calls the `perform` method of the other object which returns `true`. The box on the vertical line for `MyService` represents the `MyService` object executing the method.

These diagrams show that the interaction between objects is a lot like the interaction between clients and servers. The object says to a second object: I want the return value of this method I know you respond to. The second object does something and then sends a message back to the first object with the return value.

Focusing on the messages can be very revealing about what the objects know about other objects. Objects knowing things about other objects is a form of coupling between them. The less that an object needs to know in order to work, the more reusable it is, and the easier it will be to test. Ideally, an object should only have to know what it wants back to send the right message. It should not know anything about what the object which can give it what it wants works internally and it may not need to know that object's type. An object that needs to call multiple methods of another object in a specific order for something to happen knows too much about that object.

# Dependencies

Something that the object has to know in order to work is a type of dependency. The more dependencies the object has, the more likely it is to break when the dependencies change. The book discusses many ways dependencies can manifest and potential ways to minimize them. 

Some examples would be:
- Using keyword arguments instead of positional arguments replaces a dependency on argument order with one on the argument names, which is preferable.
- Wrapping a method around the access logic into a data structure contains the dependency the object has on knowing the structure of the data.
- Dependency injection

The direction of dependencies is another important thing to consider. A good rule of thumb is a class should only depend on things that are less likely to change than itself.

# Testing

Any method in the public interface of an object should be tested. Usually this is done by making assertions about what the method returns. This covers the incoming messages to the object. 

But when is it necessary to test outgoing messages of the object? Using the terminology from the book, there are two types of outgoing messages: *queries* and *commands*.

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

{% include attribution-book.html
  book_title = "Practical Object-Oriented Design: An Agile Primer Using Ruby 2nd Edition"
  book_author = "Sandi Metz"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0134456478"
  book_link = "https://www.amazon.com/Practical-Object-Oriented-Design-Agile-Primer/dp/0134456475/ref=asc_df_0134456475/?tag=hyprod-20&linkCode=df0&hvadid=312140868236&hvpos=&hvnetw=g&hvrand=14386545144526420910&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9002169&hvtargid=pla-362760961647&psc=1"
%}