---
layout: post
title: "Design Patterns in Ruby"
categories: programming ruby
permalink: /design-patterns
emoji: 🥹
mathjax: false
---

These are some notes I took while reading [Design Patterns in Ruby](https://www.amazon.com/Design-Patterns-Ruby-Russ-Olsen/dp/0321490452), mostly to help me remember the patterns. In the future, this page may describe many more, including ones that are not relevant to Ruby.

The Gang of Four popularized the ideas of *design patterns*, which are common solutions to problems in object-oriented programming.

# The Template Method

The template method pattern involves a method of an abstract class that calls abstract methods that concrete child classes must implement. This separates code that stays that same (the algorithm of the template method) from code that changes (the concrete details).

When the methods used in the template method have concrete implementations in the parent class, they are called *hook methods*. It is common to leave these as empty methods but they may also provide a default implementation.

{% highlight ruby %}
class AbstractClass
  def template_method
    first_method
    second_method
    hook_method
  end

  def first_method
    raise NotImplementedError, 'a child class should override this method'
  end

  def second_method
    raise NotImplementedError, 'a child class should override this method'
  end

  def hook_method
  end
end
{% endhighlight %}

# The Strategy

The strategy pattern is similar to the template method pattern but uses composition and delegation instead of inheritance. The *strategies* are objects which implement a common interface and are used by an object called the *context*.

The context may pass any data its strategy object needs as arguments, including itself.

The strategy objects may be instances of sibling classes, instances of duck type classes, or Ruby Proc objects in simple cases--the essential thing is they implement the same interface.

{% highlight Ruby %}
class ContextClass
  def initialize(strategy)
    @strategy = strategy
  end

  def call
    puts "1"
    @strategy.call
    puts "3"
  end
end

strategy = Proc.new { puts "2" }
context = ContextClass.new(strategy)
context.call
{% endhighlight %}

# The Observer

The observer pattern involves an object called the *subject* which keeps track of objects called *observers* (having the observers in an array/instance variable is one way). A state change in the subject triggers iteration over the observers so that they can all respond to the change. Ruby has a module called `Observable` that can be used to simplify implementing this pattern.

The observers may be Proc objects that are called when the state changes. The *pull approach* refers to when the subject passes itself as an argument to the observer method called in response to the state change. Each observer can then "pull" what it needs from the subject by calling its methods. In the *push approach*, the subject only sends specific arguments to the observers.

{% highlight Ruby %}
class Subject
  def initialize
    @observers = []
  end

  # more methods

  def notify_observers
    @observers.each do |observer|
      observer.respond(self)
    end
  end
end
{% endhighlight %}

# The Composite

The composite pattern is a tree of objects that all share a common interface which is called the *component*. The objects are either *composites* or *leafs* and there is at least one composite object. The difference between the composite objects and the leaf objects is that the leaf objects do not have children.

# The Iterator

The `each` method in Ruby is basically the *internal* iterator pattern. Sometimes there are practical reasons to use an *external* iterator (an iterator object) instead, such as merging two sorted arrays into one sorted array. Using external iterators in this case allows you to iterate through each array independently of the other which simplifies constructing the resulting sorted array.

Including the `Enumerable` module into a class and defining an instance method `each` will give that class many useful methods such as `include?` and `all`. If the objects that are being iterated over do not implement `<=>`, they will need to implement this for all of the methods to work.

There are other internal iterators in Ruby such as `Array#reverse_each` and `String#each_byte`. The `ObjectSpace` module has a method `each_object` which iterates through all of the objects that are currently known to the Ruby interpreter.

{% include attribution-book.html 
  book_title = "Design Patterns in Ruby"
  book_author = "Russ Olsen"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0321490452"
  book_link = "https://www.amazon.com/Design-Patterns-Ruby-Russ-Olsen/dp/0321490452"
%}