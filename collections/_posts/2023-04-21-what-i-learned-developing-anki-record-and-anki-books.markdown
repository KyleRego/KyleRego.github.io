---
layout: post
title: "What I learned developing Anki Record and Anki Books"
date: 2023-04-21 12:15:00 -0500
categories: programming ruby rails
permalink: /what-i-learned-developing-anki-record-and-anki-books
emoji: 🤔
mathjax: false
---

This is a post on some of the more notable stuff I learned developing [Anki Record](https://github.com/KyleRego/anki_record) and [Anki Books](https://github.com/KyleRego/anki_books). I am still working on both of these so this post is really a draft.

# Anki Record

Anki Record is a Ruby gem providing an API to Anki flashcard deck packages.

## method_missing and respond_to_missing

I had read about ghost methods in Ruby before but this was the first time I used `method_missing`. In this case, it is what allows setting the values of note fields which can have any name:

```ruby
# lib/anki_record/note/note.rb
def method_missing(method_name, field_content = nil)
  raise NoMethodError, "##{method_name} is not defined or a ghost method" unless respond_to_missing? method_name

  method_name = method_name.to_s
  return @field_contents[method_name] unless method_name.end_with?("=")

  @field_contents[method_name.chomp("=")] = field_content
end

def respond_to_missing?(method_name, *)
  method_name = method_name.to_s
  if method_name.end_with?("=")
    note_type.snake_case_field_names.include?(method_name.chomp("="))
  else
    note_type.snake_case_field_names.include?(method_name)
  end
end
```

`method_missing` is a method of `BasicObject` in Ruby that the `Object` class inherits. When a method is called on an object that does not implement the method, `BasicObject#method_missing` is called which throws the usual exception. However, if a different class in the method lookup path has defined `method_missing`, that `method_missing` will be called instead.

The note types can have arbitrarily named fields. `Note#method_missing` here is simply checking if the method call is a getter or setter of the value of one of the note's note type's fields and then getting or setting the field value appropriately. Defining `respond_to_missing?` separately also has the benefit of allowing the note objects to return `true` when asked if they `respond_to?` the ghost methods.

## Closures

I also had an opportunity to do some slightly less non-trivial things with closures. I had to think about them a bit to allow the library to support writing scripts like this:

```ruby
AnkiRecord::AnkiPackage.open(path: "./test_1.apkg") do |collection|
  note = collection.find_note_by id: note_id
  note.crazy_back = "Ruby"
  note.save
end
```

The collection object is yielded to the block argument which is a closure because it carries artifacts that were in scope where it was defined into the method call.

This script does not edit the `test.apkg` file. It instead zips a new file with almost the same name (a timestamp is appended to the name). The new file has the changes due to whatever the block argument does. I designed it in this way because it is necessary to temporarily unzip the original Anki package into multiple SQLite databases and media files while the closure argument is executing, and I wanted to make sure those files would not be left on the system if the script threw an error:

```ruby
# lib/anki_record/anki_package/anki_package.rb
def execute_closure_and_zip(object_to_yield, &closure)
  closure.call(object_to_yield)
rescue StandardError => e
  destroy_temporary_directory
  puts_error_and_standard_message(error: e)
else
  zip
end
```

This method handles the block argument of both `AnkiPackage.new` and `AnkiPackage.open`. It is pretty basic but it did help me appreciate the syntax of changing the block argument to a Proc object as the method is called.

## RSpec integration tests performance

Anki Record fundamentally has some methods that, even when called only once in a test, needs to have many things checked to test that it happened correctly. For example, saving an updated note to the deck package changes data in many columns across multiple tables due to the Anki data structure.

At first I was following the rule of one expect per example which is generally agreed upon as a good RSpec practice. However, this soon caused the tests to take a long time. Here is a small example (I also learned later when I started using the RSpec RuboCop extension that the examples should not start with the word "should" and should also be followed by a newline):

```ruby
# Memoized helper methods and one expect per test makes the tests very expensive.
subject(:note_from_existing_record) do
  AnkiRecord::Note.new collection: anki_package.collection, data: note_cards_data
end
it "should instantiate a note object" do
  expect(note_from_existing_record).to be_a AnkiRecord::Note
end
it "should instantiate a note object with id attribute equal to the id of the note in the data" do
  expect(note_from_existing_record.id).to eq note_data["id"]
end
it "should instantiate a note with collection attribute being an instance of a Collection" do
  expect(note.collection).to be_a AnkiRecord::Collection
end
it "should instantiate a note object with guid attribute equal to the guid of the note in the data" do
  expect(note_from_existing_record.guid).to eq note_data["guid"]
end
it "should instantiate a note object with last_modified_timestamp attribute equal to the mod of the note in the data" do
  expect(note_from_existing_record.last_modified_timestamp).to eq note_data["mod"]
end
it "should instantiate a note object with tags attribute equal to an empty array (because the note has no tags)" do
  expect(note_from_existing_record.tags).to eq []
end
```

The expectations are all being made on the same object but the object is being teared down and set up again for every example. I thought about how best to improve performance here and realized I could use `before(:all)` to set up the object once for all of the examples and keep one expect per example, or I could continue to use the memoized helper method and break the one expect per example rule. Despite the warning against using `before(:all)` in the RSpec documentation, I chose this option to continue to have one expect per example:

```ruby
# Using before(:all) instead of memoized helpers allows one expect per example with much better performance.
# But this is NOT recommended.
before(:all) do
  anki_package = AnkiRecord::AnkiPackage.new name: "package_to_test_notes"
  default_deck = anki_package.collection.find_deck_by name: "Default"
  basic_and_reversed_card_note_type = anki_package.collection.find_note_type_by name: "Basic (and reversed card)"
  note = AnkiRecord::Note.new note_type: basic_and_reversed_card_note_type, deck: default_deck
  note.front = "What is the ABC metric?"
  note.back = "A software metric which is a vector of the number of assignments, branches, and conditionals in a method, class, etc."
  note.save
  note_cards_data =  anki_package.collection.note_cards_data_for_note_id sql_able: anki_package, id: note.id
  @note_data = note_cards_data[:note_data]
  @cards_data = note_cards_data[:cards_data]
  @note_from_existing_record = AnkiRecord::Note.new collection: anki_package.collection, data: note_cards_data
end
it "should instantiate a note object" do
  expect(@note_from_existing_record).to be_a AnkiRecord::Note
end
it "should instantiate a note object with id attribute equal to the id of the note in the data" do
  expect(@note_from_existing_record.id).to eq @note_data["id"]
end
it "should instantiate a note with collection attribute being an instance of a Collection" do
  expect(@note_from_existing_record.collection).to be_a AnkiRecord::Collection
end
it "should instantiate a note object with guid attribute equal to the guid of the note in the data" do
  expect(@note_from_existing_record.guid).to eq @note_data["guid"]
end
it "should instantiate a note object with last_modified_timestamp attribute equal to the mod of the note in the data" do
  expect(@note_from_existing_record.last_modified_timestamp).to eq @note_data["mod"]
end
it "should instantiate a note object with tags attribute equal to an empty array (because the note has no tags)" do
  expect(@note_from_existing_record.tags).to eq []
end
```

When I was working on Anki Books later and added the RSpec RuboCop extension, that lead me to realize I should have stuck with the memoized helper methods and just had more than one expect per example.

So I learned some nuance to the one expect per example rule when it comes to RSpec tests which might be considered integration tests.

# Anki Books

Anki Books is a Rails application that eventually will use the Anki Record gem.

## Linux

To have a server running the application in production, I backed up everything on my old college computer and installed Ubuntu on it. This was my first time doing a Linux installation, although I have been using WSL2 every day for a couple years now. Some other stuff that was new to me was setting up the firewall, SSH service, Apache web server, DNS records, and digital certificate.
