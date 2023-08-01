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
