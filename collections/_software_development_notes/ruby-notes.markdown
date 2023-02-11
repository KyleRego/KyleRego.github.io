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

- Related:
  - [Ruby resources](/ruby-linklog)

# The Ruby object model

Classes in Ruby (including `Object`) are objects with class `Class` (the class of a class is `Class`). `Class` inherits from `Module` and adds a few methods including `#new`. The superclass of `Module` is `Object`. With `irb`:

{% highlight ruby %}
:001 > Object.class
 => Class
:002 > Object.superclass
 => BasicObject
:003 > Class.class
 => Class
:004 > Class.superclass
 => Module
:005 > Module.class
 => Class
:006 > Module.superclass
 => Object
:007 > class CustomClass; end
 => nil
:008 > CustomClass.class
 => Class
:009 > CustomClass.superclass
 => Object
{% endhighlight %}

It is kind of confusing how classes are objects with class `Class` and superclass `Object` but the `Class` class which also is an object with class `Class` has the superclass `Module`.

An object mainly has instance variables and a reference to its class. The class stores the methods which can be called on the object, which is an instance of the class, so those methods are called instance methods. The `#instance_variables` and `#methods` methods can be called on an object to see the object's instance variables and methods as arrays of symbols.

Since both classes and modules are objects used as containers for methods with the difference being classes have three extra instance methods, the main thing to keep in mind when choosing between them is if you intend to include the methods into a class or instantiate specific objects to use the methods.

## Open classes

The `class` keyword in Ruby is like a scope operator that moves into the context of a class. When `class X` is interpreted for the first time, the `X` class object is created. When `class X` is encountered later, the class is reopened and can be modified. This makes it very easy to add functionality to the standard library:

{% highlight ruby %}
class String
  def mock
    split('').map.with_index do |char, index|
      index.odd? ? char.upcase : char.downcase
    end.join
  end
end

str = 'There is no way to convey sarcasm with text'

str.mock # => "tHeRe iS No wAy tO CoNvEy sArCaSm wItH TeXt"
{% endhighlight %}

This adds an instance method to `String`.

### Monkeypatching

The downside to the openness of Ruby classes is the very low barrier to introducing bugs by overwriting a method with the same name. This is called *monkeypatching*.

Sometimes monkeypatching is done intentionally.

## Method lookup

When a method is called on an object, the first place that is searched for the method is the object's class. If the method is not in the object's class, the next place Ruby looks is the class's superclass. If it's not in there, then Ruby checks the class's superclass's superclass. This goes on until eventually the `Object` class is searched and then finally `BasicObject`.

However, *include classes* are also inserted into the method lookup path when modules are included into any of the classes in it. The include class is checked after the class the module is included into and before the method lookup moves to that class's superclass. The `Kernel` module is included into the `Object` class as part of the standard library.

To see the method lookup path/ancestor chain of an object, use the `#ancestors` method. This will usually show `Kernel` just after `Object`.

### Kernel methods

A lot of commonly used methods, like `puts` and `p`, live in this module:

{% highlight ruby %}
Kernel.private_instance_methods.grep(/^p/)
#  => [:pp, :proc, :printf, :print, :putc, :puts, :p]
{% endhighlight %}

Modules are just as open as classes. One way to add methods that can be used anywhere like `puts` is adding them to the `Kernel` module.

### Ghost methods

Ghost methods are methods that can be called even though they are never defined. This is done by carefully defining `method_missing` somewhere in the method lookup path of an object, which overrides `BasicObject#method_missing`:

{% highlight ruby %}
class MyClass
  def method_missing(method)
    method
  end
end

MyClass.new.what_is_this_method # => :what_is_this_method
{% endhighlight %}

