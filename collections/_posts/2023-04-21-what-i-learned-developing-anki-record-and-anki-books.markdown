---
layout: post
title: "What I learned developing Anki Books"
date: 2023-04-21 12:15:00 -0500
categories: programming ruby rails
permalink: /what-i-learned-developing-anki-record-and-anki-books
emoji: 🤔
mathjax: false
---

This is a post on some stuff I learned (or just wanted to make a note of) developing [Anki Books](https://github.com/KyleRego/anki_books) which includes the [Anki Record](https://github.com/KyleRego/anki_record) gem (this isolates all of the logic of handling the Anki SQLite databases to a gem). I am still working on both of these so this post is really a draft.

## method_missing and respond_to_missing

I had read about ghost methods in Ruby before but this was the first time I used `method_missing`. In Anki Record, it is what allows setting the values of a note's note fields, which can have any name because the note's note type is allowed to have arbitrary note fields which can have any name:

```ruby
# lib/anki_record/note/note.rb
def method_missing(method_name, field_content = nil)
  unless respond_to_missing? method_name
    raise NoMethodError, "##{method_name} is not defined or a ghost method"
  end

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

`Note#method_missing` here is simply checking if the method call is a getter or setter of the value of one of the note's note type's fields and then getting or setting the field value appropriately. Defining `respond_to_missing?` separately also has the benefit of allowing the note objects to return `true` when asked if they `respond_to?` the ghost methods.

## Closures

I also had an opportunity to do some slightly non-trivial things with closures in Anki Record. TODO: Updates to these notes as a lot of this code has changed. I had to think about them a bit to allow the library to support writing scripts like this:

```ruby
AnkiRecord::AnkiPackage.open(path: "./test_1.apkg") do |collection|
  note = collection.find_note_by id: note_id
  note.crazy_back = "Ruby"
  note.save
end
```

The collection object which represents the data in the database is yielded to the block argument which is a closure because it carries artifacts that were in scope where it was defined into the method call.

This script does not edit the `test_1.apkg` file. It zips a new file with almost the same name (a timestamp is appended to the name). The new file has the changes due to whatever happens to the collection inside the block argument. I designed it in this way because it is necessary to temporarily unzip the original Anki package file into multiple SQLite databases and media files. This ensures that the files are cleaned up even if the script throws an error:

```ruby
# lib/anki_record/anki_package/anki_package.rb
def execute_closure_and_zip(collection, &closure)
  closure.call(collection)
rescue StandardError => e
  destroy_temporary_directory
  puts_error_and_standard_message(error: e)
else
  zip
end
```

This method handles the block argument of both `AnkiPackage.new` and `AnkiPackage.open`. It is pretty basic but it did help me appreciate the syntax of changing the block argument to a Proc object as the method is called.

## RSpec stuff

I learned a lot about RSpec developing this project. It is a lot different to design a new project where you write all the specs from scratch compared to adding to a vast, already enormous Rails monolith. I also used Rubocop with the RSpec extension instead of just standardrb which brought a lot of new things to my attention.

### The RSpec RuboCop extension

Early in Anki Books development, I added several RuboCop extensions including the RSpec one. This lead me to realize that I had many habits of breaking best practices such as overly nested example groups, using the word "should" in examples, not having a newline following examples, using the `eq` matcher instead of `be` with a boolean, etc. It lead me to find [this website about RSpec best practices](https://www.betterspecs.org/) which I thought was really helpful.

### Breaking one expect per example (integration tests)

Anki Record has some methods that, even when called only once in a test, need to have many things tested for that one call. For example, saving an updated note to the deck package changes data in many columns across multiple tables due to the Anki data structure.

At first I was following the rule of one expect per example which is generally agreed upon as a good RSpec practice. However, this soon caused the tests to take a long time. Here is a small example:

```ruby
# Memoized helper methods and one expect per test make the tests take longer.
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

### Separating specs into more files

At first I tried to make sure there was a one-to-one mapping between the source files and spec files. Then the source files become a little big so I extracted parts of the classes into modules, but I continued to have one spec file per class which made the spec files really big. Then I read in [Code Craft](https://www.amazon.com/Code-Craft-Practice-Writing-Excellent/dp/1593271190) that the code should be split into as many files as possible with it making sense. So I started making the specs much more modular.

Instead of these tests being at the end of an 800 LoC spec file, it has its own file:

```ruby
# spec/anki_record/anki_package/anki_package_zip_spec.rb
# frozen_string_literal: true

require "./spec/anki_record/support/anki_package_spec_helpers"

RSpec.describe AnkiRecord::AnkiPackage, "#zip" do
  include_context "anki package helpers"

  let(:new_anki_package_name) { "new_anki_package_file_name" }

  context "with default parameters" do
    before { anki_package.zip }

    it "deletes the temporary directory" do
      expect_the_temporary_directory_to_not_exist
    end

    it "saves one *.apkg file where * is the name argument" do
      expect(Dir.entries(".").include?("#{new_anki_package_name}.apkg")).to be true
    end
  end
end
```

In the case of the Rails app, following Rails conventions it looks somewhat different:

```ruby
# spec/requests/articles/create_spec.rb
# frozen_string_literal: true

RSpec.describe "Articles" do
  let(:user) { create(:user) }
  let(:article) { create(:article) }

  describe "POST /users/:uuid/articles/new" do
    context "when user is logged in" do
      before do
        post login_path, params: { session: { email: user.email, password: TEST_USER_PASSWORD } }
      end

      it "creates a new article" do
        expect { post new_article_path(uuid: user.id) }.to change(Article, :count).by 1
      end
    end

    context "when not logged in" do
      it "does not create a new article" do
        expect { post new_article_path(uuid: user.id) }.not_to change(Article, :count)
      end
    end
  end
end
```

After getting some experience doing this (mostly from refactoring larger spec files), I really like this practice.

## The rspec-performance extension

I learned some stuff using this extension, such as to always use `tr` instead of `gsub` when possible for fast code reasons.

## RDoc/SDoc

I had lots of opportunities to write API documentation with RDoc (I switched to SDoc later but continued to use RDoc syntax):

```ruby
module ChecksumHelper
  ##
  # Returns the integer representation of the first 8
  # characters of the SHA-1 digest of the +sfld+ argument.
  def checksum(sfld)
    Digest::SHA1.hexdigest(sfld)[0...8].to_i(16).to_s
  end
end
```

I like documentation so this was just fun. The Rails-theme SDoc output is really nice: [Anki Record API documentation](https://kylerego.github.io/anki_record_docs).

## Linux

To have a server running the Anki Books application in production, I backed up everything on my old college computer and installed Ubuntu on it. This was my first time doing a Linux installation, although I have been using WSL2 every day for a couple years now. Some other stuff that was new to me was setting up the firewall, SSH service, Apache web server, DNS records, and digital certificate.

## Action Text and the Trix editor

I got to use the Action Text part of Rails which uses the Trix editor. This is the article editor of Anki Books. It was pretty easy to get it set up and everything working. It was a bit of work to add subheadings and syntax highlighting features.

## pg_dump

I started using the `pg_dump` Postgres command to make backups of the database.

## Tailwind

I got some experience using Tailwind in a Rails app, and did this thing where you can define new CSS classes out of the existing Tailwind classes:

```css
@layer components {
  .trix-content a {
    @apply text-blue-500;
  }

  .trix-content a:hover {
    @apply text-blue-600; 
  }
}
```

## HTML drag and drop API

I got some experience using the HTML drag and drop API for reordering the article's notes which also involved Stimulus. TODO: More notes on this, possibly after refactoring.
