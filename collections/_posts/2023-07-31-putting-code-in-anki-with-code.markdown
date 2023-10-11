---
layout: post
title: "Putting code into Anki with code"
date: 2023-07-31 15:00:00 -0500
categories: programming ruby anki
permalink: /putting-code-into-anki-with-code
emoji: 🤨
mathjax: false
---

I had an idea today while thinking about the difficulty of understanding a software system as it becomes larger and more complex. The idea was that it might be useful to put all the source code files of some software of interest into Anki to space out reading each file in random order over time. The goal would be to remember more of the system and find inconsistencies in style and conventions, places that could be refactored that wouldn't otherwise have been noticed, or potential new abstractions. To test this, I converted my Ruby on Rails side project into an Anki deck. Since I haven't done the part of this experiment where I repeatedly read the code in Anki with the spacing effect, I can't say whether this is a good idea or not yet.

Anyway, here is how to convert the content of a bunch of code files into an Anki deck using a Ruby script. This uses the Anki Record gem:

{% highlight ruby %}{% raw %}
# frozen_string_literal: true

require "anki_record"

AnkiRecord::AnkiPackage.create(name: "anki_books_source_code_deck") do |anki21_database|
  deck = AnkiRecord::Deck.new(name: "Anki Books source", anki21_database:)
  deck.save

  note_type = AnkiRecord::NoteType.new(name: "Code source type", anki21_database:)

  AnkiRecord::NoteField.new(name: "Code", note_type:)
  AnkiRecord::NoteField.new(name: "Notes", note_type:)

  card_template = AnkiRecord::CardTemplate.new(name: "Code and notes", note_type:)
  card_template.question_format = "{{Code}}"
  card_template.answer_format = "{{Code}}<hr id=answer>{{Notes}}"

  css = <<~CSS
    .card {
      font-family: monospace;
      font-size: 20px;
      text-align: left;
      color: black;
      background-color: white;
    }
  CSS
  note_type.css = css
  note_type.save

  Dir.glob("**/*") do |file|
    next unless file.end_with?(".rb") || file.end_with?(".js")
    next if file.include?("db/migrate")
    next if file.include?("public/assets")

    file = File.open(file)

    contents = file.read
    note_code_content = "#{file.path}<br><br><pre><code>#{contents}</code></pre>"

    note = AnkiRecord::Note.new(note_type:, deck:)
    note.code = note_code_content
    note.save

    file.close
  end
end
{% endraw %}{% endhighlight %}

Some of the naming here is because the Ruby on Rails app I did this to is called Anki Books. This creates an Anki package file anki_books_source_code_deck.apkg with notes of a custom note type with two fields (Code and Notes). I gave the note type some basic CSS to have the text be aligned left and monospace. The script also skips files where the extension is not .rb or .js and some others which I didn't think would be worth reading. The Code field for each note gets the file path and content of a file. The content of the file is contained in a HTML pre element to preserve the whitespaces and an HTML code element too.

I guess there were 181 files that met the criteria and were converted to Anki notes:

![Importing the notes into Anki](assets/putting-code-in-anki-with-code/source_code_in_anki0.png)

This is the first note:

![An example of one of the code notes](assets/putting-code-in-anki-with-code/source_code_in_anki1.png)

Here is part of a longer note:

![A second example](assets/putting-code-in-anki-with-code/source_code_in_anki2.png)

I can tell there are some issues with this first approach (like how to update the notes when the source changes). This should be fine for an initial experiment though. If this idea is a useful thing to do, I'll work out a better way. It may also be a good use case to help me figure out the direction for the Anki Record gem's API.

# 8/21/2023 Update

There have been some good things from trying this out. It motivated me to add some helpful methods to the Anki Record gem (resulting in version 0.4.1) and change the way that the notes table `mod` (last modified time) is handled to make it easier to update an existing Anki package in the correct way with the gem. I did realize at some point that since Anki can import simpler formats than .apkg files (like CSVs), you could probably import code into Anki in a more straightforward way than creating the SQLite databases with code. But obviously this is a little more fun.

