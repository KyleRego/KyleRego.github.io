---
layout: post
title: "method_missing in the Anki Record gem"
date: 2023-07-09 17:30:00 -0500
categories: programming ruby
permalink: /anki_record_method_missing
emoji: 👻
mathjax: false
---

This post describes the ghost methods in the Anki Record gem that are defined with the `Note#method_missing` method. `BasicObject#method_missing` normally throws an exception when an object is called with a method that its class or any class in its method lookup path do not define. `BasicObject` is the parent class of `Object` which all of the objects in Ruby derive from. The method lookup path can be seen for any class by calling the `ancestors` method on it:

```ruby
3.2.1 :001 > Array.ancestors
 => [Array, Enumerable, Object, PP::ObjectMixin, Kernel, BasicObject]
3.2.1 :002 > String.ancestors
 => [String, Comparable, Object, PP::ObjectMixin, Kernel, BasicObject]
```

When a method is called on an object, the object's class is checked for the method. If the class does not have it, include classes (which represent included modules) are checked (also, before the object's class is checked, the object's eigenclass (where the singleton methods (methods defined on the object itself instead of the class) are held) is checked). After the include classes/modules are checked, the class's superclass is checked, followed by any modules included into the superclass, and so on until the place to look next is `BasicObject`. If `BasicObject` is reached and it does not know the method, `BasicObject#method_missing` throws a `NoMethodError`.

So it turns out you can exploit Ruby method lookup to prevent reaching the `BasicObject#method_missing` method. By doing this, you can make something else happen when an undefined method is called on an object. Effectively, you can allow method calls with methods that the objects do not have. These methods that can be used even though they do not have specific method definitions in the code are called ghost methods. (A lot of software developers would be very unhappy to see you do this in a code review.)

The use case in Anki Record is to allow setters and getters of the data in specific fields of the notes. The Anki data model is somewhat complicated but the idea is essentially that notes are written as data in specific fields of the note's note type and this data is used to create cards according to the note type's card templates. So a note type can have many note fields with different names, that for each note, contain the data that is inserted into the card templates to make the cards for each note.

The Anki Record gem is just a Ruby library using the RubyZip and sqlite3 gems to create and update Anki deck package files. These files, which have the .apkg file extension, are just zip files containing a few different files including two SQLite databases. So with the gem, we might create a new note type like this:

{% highlight Ruby %}{% raw %}
custom_note_type = AnkiRecord::NoteType.new(anki21_database:,
                                            name: "New custom note type")
AnkiRecord::NoteField.new(note_type: custom_note_type,
                          name: "custom front")
AnkiRecord::NoteField.new(note_type: custom_note_type,
                          name: "custom back")
custom_card_template = AnkiRecord::CardTemplate.new(note_type: custom_note_type,
                                                    name: "Custom template 1")
custom_card_template.question_format = "{{custom front}}"
custom_card_template.answer_format = "{{custom back}}"
second_custom_card_template = AnkiRecord::CardTemplate.new(note_type: custom_note_type,
                                                            name: "Custom template 2")
second_custom_card_template.question_format = "{{custom back}}"
second_custom_card_template.answer_format = "{{custom front}}"

css = <<~CSS
  .card {
    font-size: 16px;
    font-style: Verdana;
    background: transparent;
    text-align: center;
  }
CSS
custom_note_type.css = css
custom_note_type.save
{% endraw %}{% endhighlight %}

So the note type has two note fields called "custom front" and "custom back." Now to create an Anki note using this new custom note type:

{% highlight Ruby %}{% raw %}
note = AnkiRecord::Note.new(note_type: custom_note_type, deck: custom_deck)
note.custom_front = "Content of the 'custom front' field"
note.custom_back = "Content of the 'custom back' field"
note.save
{% endraw %}{% endhighlight %}

The `Note` class does not implement `custom_front=` or `custom_back=` setter methods. After these field values are set, they can also be read with the `custom_front` and `custom_back` getter methods which are also not defined anywhere. In order to allow note types to be given arbitary note fields that appear to have methods to set and get their values, `method_missing` was defined on `Note`.

{% highlight Ruby %}{% raw %}
def method_missing(method_name, field_content = nil)
  raise NoMethodError, "##{method_name} is not defined or a ghost method" unless respond_to_missing? method_name

  method_name = method_name.to_s
  return @field_contents[method_name] unless method_name.end_with?("=")

  @field_contents[method_name.chomp("=")] = field_content
end
{% endraw %}{% endhighlight %}

The first argument that `method_missing` takes is the name of the method that was missing as a symbol. First it checks that the undefined method is one that matches one of the note field names of the note's note type (also converted to snake_case because methods in Ruby are conventionally snake_case):

```ruby
def respond_to_missing?(method_name, *)
  method_name = method_name.to_s
  if method_name.end_with?("=")
    note_type.snake_case_field_names.include?(method_name.chomp("="))
  else
    note_type.snake_case_field_names.include?(method_name)
  end
end
```

In general it is good practice to defined `respond_to_missing?` when using `method_missing` because this will allow the objects to know that they can respond to certain ghost methods. RuboCop may remind you of this too. To me, raising the exception here seems like appropriate defensive programming because who knows what issues putting field values in that the note type doesn't have could cause later.

Then the method name symbol is converted to a string which is probably a matter of taste. If the method name ends with "=" it sets a value for that field key in the hash. If the method name does not end with "=" then it will simply get the value of that field key in the hash. It is very similar to the `OpenStruct` class in Ruby which also may be using `method_missing`. An improvement might be to wrap the `@field_contents` instance variable in some getter and setter methods of its own.

There are disadvantages to the `method_missing` approach. It is definitely not what I would consider obvious code and could easily lead to programming errors and bugs. It might even be argued that you should never do this. You might make a slight spelling error in a method name resulting in unexpected and completely confusing behavior instead of the common `NoMethodError` that would be simple to debug. There is also a performance cost when Ruby has to go up the method lookup path and check if `method_missing` is defined compared to if the methods were explicitly defined and immediately found.

Ruby has other features for dynamic programming that could have been used instead, but I like the `method_missing` approach in this case. [Metaprogramming Ruby](https://pragprog.com/titles/ppmetr2/metaprogramming-ruby-2/) is a pretty good book on this general topic but this kind of thing should probably be used sparingly anyway.
