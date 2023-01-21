---
layout: post
title: Design Patterns in Ruby
categories: programming ruby
permalink: /design-patterns
emoji: 🥹
mathjax: false
---

**This note is a work in progress. This book is really excellent though.**

The Gang of Four popularized the ideas of design patterns, which are common solutions to problems in object-oriented programming. This book focuses on 14 of the original 23 GoF patterns.

# The Template Method

This is a method of an abstract class that calls abstract methods that concrete child classes must implement. This separates code that stays that same (the algorithm) vs. code that changes (the details supplied by the child classes) which helps defend against change.

When the methods used in the template method do actually have concrete implementations in the parent class, they are called hook methods. This allows the parent class to define a default behavior which the child classes can either use or override. Leaving the implementations of the hook methods empty is a common design choice but they may also contain some code.

A pitfall to avoid with the template method pattern is to overdesign by trying to cover every future possibility by adding additional hook/abstract methods that are not strictly needed.

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

This is similar to the template method but uses composition and delegation instead of inheritance. The strategies are objects which implement a common interface and are used by an object called the context.

The context may just pass any data its strategy object needs as arguments. The context object may also pass itself to the strategy so that the strategy can call methods on it to get any data that it needs.

The strategy objects may be instances of sibling classes, instances of duck type classes, or Ruby Proc objects in simple cases. The strategy objects just need to implement the same interface.

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

This pattern involves a subject object which keeps track of observer objects which it may do by holding an array of them in an instance variable. When the subject changes, iteration over the observers allows each to have some behavior invoked in response to the change. If the design is kept this simple then all subject classes may inherit from a parent subject class which implements this interface. However, due to single inheritance in Ruby it is probably a better idea to include the subject interface as a module. In fact, the Ruby standard library comes with a module called Observable for this purpose.

Another variation is using Proc objects as the observers and when the subject changes, each Proc object is called. When the subject passes itself as an argument to the method call on the observers, this is the pull approach since the observers must *pull* anything they need from the subject. If the subject sends the observers particular details instead, it is the *push* approach.

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

This is a tree of objects that all share a common interface which is called the component. There is at least one object called the composite and the non-composite objects are called the leafs. The composite objects have children and the leaf objects do not.

# The Iterator

The `each` method in Ruby is basically the *internal* iterator pattern. Sometimes there are practical reasons to use an *external* iterator (an iterator object) instead, such as merging two sorted arrays into one sorted array. Using external iterators in this case allows you to iterate through each array independently of the other which simplifies constructing the resulting sorted array.

Including the `Enumerable` module into a class and defining an instance method `each` will give that class many useful methods such as `include?` and `all`. If the objects that are being iterated over do not implement `<=>`, they will need to implement this for all of the methods to work.

There are other internal iterators in Ruby such as `Array#reverse_each` and `String#each_byte`. The `ObjectSpace` module has a method `each_object` which iterates through all of the objects that are currently known to the Ruby interpreter.

{% include book_attribution.html 
  book_title = "Design Patterns in Ruby"
  book_author = "Russ Olsen"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0321490452"
  book_link = "https://www.amazon.com/Design-Patterns-Ruby-Russ-Olsen/dp/0321490452"
%}