The [OpenStruct data type](https://ruby-doc.org/stdlib-2.5.1/libdoc/ostruct/rdoc/OpenStruct.html) takes advantage of this:

> An OpenStruct utilizes Ruby's method lookup structure to find and define the necessary methods for properties. This is accomplished through the methods method_missing and define_singleton_method.

This type lets you define arbitrary attributes:

{% highlight Ruby %}
require "ostruct"

person = OpenStruct.new
person.name = "John Smith"
person.age  = 70

person.name      # => "John Smith"
person.age       # => 70
person.address   # => nil
{% endhighlight %}

The `name=` method is missing so, at first approximation, the `OpenStruct#method_missing` handles this by chomping `=` from the missing method name and using the result as a key in an instance variable hash with `"John Smith"` as the value. It also allows calling arbitrary getters like `name` and `address` to access this hash.

#### Considerations

It may be a good practice to also override `respond_to?` when overriding `method_missing` such that it returns `true` for the object's ghost methods.

Logical bugs may occur with ghost methods when there are name conflicts with explicitly defined methods.

Since a ghost method can only be invoked after the method lookup path reaches `method_missing`, ghost methods do suffer a performance disadvantage.

## The current object

The current object is called `self` and is the singular object inside which a Ruby program is currently executing. When a method is called on an object, that object becomes `self`. Any method which is called without an explicit receiver is called on `self`. All instance variables that are assigned become instance variables of `self`.

The `class` keyword opens the scope of the class; inside this scope, `self` refers to the class itself.

### Private methods

An easy way to understand the `private` access modifier method is `self`. Private methods cannot be called with an explicit receiver in Ruby. Therefore a private method can only be used inside an object which has access to the private method through its method lookup path. 

### The top-level context (the main object)

`self` at the highest level of program execution is an object called `main` which is sometimes referred to as the top-level context.

## Constants/namespaces

Constants in Ruby are any references which begin with a capital letter (though it is common to name constants with only capital letters). These include the references to classes and modules which always begin with a capital letter. Attempting to define a module or class with a name that begins with a lowercase letter will throw a `NameError`.

A module used as a container for constants is a namespace:

{% highlight ruby %}
module MyContainer
  class MyClass
    def initialize(name)
      @my_instance_variable = name
    end

    def hello
      puts "Hi, I am #{@my_instance_variable}"
    end
  end
end

MyContainer::MyClass.new("a class in a namespace").hello
# Hi, I am a class in a namespace
#  => nil
{% endhighlight %}

Using namespaces is a very good way to avoid name conflicts between libraries and is recommended when developing gems.

### The root namespace

`::` acts as the root namespace if you need to access an outer constant from inside a deeper level of namespace nesting.

# Closures

Code needs an environment to run inside of. This environment includes `self` and variables that are in scope; these are collectively referred to as the *bindings*. *Closures* are essentially a language construct that packages some code with an environment. The three kinds of closures to know in Ruby are blocks, procs, and lambdas.

## Scope

*Scope* is closely related to the concept of closures. In Ruby, an inner scope does not have access to bindings of the outer scope, which is different from languages such as Python and Java. The `Kernel#local_variables` method may be useful to see what variables are in scope at any point in the program.

There are three keywords in Ruby that cause the scope to change:
- `class`
- `module`
- `def`

To define a method without opening a new scope, use `Module#define_method` to flatten the scope. This can also be used to define methods which share variables defined in their shared, flattened scope.

To define a class or module without opening a new scope, use `Class.new` or `Module.new`.

## Blocks

A block is one of the rare things in Ruby which is not an object (and the only kind of closure in Ruby which is not an object).

Blocks in Ruby are defined with `{ ... }` or `do .. end` (curly braces are usually preferred for single-line blocks) as a `block argument` to a method call. The method which receives a block can call `yield` to pass execution into the block. A block can be defined such that it takes arguments from the method by the method calling `yield` with some arguments. So the block is an argument to the method, and the method can then pass arguments to the block.

`block_given?` returns true if the current call includes a block. `yield` will throw an error if `block_given?` is `false`.

A block is the most common kind of closure in Ruby. If a method is passed a block argument, any bindings from the environment that are in scope where the block is defined are packaged with the block as part of the block argument into the method.

`Object#instance_eval` can be used to evaluate a block in the context of an object. `self` inside the block is the receiver of `instance_eval`. This is somewhat similar to `Object#tap`, which yields `self` as an argument to the `tap` block argument.

## Procs

A proc is the object version of a block. Since it is an object, it can be referenced by a variable. The main thing this lets you do is define the proc somewhere and then somewhere else use it. This allows carrying the bindings from where the proc was defined to somewhere else in the program, since a proc is a closure.

The main way to instantiate a proc is to pass a block argument to one of `Proc#new`, `Kernel#proc`, or `Kernel#lambda`. `Proc#call` executes the code of the proc object.

When the `&` operator is used to prefix the last parameter of a method, a block argument to that method is converted to a proc object inside the method and referenced by that parameter.

`Method#to_proc` can be also used to convert a method to a proc.

## Lambdas

Lambdas are procs instantiated with `Kernel#lambda` and are different enough that they are generally considered a different thing. The two main differences are a different behavior of `return` inside the proc vs. lambda and that lambdas tend to have stricter arity.

There is also a notation for defining lambdas called the "stabby lambda" operator: `v = -> (x) { puts x }`.

# Other Ruby features

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

## Class instance variables

Class variables (*bad!*) in Ruby (which start with `@@`) are shared between all the instances of the class including instances of child classes:

{% highlight Ruby %}
class MyClass
  @@count = 0

  def initialize
    @@count += 1
  end

  def self.count
    @@count
  end
end

class MyChildClass < MyClass; end

10.times do
  MyClass.new
  MyChildClass.new
end

puts MyClass.count
# 20
#  => nil
puts MyChildClass.count
# 20
#  => nil
{% endhighlight %}

Most people prefer class instance variables. Since a class is an object, it can have instance variables, and these will not be inherited by child classes:

{% highlight Ruby %}
class MyClass
  @count = 0

  def initialize
    self.class.increment_count
  end

  def self.increment_count
    @count += 1
  end

  def self.count
    @count
  end
end

class MyChildClass < MyClass
  @count = 0
end

10.times do
  MyClass.new
  MyChildClass.new
end

puts MyClass.count
# 10
#  => nil
puts MyChildClass.count
# 10
#  => nil
{% endhighlight %}

## Object#send

An alternative way to call a method on an object in Ruby (which is sometimes called sending a message to an object) is the `Object#send` method:

{% highlight Ruby %}
string = "my example string"
string.upcase # => "MY EXAMPLE STRING"
string.send(:upcase) # => "MY EXAMPLE STRING"
{% endhighlight %}

This can be a useful thing to do. Consider these unit tests:

{% highlight Ruby %}
require 'minitest/autorun'
require_relative 'scrabble_score'

class ScrabbleTest < Minitest::Test
  def test_empty_word_scores_zero
    assert_equal 0, Scrabble.new('').score
  end

  # lots of other tests that I removed for brevity

  def test_complicated_word_scores_more
    assert_equal 22, Scrabble.new('quirky').score
  end

  def test_scores_are_case_insensitive
    assert_equal 41, Scrabble.new('OXYPHENBUTAZONE').score
  end

  # more tests down here also omitted

  # the main thing to notice is 
  # all the test method names start with test_
end
{% endhighlight %}

It may be that Minitest iterates through `public_instance_methods(true).grep(/^test_/)` and calls `send` with each method name.

`Object#send` is one way to bypass the `private` access modifier--`Object#public_send` is a similar method which does not ignore `private`.

## Module#define_method

Similarly, here are two ways to define a method:

{% highlight Ruby %}
def my_method
  puts "this method was defined the usual way"
end

define_method :other_method do
  puts "this method was defined with #define_method"
end

my_method
# this method was defined the usual way
#  => nil
other_method
# this method was defined with #define_method
#  => nil
{% endhighlight %}

## Kernel#eval

You can use this method to execute arbitrary code passed to it as a string:

{% highlight Ruby %}
eval "puts 'hello from eval'"
# hello from eval
#  => nil
{% endhighlight %}

**But you should consider the risk of code injection.** You could create a sandbox, taking advantage of the global variable `$SAFE` and that Ruby tracks which objects are "tainted" or unsafe. Or just do whatever you need to do a different way.

## Kernel#binding

You can create a Binding object which stores the scope in which it was created, and pass this as the first optional argument to `Kernel#eval`:

{% highlight Ruby %}
class MyClass
  def my_class_binding
    y = 'hello from eval'
    binding
  end
end

my_binding = MyClass.new.my_class_binding
eval "puts y", my_binding
# hello from eval
#  => nil
{% endhighlight %}

## Here documents

If you want to pass a string to `eval` spanning multiple lines you can use a here document:

{% highlight Ruby %}
str = <<-DESC
hello
  world
DESC

puts str
# hello
#   world
#  => nil
{% endhighlight %}

## Hook Methods

These are methods that are called when certain things happen. You can overwrite them to hook on additional behavior:

{% highlight Ruby %}
class MyClass
  def self.inherited(subclass)
    puts "#{subclass} has inherited from #{self}"
  end
end

class MySubclass < MyClass; end
# MySubclass has inherited from MyClass
#  => nil
{% endhighlight %}

{% include attribution-book.html
  book_title = "Metaprogramming Ruby: Program Like the Ruby Pros"
  book_author = "Paolo Perrotta"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "978-1934356470"
  book_link = "https://www.amazon.com/Metaprogramming-Ruby-Program-Like-Pros/dp/1934356476"
%}