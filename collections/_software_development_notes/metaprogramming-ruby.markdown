---
layout: post
title:  "Ruby metaprogramming"
categories: ruby programming
permalink: /metaprogramming-ruby
emoji: 😍
mathjax: false
---

Metaprogramming: writing code that writes code. With the Ruby programming language, almost every language construct is an object, and objects can be manipulated at runtime. [Metaprogramming Ruby](https://www.amazon.com/Metaprogramming-Ruby-Program-Like-Pros/dp/1934356476) describes the common Ruby programming patterns related to this idea. The book finishes with some sightseeing of these patterns in Ruby on Rails. 

My review: it's a buy (also, I read the first edition but there is a second edition that may be even better). Some terse notes about Ruby programming follow.

# The Ruby Object Model

Classes in Ruby are objects with class `Class`. `Class` inherits from `Module` and adds a few methods like `initialize` and `new`. The superclass of `Module` is `Object`. With `irb`:

{% highlight ruby %}
:001 > Class.superclass
 => Module
:002 > Module.superclass
 => Object
{% endhighlight %}

## Open Classes/Monkey patching

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

## Namespaces

Constants in Ruby are references which begin with a capital letter and include classes and modules. A module used as a container for constants is a namespace:

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

## Kernel Methods

The `Kernel` module is included into the `Object` class and thus is available to every object in Ruby. A lot of commonly used methods, like `puts` and `p`, live in this module:

{% highlight ruby %}
Kernel.private_instance_methods.grep(/^p/)
#  => [:pp, :proc, :printf, :print, :putc, :puts, :p]
{% endhighlight %}

# Methods

## Ghost Methods

With this, you define `method_missing` earlier in the method lookup path than `BasicObject`:

{% highlight ruby %}
class MyClass
  def method_missing(method)
    method
  end
end

MyClass.new.what_is_this_method # => :what_is_this_method
{% endhighlight %}

The [OpenStruct Ruby documentation](https://ruby-doc.org/stdlib-2.5.1/libdoc/ostruct/rdoc/OpenStruct.html) mentions this in the implementation section:

> An OpenStruct utilizes Ruby's method lookup structure to find and define the necessary methods for properties. This is accomplished through the methods method_missing and define_singleton_method.

This data structure allows defining arbitrary attributes:

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

## Object#send

Here are two ways to call a method:

{% highlight Ruby %}
string = "my example string"
string.upcase # => "MY EXAMPLE STRING"
string.send(:upcase) # => "MY EXAMPLE STRING"
{% endhighlight %}

Why would you ever want to do this? Consider these unit tests I wrote with [MiniTest](https://github.com/minitest/minitest):

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

MiniTest might get an array like `public_instance_methods(true).grep(/^test_/)` and then iterate through it and call `send` with each method name. I have read the source a bit to see if it's really that simple, and obviously it's not, but that is generally what it does.

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

# Closures

According to [Wikipedia](https://en.wikipedia.org/wiki/Closure_(computer_programming)), "a closure is a record storing a function together with an environment." A Ruby block is a closure since it stores the environment from where it was defined:

{% highlight Ruby %}
def yield_to_a_block
  foo = 'this foo is in scope when the block is invoked'
  yield if block_given?
end

foo = 'this foo is in scope when the block is defined'

yield_to_a_block do
  puts foo
end
# this foo is in scope when the block is defined
#  => nil
{% endhighlight %}

A block is one of the rare things in Ruby which is not an object. The object version of a block is a `Proc`, and a `lambda` is also a `Proc` with some important differences, like stricter arity and a different behavior of `return`.

## Scope Gates

`class`, `module`, and `def` are keywords in Ruby which open a new scope.

{% highlight Ruby %}
foo = 'this is not in scope in the method'

def throws_an_error
  puts foo
end

throws_an_error
# you get something like:
# undefined local variable or method `foo' for main:Object (NameError)
{% endhighlight %}

## Scope Flattening

We can get around this by not using the `def` keyword to define the method:

{% highlight Ruby %}
foo = 'this is in scope when the closure is created'

define_method :this_works do
  puts foo
end

this_works
# this is in scope when the closure is created
#  => nil
{% endhighlight %}

You could also define additional methods with `foo` captured by closures so that they can share this variable. You could do this such that `foo` is private to the methods as well.

## Object#tap

If you have a long method chain for some reason and want to see what the return value is at points in it, you can use `tap`:

{% highlight Ruby %}
string = "a test string"
string.tap { |s| p s }
      .upcase.tap { |s| p s }
      .downcase.tap { |s| p s }
      .upcase.tap { |s| p s }
# "a test string"
# "A TEST STRING"
# "a test string"
# "A TEST STRING"
#  => "A TEST STRING"
{% endhighlight %}

`tap` pretty much just yields `self` to the block and then returns `self`.

## BasicObject#instance_eval

This lets you evaluate a block in the context of an object (`self` in the block becomes the receiver):

{% highlight Ruby %}
class MyClass
  def initialize(name, number)
    @name = name
    @number = number
  end
end

my_object = MyClass.new("a class", 7)

my_object.instance_eval do
  puts "Hi, I am #{@name} and my number is #{@number}"
end
# Hi, I am a class and my number is 7
#  => nil
{% endhighlight %}

## Deferring evaluation

We can create a `Proc` and then execute it later:

{% highlight Ruby %}
my_proc = Proc.new do |arg|
  puts "hello from inside the proc; I was called with #{arg}"
end
puts "this happens in between creating the proc and using it"
# this happens in between creating the proc and using it
#  => nil
my_proc.call("an argument")
# hello from inside the proc; I was called with an argument
#  => nil
{% endhighlight %}

# Class Definitions

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

# Extras

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
str = <<A_HEREDOC
hello
  world
A_HEREDOC

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

**If you learned something here, you should check out [Metaprogramming Ruby](https://www.amazon.com/Metaprogramming-Ruby-Program-Like-Pros/dp/1934356476).**

{% include attribution-book.html
  book_title = "Metaprogramming Ruby: Program Like the Ruby Pros"
  book_author = "Paolo Perrotta"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "978-1934356470"
  book_link = "https://www.amazon.com/Metaprogramming-Ruby-Program-Like-Pros/dp/1934356476"
%}