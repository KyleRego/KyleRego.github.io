---
layout: post
title:  "Ruby notes"
categories: ruby programming
permalink: /ruby-notes
emoji: 😍
mathjax: false
---

Ruby is the popular programming language designed by Yukihiro Matsumoto in the 90s. His goal was to create a genuine object-oriented scripting language that would increase the productivity and happiness of the developers using it.

At the heart of this language is an object model that makes it very easy to write code that manipulates its own language constructs at runtime.

## The current object

The current object is `self`. This is the object inside which the Ruby program is currently executing. When a method is called on an object, that object becomes `self`. Any method which is called without an explicit receiver is called on `self`. All instance variables that are assigned become instance variables of `self`.

The `class` keyword opens the scope of the class; inside this scope, `self` refers to the class itself.

`self` at the highest level of program execution is an object called `main` which is sometimes referred to as the top-level context.

Private methods cannot be called with an explicit receiver in Ruby. Private methods can only be used inside an object `self` which has access to the private methods.

## Closures

The environment that code executes in includes `self` and the variables that are in scope. These are referred to as the *bindings*.

*Closures* are a language construct that packages some code with an environment. The three kinds of closures to know in Ruby are blocks, procs, and lambdas.

### Scope

*Scope* is closely related to the concept of closures. In Ruby, an inner scope does not have access to bindings of the outer scope, which is different from some other languages. `Kernel#local_variables` can be useful to see what variables are currently in scope.

There are three keywords in Ruby that cause the scope to change:
- `class`
- `module`
- `def`

To define a method, class, or module without opening a new scope, use `Module#define_method`, `Class.new`, or `Module.new`

### Blocks

A block is one of the rare things in Ruby which is not an object (and the only kind of closure in Ruby which is not an object).

Blocks in Ruby are defined with `{ ... }` or `do .. end` (curly braces are usually preferred for single-line blocks) as a `block argument` to a method call. The method which receives a block can call `yield` to pass execution into the block. A block can be defined such that it takes arguments from the method by the method calling `yield` with some arguments. So the block is an argument to the method, and the method can then pass arguments to the block.

`block_given?` returns true if the current call includes a block. `yield` will throw an error if `block_given?` is `false`.

A block is the most common kind of closure in Ruby. If a method is passed a block argument, any bindings from the environment that are in scope where the block is defined are packaged with the block as part of the block argument into the method.

`Object#instance_eval` can be used to evaluate a block in the context of an object. `self` inside the block is the receiver of `instance_eval`. This is somewhat similar to `Object#tap`, which yields `self` as an argument to the `tap` block argument.

### Procs

A proc is the object version of a block. Since it is an object, it can be referenced by a variable. The main thing this lets you do is define the proc somewhere and then somewhere else use it. This allows carrying the bindings from where the proc was defined to somewhere else in the program, since a proc is a closure.

The main way to instantiate a proc is to pass a block argument to one of `Proc#new`, `Kernel#proc`, or `Kernel#lambda`. `Proc#call` executes the code of the proc object.

When the `&` operator is used to prefix the last parameter of a method, a block argument to that method is converted to a proc object inside the method and referenced by that parameter.

`Method#to_proc` can be also used to convert a method to a proc.

### Lambdas

Lambdas are procs instantiated with `Kernel#lambda` and are different enough that they are generally considered a different thing. The two main differences are a different behavior of `return` inside the proc vs. lambda and that lambdas tend to have stricter arity.

There is also a notation for defining lambdas called the "stabby lambda" operator: `v = -> (x) { puts x }`.

## Singleton Methods

A singleton method is a method defined on a specific object:

{% highlight Ruby %}
x = false

def x.yell
  puts "I AM #{self}"
end

x.yell
# I AM false
#  => nil
{% endhighlight %}

This is also how we define class methods:

{% highlight Ruby %}
class MyClass
  def self.yell
    puts "I AM #{self}"
  end
end

MyClass.yell
# I AM MyClass
#  => nil
{% endhighlight %}

The object's eigenclass is where the singleton method is stored. Method lookup searches the eigenclass before the object's conventional class. 

`class << x` opens up the scope of `x`'s eigenclass so you can also define singleton methods like this:

{% highlight Ruby %}
x = false

class << x
  def yell
    puts "I AM #{self}"
  end
end

x.yell
# I AM false
#  => nil
{% endhighlight %}

Similarly, we can define class methods like this:

{% highlight Ruby %}
class MyClass
  class << self
    def yell
      puts "I AM #{self}"
    end
  end
end

MyClass.yell
# I AM MyClass
#  => nil
{% endhighlight %}

## The root namespace

`::` acts as the root namespace if you need to access an outer constant from inside a deeper level of namespace nesting.

{% include attribution-book.html
  book_title = "Metaprogramming Ruby: Program Like the Ruby Pros"
  book_author = "Paolo Perrotta"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "978-1934356470"
  book_link = "https://www.amazon.com/Metaprogramming-Ruby-Program-Like-Pros/dp/1934356476"
%}