The other benefit is that it gets looking at the code more into my usual routine. I have made several refactors after noticing or being reminded of areas that could be improved in the middle of doing Anki reviews. At times I felt silly reading the code in Anki when I was already working on it in a different area and doing Anki while running the automated tests. This is with not doing as much with Anki and these projects as I expected to anyway due to circumstances (randomly entering into .NET world), so the little benefits are a win in my opinion.

These are the scripts to create and update the Anki package in Anki Books, which now use the 0.4.1 version of Anki Record:

{% highlight ruby %}{% raw %}
# frozen_string_literal: true

# rubocop:disable Naming/ConstantName
Package_name = "anki_books_source_code_deck"
Deck_name = "Anki Books source"
Note_type_name = "Anki Books source type"
File_extensions_to_keep = [".rb", ".js"].freeze
Patterns_to_exclude_from = ["db/migrate", "public/assets"].freeze
# rubocop:enable Naming/ConstantName

def setup_note_type(anki21_database:)
  note_type = AnkiRecord::NoteType.new(name: Note_type_name, anki21_database:)

  AnkiRecord::NoteField.new(name: "Code", note_type:)
  AnkiRecord::NoteField.new(name: "File", note_type:)

  card_template = AnkiRecord::CardTemplate.new(name: "Template 1", note_type:)
  card_template.question_format = "{{Code}}"
  card_template.answer_format = "{{Code}}<hr id=answer>{{File}}"

  css = <<~CSS
    .card {
      font-family: monospace;
      font-size: 20px;
      text-align: left;
      color: black;
      background-color: white;
    }
  CSS
  note_type.css = css
  note_type.save
  note_type
end

def file_should_be_skipped?(file:)
  return true unless File_extensions_to_keep.any? { |ext| file.end_with?(ext) }

  return true if Patterns_to_exclude_from.any? { |pat| file.include?(pat) }

  false
end

{% endraw %}{% endhighlight %}

The `setup_note_type` method is pretty unnecessary since the note type already exists in the database after it's created, but since it is the same it does import into Anki as the same note type. That will probably go the next time I visit these.

{% highlight ruby %}{% raw %}
# frozen_string_literal: true

require "anki_record"
require_relative "source_deck_shared"

AnkiRecord::AnkiPackage.create(name: Package_name) do |anki21_database|
  deck = AnkiRecord::Deck.new(name: Deck_name, anki21_database:)
  deck.save

  note_type = setup_note_type(anki21_database:)

  Dir.glob("**/*") do |file|
    next if file_should_be_skipped?(file:)

    file = File.open(file)

    contents = file.read
    note_code_content = "<pre><code>#{contents}</code></pre>"

    note = AnkiRecord::Note.new(note_type:, deck:)
    note.file = file.path
    note.code = note_code_content
    note.save

    file.close
  end
end

{% endraw %}{% endhighlight %}

{% highlight ruby %}{% raw %}
# frozen_string_literal: true

require "anki_record"
require_relative "source_deck_shared"

AnkiRecord::AnkiPackage.update(path: "./#{Package_name}.apkg") do |anki21_database|
  deck = anki21_database.find_deck_by(name: Deck_name)
  note_type = setup_note_type(anki21_database:)

  Dir.glob("**/*") do |file|
    next if file_should_be_skipped?(file:)

    file = File.open(file)

    contents = file.read
    note_code_content = "<pre><code>#{contents}</code></pre>"
    file_path = file.path

    note = anki21_database.find_notes_by_exact_text_match(text: file_path).first
    note ||= AnkiRecord::Note.new(note_type:, deck:)
    note.file = file_path
    note.code = note_code_content
    note.save

    file.close
  end
end

{% endraw %}{% endhighlight %}

# 10/11/2023 Update

I have been pretty inconsistently studying the code cards and adding at most 1 per day for some time now. It is definitely somewhat useful but what I found is it is not an easy habit to keep up. I think the returns on the investment would be better if I limited the code to study to be much more specific to design needs. With such a large number of code notes, the previous approach would never work for doing this with multiple code bases as the same time. It is also inconvenient to keep the cards updated as the code changes with the current gem API. For now I am stopping this but I think the next iteration will be to limit the cards created to a small number of files that are important and maybe set up a Git hook to update the deck at commit time. Before that it may be good to do some refactoring of Anki Record and extending the API.
