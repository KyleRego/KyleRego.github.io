---
layout: post
title: "How to recurse through a parsed JSON Ruby object"
date: 2023-03-15 16:30:00 -0500
categories: programming ruby
permalink: /how-to-recurse-through-a-parsed-json-ruby-object
emoji: 😎
mathjax: false
---

Today I wanted to recurse through all of the values in some parsed JSON Ruby objects (I had a practical reason for this). I approached the problem in a very similar way as when I solved this other problem: [counting the number of times a symbol appears in an S-expression](/how-to-design-programs). This post shows the method (after a little refactoring) I wrote to solve this problem.

*Is the approach here pretty pointless if a standard library thing I don't know about does the same thing and would be more obvious? Even so, the method here is somewhat interesting and the post is a good review of JSON, recursion, and Ruby closures.*

To understand the method, we need to understand the data type of the argument. The argument is any Ruby object that can be returned by `JSON.parse` passed a valid JSON string.

[JSON](https://en.wikipedia.org/wiki/JSON) is one of the following:
- an array of values
- an object of keys and values.

The keys are always strings and the values may be strings, numbers, arrays, objects, or `null`. It is easy to see how `JSON.parse` parses each into Ruby objects with irb:

{% highlight ruby %}
:001 > require "json"
 => true
:002 > array_json = ["hello", "world"].to_json
 => "[\"hello\",\"world\"]"
:003 > JSON.parse(array_json)
 => ["hello", "world"]
:004 > object_json = { "hello" => "world", "foo" => "bar" }.to_json
 => "{\"hello\":\"world\",\"foo\":\"bar\"}"
:005 > JSON.parse object_json
 => {"hello"=>"world", "foo"=>"bar"}
:006 > json = [nil].to_json
 => "[null]"
:007 > JSON.parse json
 => [nil]
{% endhighlight %}

The Ruby object returned by `JSON.parse` is an array or hash with values that can be arrays and hashes that also have values that can be arrays and hashes and so on recursively. The solution is straightforward after understanding this (as long as you agree Ruby closures are straightforward):

```ruby
def recurse_through(arg, &closure)
  if arg.instance_of?(Hash)
    arg.each_value { |value| recurse_through(value, &closure) }
  elsif arg.instance_of?(Array)
    arg.each { |value| recurse_through(value, &closure) }
  else
    yield arg
  end
end
```

*Sidebar on closures: prefixing the last parameter of the method with `&` converts the block argument to that method into a Proc object inside, referenced by that parameter. Prefixing the argument passed into the method with `&` converts the Proc object to a block argument.*

And that's pretty much it. The following shows some simple uses:

```ruby
hash1 = {
  hello: "world_1",
  world: {
    hello: {
      hello: "world_a",
      world: "hello_b",
      world_2: {
        world: :hello_symbol
      }
    }
  },
  array: ["yes_1", "no_1", "yes_2", "no_2"],
  array_of_hashes: [
    {a: "b_1", b: "a_2"}
  ]
}

recurse_through(hash1) do |value|
  puts "This value was #{value}"
end
# This value was world_1
# This value was world_a
# This value was hello_b
# This value was hello_symbol
# This value was yes_1
# This value was no_1
# This value was yes_2
# This value was no_2
# This value was b_1
# This value was a_2

hash2 = {
  a: {
    hi: "mom",
    santa: "clause"
  },
  b: {
    a: ["this be in array"],
    b: ["this be in the other array"],
    c: [
      {
        and: "this be in the hash in the third array"
      }
    ]
  },
  c: "yep"
}

recurse_through(hash2) do |value|
  puts "And this value was #{value}"
  puts "yep"
end
# And this value was mom
# yep
# And this value was clause
# yep
# And this value was this be in array
# yep
# And this value was this be in the other array
# yep
# And this value was this be in the hash in the third array
# yep
# And this value was yep
# yep

array = ["this works too", { yes: "yes sir"}]

recurse_through(array) do |value|
  2.times { puts value }
end
# this works too
# this works too
# yes sir
# yes sir

count = 0
recurse_through([hash1, hash2, array]) { |_| count += 1 }
puts "There were a total of #{count} values in those 3 objects."
# There were a total of 18 values in those 3 objects.

```

Mileage may vary when it comes to performance. I imagine this could overflow the call stack with a large enough JSON object, for example. Hope this helps!
