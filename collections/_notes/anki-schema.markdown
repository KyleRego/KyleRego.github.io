---
layout: post
title: "Anki schema notes"
categories: programming sql sqlite anki
permalink: /anki-schema
emoji: 😋
mathjax: false
---

These are my notes on the Anki database schema and data. They probably will continue to change over time and may include a lot more detail on some parts than others. This was mostly part of my initial work developing the [Anki Record](https://github.com/KyleRego/anki_record) gem.

Related:
- [AnkiDroid document on the Anki schema](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure)
- [Comments on the Anki database](https://www.natemeyvis.com/on-ankis-database.html)

If you're interested in these notes, it may be a good idea to begin with the appendix at the end, which explains using `sqlite3` to inspect SQLite databases.

# Introduction

Unzipping the `*.apkg` file (`unzip 日本語.apkg` with Linux) created by exporting an Anki deck creates at least three files:
- `collection.anki2`
- `collection.anki21`
- `media`

The following notes are based on inspection of the data in `collection.anki21.` This is probably the right database to look at for newer versions of Anki. I have noticed that if the include scheduling information checkbox is not checked when exporting a deck from my version (2.1.54), then the zip file only has `collection.anki2` and `media`.

I recently removed most of my ~50,000+ Anki cards. I just backed them up in the cloud because it was causing Anki to take a few seconds to open and close and they were mostly about medicine and anatomy which I don't care about anymore (bye bye "In addition to the \{\{c4::VL::a thalamic nucleus\}\}, the \{\{c1::interposed nuclei::deep cerebellar nuclei\}\} also project to the \{\{c3::magnocellular division::red nucleus division\}\} to influence the \{\{c2::rubrospinal tract::a tract\}\}.").

With a relatively clean Anki slate, I backed up the few Anki notes I still had, deleted them, and added just a few notes to export to look at the data with the schema:

![The exported Anki decks](/assets/anki-schema/anki-schema-screenshot-1.png)

I then deleted the last deck, suspended some cards, flagged some cards, completed some reviews, and buried a card before exporting the deck:

{% highlight console %}{% raw %}
 $ unzip 日本語.apkg
Archive:  日本語.apkg
  inflating: collection.anki2
  inflating: collection.anki21
 extracting: 0
  inflating: media
{% endraw %}{% endhighlight %}

If you want to look at the same database: [download 日本語.apkg](/assets/anki-schema/日本語.apkg).

The following shows the 9 cards that were exported here. There are six cards from two "Kanji Vocabulary Type" notes, one card from one "Basic" note, and two cards from one "Cloze" note. The Kanji Vocabulary Type has three fields: "Meaning," "Kanji," and "Hiragana." Some of the cards were flagged or suspended, and one is also buried.

![The single Basic note in Test deck 1](/assets/anki-schema/anki-schema-screenshot-2.png)

The Kanji Vocabulary Type has three custom card types.

![The card types editor of the Kanji Vocabulary Type](/assets/anki-schema/anki-schema-screenshot-3.png)

Note that I have sometimes edited the output of the `sqlite3` program below to make it easier to look at (mostly removing extra whitespace).

## The not yet unzipped database

If you look at the `*.apkg` file exported from Anki with `sqlite3` without unzipping it first, you will see this:

{% highlight sql %}
sqlite> select * from sqlite_master;
type   name  tbl_name  rootpage  sql
-----  ----  --------  --------  --------------------------------------------------
table  zip   zip       0         CREATE VIRTUAL TABLE zip USING zipfile('日本語.apkg')

sqlite> select name from zip;
name
-----------------
collection.anki2
collection.anki21
0
media
{% endhighlight %}

# The collection.anki21 SQLite database

Inspection of `sqlite_master` shows there is a `col` table, a `notes` table, a `cards` table, a `revlog` table, and a `graves` table.

There are also two tables called `sqlite_stat1` and `sqlite_stat4` and 7 indexes.

The indexes are data structures in the database which allow the database engine to execute certain queries, usually the most common ones, more efficiently. They are similar to the index of a textbook which allows quick lookup of the pages that mention specific keywords or the index of websites that Google maintains that it uses to serve results quickly.

I would guess that `sqlite_stat1` and `sqlite_stat4` are tables used by SQLite.

{% highlight console %}
sqlite> .mode box
sqlite> select name, type from sqlite_master;
┌────────────────┬───────┐
│      name      │ type  │
├────────────────┼───────┤
│ col            │ table │
│ notes          │ table │
│ cards          │ table │
│ revlog         │ table │
│ ix_notes_usn   │ index │
│ ix_cards_usn   │ index │
│ ix_revlog_usn  │ index │
│ ix_cards_nid   │ index │
│ ix_cards_sched │ index │
│ ix_revlog_cid  │ index │
│ ix_notes_csum  │ index │
│ sqlite_stat1   │ table │
│ sqlite_stat4   │ table │
│ graves         │ table │
└────────────────┴───────┘
{% endhighlight %}

## The col table

{% highlight sql %}
sqlite> .mode column
sqlite> .headers on
sqlite> select sql from sqlite_master where name = "col";
sql
-------------------------
CREATE TABLE col (
  id integer PRIMARY KEY,
  crt integer NOT NULL,
  mod integer NOT NULL,
  scm integer NOT NULL,
  ver integer NOT NULL,
  dty integer NOT NULL,
  usn integer NOT NULL,
  ls integer NOT NULL,
  conf text NOT NULL,
  models text NOT NULL,
  decks text NOT NULL,
  dconf text NOT NULL,
  tags text NOT NULL
)
sqlite> select count(*) from col;
count(*)
--------
1
{% endhighlight %}

This table has only one record.

### The id, crt, mod, scm, ver, dty, usn, and ls columns

{% highlight sql %}
sqlite> select id, crt, mod, scm, ver, dty, usn, ls from col;
id  crt         mod            scm            ver  dty  usn  ls
--  ----------  -------------  -------------  ---  ---  ---  --
1   1490252400  1675291807673  1675291807665  11   0    0    0
{% endhighlight %}

### The conf column

This column has a JSON value:

{% highlight json %}
{
  "collapseTime":1200,
  "curDeck":1,
  "curModel":1674448040667,
  "creationOffset":300,
  "activeDecks":[1],
  "nextPos":1,
  "estTimes":true,
  "sortBackwards":false,
  "schedVer":2,
  "sortType":"noteFld",
  "timeLim":0,
  "dueCounts":true,
  "newSpread":0,
  "dayLearnFirst":false,
  "addToCur":true
}
{% endhighlight %}

### The models column

This column also has a JSON value. It is easier to look at as a Ruby hash using the following script:

{% highlight ruby %}
require 'sqlite3'
require 'json'

db = SQLite3::Database.new "collection.anki21"
db.results_as_hash = true

rows = db.execute "select models from col;"

rows.each do |row|
  x = JSON.parse(row['models'])
  pp x
end

{% endhighlight %}

If you want to adapt this script for your own purposes, you will need to install Ruby and the `sqlite3` gem. The following is the output in this case:

{% highlight ruby %}{% raw %}
{"1609035088779"=>
  {"id"=>1609035088779,
   "name"=>"Cloze",
   "type"=>1,
   "mod"=>1672496800,
   "usn"=>0,
   "sortf"=>0,
   "did"=>1672496800746,
   "tmpls"=>
    [{"name"=>"Cloze",
      "ord"=>0,
      "qfmt"=>"{{cloze:Text}}",
      "afmt"=>"{{cloze:Text}}<br>\n" + "{{Extra}}",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0}],
   "flds"=>
    [{"name"=>"Text",
      "ord"=>0,
      "sticky"=>true,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>""},
     {"name"=>"Extra",
      "ord"=>1,
      "sticky"=>true,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>""}],
   "css"=>
    ".card {\n" +
    "  font-family: arial;\n" +
    "  font-size: 20px;\n" +
    "  text-align: center;\n" +
    "  color: black;\n" +
    "  background-color: white;\n" +
    "}\n" +
    "\n" +
    ".cloze {\n" +
    " font-weight: bold;\n" +
    " color: blue;\n" +
    "}\n" +
    ".nightMode .cloze {\n" +
    " color: lightblue;\n" +
    "}\n",
   "latexPre"=>
    "\\documentclass[12pt]{article}\n" +
    "\\special{papersize=3in,5in}\n" +
    "\\usepackage[utf8]{inputenc}\n" +
    "\\usepackage{amssymb,amsmath}\n" +
    "\\pagestyle{empty}\n" +
    "\\setlength{\\parindent}{0in}\n" +
    "\\begin{document}\n",
   "latexPost"=>"\\end{document}",
   "latexsvg"=>false,
   "req"=>[[0, "any", [0]]],
   "tags"=>[]},
 "1674448040667"=>
  {"id"=>1674448040667,
   "name"=>"Kanji Vocabulary Type",
   "type"=>0,
   "mod"=>1675271389,
   "usn"=>0,
   "sortf"=>0,
   "did"=>1620832072954,
   "tmpls"=>
    [{"name"=>"Card 1",
      "ord"=>0,
      "qfmt"=>"{{Kanji}} / {{Meaning}}<br>What is the pronunciation?",
      "afmt"=>
       "{{FrontSide}}\n" +
       "\n" +
       "<hr id=answer>\n" +
       "\n" +
       "<span style=\"font-size: 64px\">{{Hiragana}}</span>\n" +
       "<br>\n",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0},
     {"name"=>"Card 2",
      "ord"=>1,
      "qfmt"=>
       "<span style=\"font-size: 24px\">{{Hiragana}}</span>\n" +
       "<br>\n" +
       "<span style=\"font-size:64px\">{{Kanji}}</span>\n" +
       "<br>What is the meaning in English?",
      "afmt"=>
       "{{FrontSide}}\n" +
       "\n" +
       "<hr id=answer>\n" +
       "\n" +
       "{{Meaning}}\n" +
       "<br>\n",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0},
     {"name"=>"Card 3",
      "ord"=>2,
      "qfmt"=>
       "{{Hiragana}} / {{Meaning}}\n" +
       "<br>\n" +
       "What is the Japanese word?",
      "afmt"=>
       "{{FrontSide}}\n" +
       "\n" +
       "<hr id=answer>\n" +
       "\n" +
       "<span style=\"font-size: 64px\">{{Kanji}}</span>",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0}],
   "flds"=>
    [{"name"=>"Meaning",
      "ord"=>0,
      "sticky"=>false,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>""},
     {"name"=>"Kanji",
      "ord"=>1,
      "sticky"=>false,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>"",
      "media"=>[]},
     {"name"=>"Hiragana",
      "ord"=>2,
      "sticky"=>false,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>"",
      "media"=>[]}],
   "css"=>
    ".card {\n" +
    " font-family: arial;\n" +
    " font-size: 40px;\n" +
    " text-align: center;\n" +
    " color: black;\n" +
    " background-color: transparent;\n" +
    "}",
   "latexPre"=>
    "\\documentclass[12pt]{article}\n" +
    "\\special{papersize=3in,5in}\n" +
    "\\usepackage[utf8]{inputenc}\n" +
    "\\usepackage{amssymb,amsmath}\n" +
    "\\pagestyle{empty}\n" +
    "\\setlength{\\parindent}{0in}\n" +
    "\\begin{document}\n",
   "latexPost"=>"\\end{document}",
   "latexsvg"=>false,
   "req"=>[[0, "any", [0, 1]], [1, "any", [1, 2]], [2, "any", [0, 2]]],
   "tags"=>["japanese"],
   "vers"=>[]},
 "1675291807665"=>
  {"id"=>1675291807665,
   "name"=>"Basic",
   "type"=>0,
   "mod"=>0,
   "usn"=>0,
   "sortf"=>0,
   "did"=>nil,
   "tmpls"=>
    [{"name"=>"Card 1",
      "ord"=>0,
      "qfmt"=>"{{Front}}",
      "afmt"=>
       "{{FrontSide}}\n" + "\n" + "<hr id=answer>\n" + "\n" + "{{Back}}",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0}],
   "flds"=>
    [{"name"=>"Front",
      "ord"=>0,
      "sticky"=>false,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>""},
     {"name"=>"Back",
      "ord"=>1,
      "sticky"=>false,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>""}],
   "css"=>
    ".card {\n" +
    "    font-family: arial;\n" +
    "    font-size: 20px;\n" +
    "    text-align: center;\n" +
    "    color: black;\n" +
    "    background-color: white;\n" +
    "}\n",
   "latexPre"=>
    "\\documentclass[12pt]{article}\n" +
    "\\special{papersize=3in,5in}\n" +
    "\\usepackage[utf8]{inputenc}\n" +
    "\\usepackage{amssymb,amsmath}\n" +
    "\\pagestyle{empty}\n" +
    "\\setlength{\\parindent}{0in}\n" +
    "\\begin{document}\n",
   "latexPost"=>"\\end{document}",
   "latexsvg"=>false,
   "req"=>[[0, "any", [0]]]},
 "1599087650848"=>
  {"id"=>1599087650848,
   "name"=>"Basic-2c217",
   "type"=>0,
   "mod"=>1675290600,
   "usn"=>5916,
   "sortf"=>0,
   "did"=>1669860259784,
   "tmpls"=>
    [{"name"=>"Card 1",
      "ord"=>0,
      "qfmt"=>"{{Front}}",
      "afmt"=>
       "{{FrontSide}}\n" +
       "\n" +
       "<hr id=answer>\n" +
       "\n" +
       "{{Back}}\n" +
       "\n" +
       "<div style='font-family: Arial; font-size: 20px;'></div>\n" +
       "\n" +
       "\n" +
       "<div style='font-family: Arial; font-size: 20px;'></div>\n",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0}],
   "flds"=>
    [{"name"=>"Front",
      "ord"=>0,
      "sticky"=>true,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>"",
      "media"=>[]},
     {"name"=>"Back",
      "ord"=>1,
      "sticky"=>true,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>"",
      "media"=>[]}],
   "css"=>
    ".card {\n" +
    " font-family: arial;\n" +
    " font-size: 20px;\n" +
    " text-align: center;\n" +
    " color: black;\n" +
    " background-color: a;\n" +
    "}\n" +
    "table {\n" +
    "margin:auto;\n" +
    "}",
   "latexPre"=>
    "\\documentclass[12pt]{article}\n" +
    "\\special{papersize=3in,5in}\n" +
    "\\usepackage[utf8]{inputenc}\n" +
    "\\usepackage{amssymb,amsmath}\n" +
    "\\pagestyle{empty}\n" +
    "\\setlength{\\parindent}{0in}\n" +
    "\\begin{document}\n",
   "latexPost"=>"\\end{document}",
   "latexsvg"=>false,
   "req"=>[[0, "any", [0]]],
   "tags"=>["linux-command-line"],
   "vers"=>[]}}
{% endraw %}{% endhighlight %}

This has a lot of information about the note types, including the fields, HTML card templates, CSS, and LaTeX. If you're not familiar with HTML and CSS, the best resource to read is the [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/HTML).

It appears when exporting a note type like "Basic," it exports it with a name that has some kind of randomly generated string appended to it and separated by a dash. There is also a tag "linux-command-line" that I'm not sure where it came from. I think I did have that tag on some cards before, but I deleted those cards and can't see that tag anywhere anymore.

To take a closer look at one of the hashes representing a note type in the models:

{% highlight ruby %}{% raw %}

{"id"=>1674448040667, # the id of this note type; 
                      # also appears to be the key in the hash where this object is the value
   "name"=>"Kanji Vocabulary Type", # the name of the note type
   "type"=>0, # from the Cloze note type above, this looks to be 1 for cloze deletion note types
              # for non-cloze note types like this one, it is 0 instead
   "mod"=>1675271389, # the last time that the note type was modified, in seconds since the epoch 
   "usn"=>0, # update sequence number; indicates if version on client or server is newer
             # see AnkiDroid document for more info on usn
   "sortf"=>0, # specify field used by browser to sort notes
   "did"=>1620832072954, # deck id or default deck that notes of this type are added to?
   "tmpls"=> [{}, {}, {}], # array of hashes representing the templates
   "flds"=> [{} {} {}], # array of hashes representing the fields
   "css"=>
    ".card {\n" + # note the escape character (\) in control characters (e.g. \\, \n, and \")
    " font-family: arial;\n" +
    " font-size: 40px;\n" +
    " text-align: center;\n" +
    " color: black;\n" +
    " background-color: transparent;\n" +
    "}", # CSS styling; refer to MDN if you need help with CSS
   "latexPre"=> # LaTeX preamble
    "\\documentclass[12pt]{article}\n" +
    "\\special{papersize=3in,5in}\n" +
    "\\usepackage[utf8]{inputenc}\n" +
    "\\usepackage{amssymb,amsmath}\n" +
    "\\pagestyle{empty}\n" +
    "\\setlength{\\parindent}{0in}\n" +
    "\\begin{document}\n",
   "latexPost"=>"\\end{document}", # LaTeX postamble
   "latexsvg"=>false, # "create scalable images with dvisvgm" option
                      # the LaTeX values can be edited from "Options" in "Manage Note Types"
   "req"=>[[0, "any", [0, 1]], [1, "any", [1, 2]], [2, "any", [0, 2]]],
      # looks to be related to the card types
      # (what fields must be present for the card type to be used by the note)
      # deprecated?
   "tags"=>["japanese"], # note types can have tags?
   "vers"=>[]}
{% endraw %}{% endhighlight %}

Where the following is the value of `tmpls` from the above, which is the note type's card types:

{% highlight ruby %}{% raw %}

[{"name"=>"Card 1", # name of the card type
  "ord"=>0, # related to the order of the card types
            # 0 for the first card type, 1 for the second, etc.
  "qfmt"=>"{{Kanji}} / {{Meaning}}<br>What is the pronunciation?",
    # the HTML of the front side of the card (question format?) with templating
    # e.g. {{Kanji}} represents the value of the Kanji field of the note.
    # the values in the fields can inject additional HTML into the markup
  "afmt"=>
    "{{FrontSide}}\n" +
    "\n" +
    "<hr id=answer>\n" +
    "\n" + # refer to MDN for help with HTML
    "<span style=\"font-size: 64px\">{{Hiragana}}</span>\n" +
    "<br>\n", # the HTML of the back side of the card (answer format?)
  "bqfmt"=>"",
    # related to how the browser displays the question?
  "bafmt"=>"",
    # related to how the browser displays the answer?
  "did"=>nil, # deck id of the card type?
              # if its nil in Ruby, then its NULL in the database
  "bfont"=>"",
    # font style used by browser when showing this card type?
  "bsize"=>0},
    # font size used by browser when showing this card type?
    # 0 is probably not the font size it's actually using
  {"name"=>"Card 2",
  "ord"=>1,
  "qfmt"=>
    "<span style=\"font-size: 24px\">{{Hiragana}}</span>\n" +
    "<br>\n" +
    "<span style=\"font-size:64px\">{{Kanji}}</span>\n" +
    "<br>What is the meaning in English?",
  "afmt"=>
    "{{FrontSide}}\n" +
    "\n" +
    "<hr id=answer>\n" +
    "\n" +
    "{{Meaning}}\n" +
    "<br>\n",
  "bqfmt"=>"",
  "bafmt"=>"",
  "did"=>nil,
  "bfont"=>"",
  "bsize"=>0},
  {"name"=>"Card 3",
  "ord"=>2,
  "qfmt"=>
    "{{Hiragana}} / {{Meaning}}\n" +
    "<br>\n" +
    "What is the Japanese word?",
  "afmt"=>
    "{{FrontSide}}\n" +
    "\n" +
    "<hr id=answer>\n" +
    "\n" +
    "<span style=\"font-size: 64px\">{{Kanji}}</span>",
  "bqfmt"=>"",
  "bafmt"=>"",
  "did"=>nil,
  "bfont"=>"",
  "bsize"=>0}]
{% endraw %}{% endhighlight %}

And this is the real `flds` which are the fields of the note type:

{% highlight ruby %}{% raw %}

[{"name"=>"Meaning", # name of the field
  "ord"=>0, # related to the order of the fields
  "sticky"=>false, # when adding a note, does this field keep its value afterwards
  "rtl"=>false, # right to left, for certain languages written right to left?
  "font"=>"Arial", # font style for the editing font
  "size"=>20, # size for the editing font
  "description"=>""}, # default value when the field is empty
  {"name"=>"Kanji",
  "ord"=>1,
  "sticky"=>false,
  "rtl"=>false,
  "font"=>"Arial",
  "size"=>20,
  "description"=>"",
  "media"=>[]}, # media used by the field? Not always present apparently
  {"name"=>"Hiragana",
  "ord"=>2,
  "sticky"=>false,
  "rtl"=>false,
  "font"=>"Arial",
  "size"=>20,
  "description"=>"",
  "media"=>[]}]
{% endraw %}{% endhighlight %}

### The models tags and vers values

I noticed something about some of the default note types. I wrote this script to look at an exported deck with all 5 default note types and 2 related copies:

{% highlight ruby %}
# frozen_string_literal: true

# rubocop:disable Metrics/MethodLength
# rubocop:disable Metrics/AbcSize

require "sqlite3"
require "json"
require "zip"

def output_apkg_info(file_path)
  puts file_path
  Zip::File.open(file_path) do |zip_file|
    zip_file.each do |entry|
      next unless entry.name == "collection.anki21"

      entry.extract
      anki_21_database = SQLite3::Database.open "collection.anki21"

      col_record = anki_21_database.execute("select * from col").first
      # decks = col_record[8]
      # puts "decks:"
      # p JSON.parse decks
      # 2.times { puts }

      note_types = col_record[9]
      puts "note types:"
      JSON.parse(note_types).each do |nt|
        p nt
        2.times { puts }
      end

      # notes_data = anki_21_database.execute "select * from notes"
      # puts "notes_data:"
      # notes_data.each { |nd| p nd }
      # 2.times { puts }

      # cards_data = anki_21_database.execute "select * from cards"
      # puts "cards_data:"
      # cards_data.each { |cd| p cd }
      # 2.times { puts }
    end
  end
ensure
  File.delete("collection.anki21")
end

ARGV.each { |file_path| output_apkg_info(file_path) }

# rubocop:enable Metrics/MethodLength
# rubocop:enable Metrics/AbcSize

{% endhighlight %}

The output:

{% highlight console %}{% raw %}
 $ ruby bin/debug.rb test.apkg
test.apkg
note types:
["1676902364661", {"id"=>1676902364661, "name"=>"Basic-bdee9", "type"=>0, "mod"=>0, "usn"=>6014, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Card 1", "ord"=>0, "qfmt"=>"{{Front}}", "afmt"=>"{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Front", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0]]], "tags"=>nil, "vers"=>nil}]


["1679759032765", {"id"=>1679759032765, "name"=>"Basic (type in the answer)", "type"=>0, "mod"=>1679759032, "usn"=>-1, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Card 1", "ord"=>0, "qfmt"=>"{{Front}}\n\n{{type:Back}}", "afmt"=>"{{Front}}\n\n<hr id=answer>\n\n{{type:Back}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Front", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0, 1]]]}]


["1676902364665", {"id"=>1676902364665, "name"=>"Cloze", "type"=>1, "mod"=>0, "usn"=>6014, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Cloze", "ord"=>0, "qfmt"=>"{{cloze:Text}}", "afmt"=>"{{cloze:Text}}<br>\n{{Back Extra}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Text", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back Extra", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n.cloze {\n    font-weight: bold;\n    color: blue;\n}\n.nightMode .cloze {\n    color: lightblue;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0]]], "vers"=>nil, "tags"=>nil}]


["1679759046027", {"id"=>1679759046027, "name"=>"Cloze-7f749", "type"=>1, "mod"=>1679759046, "usn"=>-1, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Cloze", "ord"=>0, "qfmt"=>"{{cloze:Text}}", "afmt"=>"{{cloze:Text}}<br>\n{{Back Extra}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Text", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back Extra", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n.cloze {\n    font-weight: bold;\n    color: blue;\n}\n.nightMode .cloze {\n    color: lightblue;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0]]]}]


["1679759129726", {"id"=>1679759129726, "name"=>"Basic", "type"=>0, "mod"=>0, "usn"=>0, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Card 1", "ord"=>0, "qfmt"=>"{{Front}}", "afmt"=>"{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Front", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0]]]}]


["1679759036917", {"id"=>1679759036917, "name"=>"Basic (and reversed card)", "type"=>0, "mod"=>1679759036, "usn"=>-1, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Card 1", "ord"=>0, "qfmt"=>"{{Front}}", "afmt"=>"{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}, {"name"=>"Card 2", "ord"=>1, "qfmt"=>"{{Back}}", "afmt"=>"{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Front", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0]], [1, "any", [1]]]}]


["1679759041155", {"id"=>1679759041155, "name"=>"Basic (optional reversed card)", "type"=>0, "mod"=>1679759041, "usn"=>-1, "sortf"=>0, "did"=>nil, "tmpls"=>[{"name"=>"Card 1", "ord"=>0, "qfmt"=>"{{Front}}", "afmt"=>"{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}, {"name"=>"Card 2", "ord"=>1, "qfmt"=>"{{#Add Reverse}}{{Back}}{{/Add Reverse}}", "afmt"=>"{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}", "bqfmt"=>"", "bafmt"=>"", "did"=>nil, "bfont"=>"", "bsize"=>0}], "flds"=>[{"name"=>"Front", "ord"=>0, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Back", "ord"=>1, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}, {"name"=>"Add Reverse", "ord"=>2, "sticky"=>false, "rtl"=>false, "font"=>"Arial", "size"=>20, "description"=>""}], "css"=>".card {\n    font-family: arial;\n    font-size: 20px;\n    text-align: center;\n    color: black;\n    background-color: white;\n}\n", "latexPre"=>"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n", "latexPost"=>"\\end{document}", "latexsvg"=>false, "req"=>[[0, "any", [0]], [1, "all", [1, 2]]]}]
{% endraw %}{% endhighlight %}

The thing that I noticed is that the default note types with "Basic" in the name do not have `vers` and `tags` keys in their JSON objects. But the "Basic-bdee9" note type, apparently a different version of the default Basic note type that was imported, does have these.

### The decks column

This column also has a JSON value that is easier to see as a Ruby hash:

{% highlight ruby %}
{"1"=>
  {"id"=>1, # the default deck has an id of 1
   "mod"=>0, 
   "name"=>"Default",
   "usn"=>0,
   "lrnToday"=>[0, 0],
   "revToday"=>[0, 0],
   "newToday"=>[0, 0],
   "timeToday"=>[0, 0],
   "collapsed"=>true,
   "browserCollapsed"=>true,
   "desc"=>"",
   "dyn"=>0,
   "conf"=>1,
   "extendNew"=>0,
   "extendRev"=>0},
 "1675271334388"=>
  {"id"=>1675271334388, # non-default deck ids are milliseconds since the epoch
   "mod"=>1675291140, # last time modified in seconds since the epoch
   "name"=>"日本語", # name of the deck
   "usn"=>-1, # update sequence number
   "lrnToday"=>[2141, 0], # see AnkiDroid document
   "revToday"=>[2141, 0],
   "newToday"=>[2141, 3],
   "timeToday"=>[2141, 15391],
   "collapsed"=>false, # whether deck is collapsed in main window
   "browserCollapsed"=>false, # whether deck is collapsed in browser
   "desc"=>"", # description
   "dyn"=>0, # 0 if not a filtered deck, 1 if a filtered deck
   "conf"=>1, # id of object in dconf (deck configurations or options)
   "extendNew"=>0, # related to custom study?
   "extendRev"=>0}, # related to custom study?
 "1675271788510"=>
  {"id"=>1675271788510,
   "mod"=>1675271788,
   "name"=>"日本語::Subdeck - Basic with image", # Parent::Child syntax indicates a child deck
   "usn"=>0,
   "lrnToday"=>[0, 0], # for a brand new deck not studied, these seem to be [0, 0]
   "revToday"=>[0, 0],
   "newToday"=>[0, 0],
   "timeToday"=>[0, 0],
   "collapsed"=>true,
   "browserCollapsed"=>true,
   "desc"=>"",
   "dyn"=>0,
   "conf"=>1,
   "extendNew"=>0,
   "extendRev"=>0},
 "1675272197249"=>
  {"id"=>1675272197249,
   "mod"=>1675272197,
   "name"=>"日本語::Subdeck - Cloze deletion note with 2 cards",
   "usn"=>0,
   "lrnToday"=>[0, 0],
   "revToday"=>[0, 0],
   "newToday"=>[0, 0],
   "timeToday"=>[0, 0],
   "collapsed"=>true,
   "browserCollapsed"=>true,
   "desc"=>"",
   "dyn"=>0,
   "conf"=>1,
   "extendNew"=>0,
   "extendRev"=>0},
 "1675271672564"=>
  {"id"=>1675271672564,
   "mod"=>1675291140,
   "name"=>"日本語::Subdeck",
   "usn"=>-1,
   "lrnToday"=>[2141, 0],
   "revToday"=>[2141, 0],
   "newToday"=>[2141, 3],
   "timeToday"=>[2141, 15391],
   "collapsed"=>true,
   "browserCollapsed"=>true,
   "desc"=>"",
   "dyn"=>0,
   "conf"=>1,
   "extendNew"=>0,
   "extendRev"=>0}}
{% endhighlight %}

This just shows the decks. It includes the Default deck as well.

### The dconf column

This column also has a JSON value:

{% highlight json %}
{"1":
  {"id":1,
   "mod":0,
   "name":"Default",
   "usn":0,
   "maxTaken":60,
   "autoplay":true,
   "timer":0,
   "replayq":true,
   "new":{"bury":false,"delays":[1.0,10.0],"initialFactor":2500,"ints":[1,4,0],"order":1,"perDay":20},
   "rev":{"bury":false,"ease4":1.3,"ivlFct":1.0,"maxIvl":36500,"perDay":200,"hardFactor":1.2},
   "lapse":{"delays":[10.0],"leechAction":1,"leechFails":8,"minInt":1,"mult":0.0},
   "dyn":false,
   "newMix":0,
   "newPerDayMinimum":0,
   "interdayLearningMix":0,
   "reviewOrder":0,
   "newSortOrder":0,
   "newGatherPriority":0,
   "buryInterdayLearning":false
  }
}
{% endhighlight %}

This is the default preset deck options being applied to the all of the decks that were exported.

### The tags column

In this case, this column had no tags:

{% highlight console %}
sqlite> select tags from col;
tags
----
{}
{% endhighlight %}

I'm not sure what the tags associated with this table would be.

## The notes table

This table is expected to have the notes data. In Anki, you create notes and study cards. Creating a note creates one or more cards to study according to the note type.

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "notes";
sql
---------------------------------------------------------------------------
CREATE TABLE notes (
  id integer PRIMARY KEY,
  guid text NOT NULL,
  mid integer NOT NULL,
  mod integer NOT NULL,
  usn integer NOT NULL,
  tags text NOT NULL,
  flds text NOT NULL,
  -- The use of type integer for sfld is deliberate, because it means that integer values in this
  -- field will sort numerically.
  sfld integer NOT NULL,
  csum integer NOT NULL,
  flags integer NOT NULL,
  data text NOT NULL
)
{% endhighlight %}

This includes a comment about the `sfld` (sort field) column deliberately using the integer type.

### The id, guid, mid, mod, and usn columns

{% highlight console %}
sqlite> select id, guid, mid, mod, usn from notes;
id             guid        mid            mod         usn
-------------  ----------  -------------  ----------  ---
1675271374293  b[g(Tp;Zft  1674448040667  1675272751  0
1675271765163  QQeo7%ZHUr  1674448040667  1675272759  0
1675272161760  KNe6~TLgV%  1599087650848  1675272161  0
1675272639780  uR1~pS:od3  1609035088779  1675272639  0
{% endhighlight %}

- id
  - The primary key id of the note record
  - It is the number of milliseconds since the 1970 epoch at the time the note was created
  - It does not seem to be involved in matching a note being imported to a note that already exists.
- guid
  - A globally unique id
  - After doing some experiments, I am sure that the guid is used in matching a note being imported to a note that already exists.
- mid
  - The id of the note's model (note type)
- mod
  - It is also an integer time since the 1970 epoch, but seconds instead of milliseconds
- usn

### The tags column

This shows the tags of the notes:

{% highlight sql %}
sqlite> select id, tags from notes;
id             tags
-------------  -----------------------------------------
1675271374293   japanese::animals
1675271765163   kanji
1675272161760   broken tree
1675272639780   entropy physics physics::thermodynamics
{% endhighlight %}

Here we can see that the single test note has three tags and the rest have no tags. The tags are a string of the tag names separated by spaces.

### The flds column

{% highlight console %}{% raw %}
sqlite> select flds from notes;
flds
------------------------------------------------------------------------------------------------------------------------------------------
cat<span style="font-size: 32px; color: white; background-color: green; padding: 0.5rem; width: min-content; border: 2.5px solid black;">
  猫
</span>ねこ

forest森もり

How many calories are in one gram of alcohol?7<br>Unrelated picture:<br><img src="picture_of_broken_tree.jpg">

The second law of thermodynamics states that&nbsp;{{c1::entopy}} will always&nbsp;{{c2::increase::increase or decrease}}.Yep
{% endraw %}{% endhighlight %}

`flds` stores the values of the fields. The individual fields are separated from each other in the `flds` by one of the ASCII control codes, the unit separator (31 or `1F` in hexadecimal). It looks like this in the `sqlite3` interface:

![The unit separator character in the sqlite3 command line program](/assets/anki-schema/unit-separator-1.png)

This is how it looks in VS Code:

![The unit separator character in VS Code](/assets/anki-schema/unit-separator-2.png)

It can also be seen here that the fields can have HTML elements and inline CSS styling, which according to the CSS cascade specificity rules will override the CSS classes of the note type.

### The sfld column

{% highlight console %}{% raw %}
sqlite> select sfld from notes;
sfld
---------------------------------------------------------------------------------------------------------------
cat
forest
How many calories are in one gram of alcohol?
The second law of thermodynamics states that {{c1::entopy}} will always {{c2::increase::increase or decrease}}.
{% endraw %}{% endhighlight %}

This stores the specific field which is used for sorting the notes. This field is also used to compute a value that Anki uses to detect duplicates. This value is the decimal/integer value of the first 8 hexadecimal digits of the SHA1 hash of the sort field's content stripped of HTML, but possibly leaving HTML attribute values related to the media sources (see [`field_checksum`](https://github.com/ankitects/anki/blob/e5d5d1d4bdecfac326353d154c933e477c4e3eb8/pylib/anki/utils.py#LL155C10-L155C10)).

### The csum, flags, and data columns

{% highlight console %}
sqlite> select csum, flags, data from notes;
csum        flags  data
----------  -----  ----
2644024973  0
198023927   0
306960154   0
953426987   0
{% endhighlight %}

The `csum` is the checksum used to detect duplicates that is calculated from the `sfld` value.

## The cards table

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "cards";
sql
----------------------------
CREATE TABLE cards (
  id integer PRIMARY KEY,
  nid integer NOT NULL,
  did integer NOT NULL,
  ord integer NOT NULL,
  mod integer NOT NULL,
  usn integer NOT NULL,
  type integer NOT NULL,
  queue integer NOT NULL,
  due integer NOT NULL,
  ivl integer NOT NULL,
  factor integer NOT NULL,
  reps integer NOT NULL,
  lapses integer NOT NULL,
  left integer NOT NULL,
  odue integer NOT NULL,
  odid integer NOT NULL,
  flags integer NOT NULL,
  data text NOT NULL
)
{% endhighlight %}

### The id, nid, did, ord, and mod colums

{% highlight sql %}
sqlite> select id, nid, did, ord, mod from cards;
id             nid            did            ord  mod
-------------  -------------  -------------  ---  ----------
1675271374294  1675271374293  1675271334388  0    1675271374
1675271374295  1675271374293  1675271334388  1    1675271374
1675271374296  1675271374293  1675271334388  2    1675271374
1675271765163  1675271765163  1675271672564  0    1675291140
1675271765164  1675271765163  1675271672564  1    1675291129
1675271765165  1675271765163  1675271672564  2    1675291131
1675272161760  1675272161760  1675271788510  0    1675291149
1675272639780  1675272639780  1675272197249  0    1675272639
1675272639781  1675272639780  1675272197249  1    1675272772
{% endhighlight %}

- id
  - The primary key id of the card record
- nid
  - The id of the note that the card is created from
- did
  - The id of the deck that the card belongs to

All three of these ids are numbers of millisecond since the 1970 epoch.

- ord
  - e.g. a note that creates three cards will create three cards with `oid` 0, 1, and 2
- mod
  - The last time modified, in seconds since the 1970 epoch

### The usn, type, queue, and due columns

{% highlight sql %}
sqlite> select id, usn, type, queue, due from cards;
id             usn  type  queue  due
-------------  ---  ----  -----  ----------
1675271374294  0    0     0      0
1675271374295  0    0     0      0
1675271374296  0    0     0      0
1675271765163  -1   1     1      1675291839
1675271765164  -1   1     3      2142
1675271765165  -1   1     3      2142
1675272161760  -1   0     -3     2
1675272639780  0    0     0      3
1675272639781  0    0     -1     3
{% endhighlight %}

- usn
- type
  - see AnkiDroid document
- queue
  - see AnkiDroid document
- due
  - see AnkiDroid document

### The ivl, factor, reps, and lapses columns

{% highlight sql %}
sqlite> select id, ivl, factor, reps, lapses from cards;
id             ivl  factor  reps  lapses
-------------  ---  ------  ----  ------
1675271374294  0    0       0     0
1675271374295  0    0       0     0
1675271374296  0    0       0     0
1675271765163  0    0       6     0
1675271765164  0    0       1     0
1675271765165  0    0       1     0
1675272161760  0    0       0     0
1675272639780  0    0       0     0
1675272639781  0    0       0     0
{% endhighlight %}

- ivl
  - An interval related to the spaced repetition calculations
- factor
  - The ease factor
- reps
  - The number of times the card has been reviewed
- lapses
  - The number of times the card lapsed

### The left, odue, odid, flags, and data columns

{% highlight console %}{% raw %}
sqlite> select id, left, odue, odid, flags, data from cards;
id             left  odue  odid  flags  data
-------------  ----  ----  ----  -----  ----
1675271374294  0     0     0     0      {}
1675271374295  0     0     0     0      {}
1675271374296  0     0     0     0      {}
1675271765163  1002  0     0     0      {}
1675271765164  1002  0     0     0      {}
1675271765165  1001  0     0     0      {}
1675272161760  0     0     0     0      {}
1675272639780  0     0     0     0      {}
1675272639781  0     0     0     0      {}
{% endraw %}{% endhighlight %}

- left
  - See AnkiDroid document
- odue
  - The original due date of a card in a filtered deck
- odid
  - The original deck id of a card in a filtered deck
- flags
  - An integer which represents a flag color such as turquoise
  - I flagged a few cards before the export but don't see any non-zero values here.
- data

## The revlog table

`revlog` stores the data tracked around the reviews.

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "revlog";
sql
----------------------------
CREATE TABLE revlog (
  id integer PRIMARY KEY,
  cid integer NOT NULL,
  usn integer NOT NULL,
  ease integer NOT NULL,
  ivl integer NOT NULL,
  lastIvl integer NOT NULL,
  factor integer NOT NULL,
  time integer NOT NULL,
  type integer NOT NULL
)
{% endhighlight %}

### The id, cid, usn, ease, and ivl columns

{% highlight sql %}
sqlite> select id, cid, usn, ease, ivl from revlog;
id             cid            usn  ease  ivl
-------------  -------------  ---  ----  ------
1675291128174  1675271765163  -1   1     -600
1675291129770  1675271765164  -1   2     -43500
1675291131970  1675271765165  -1   3     -86400
1675291134733  1675271765163  -1   1     -600
1675291136859  1675271765163  -1   1     -600
1675291137954  1675271765163  -1   1     -600
1675291138992  1675271765163  -1   1     -600
1675291140586  1675271765163  -1   1     -600
{% endhighlight %}

- id
  - The primary key id of the review record
- cid
  - The id of the card that was reviewed
- usn
- ease
- ivl

### The lastIvl, factor, time, and type columns

{% highlight sql %}
sqlite> select id, lastIvl, factor, time, type from revlog;
id             lastIvl  factor  time  type
-------------  -------  ------  ----  ----
1675291128174  -600     0       3046  0
1675291129770  -600     0       1589  0
1675291131970  -600     0       2184  0
1675291134733  -600     0       2757  0
1675291136859  -600     0       2112  0
1675291137954  -600     0       1088  0
1675291138992  -600     0       1026  0
1675291140586  -600     0       1582  0
{% endhighlight %}

- lastIvl
- factor
- time
  - The time that the review took in milliseconds
- type

## The graves table

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "graves";
sql
------------------------
CREATE TABLE graves (
  usn integer NOT NULL,
  oid integer NOT NULL,
  type integer NOT NULL
)
{% endhighlight %}

The graves table contains references to things that have been deleted locally so that the sync can delete them remotely. `select * from graves;` did not return any rows so I guess it is not really used in the deck export.

# The collection.anki2 SQLite database

Inspecting this SQLite database exported from my version of Anki (2.1.54) is not very interesting.

{% highlight sql %}
sqlite> select name, sql from sqlite_master;
col|CREATE TABLE col (
  id integer PRIMARY KEY,
  crt integer NOT NULL,
  mod integer NOT NULL,
  scm integer NOT NULL,
  ver integer NOT NULL,
  dty integer NOT NULL,
  usn integer NOT NULL,
  ls integer NOT NULL,
  conf text NOT NULL,
  models text NOT NULL,
  decks text NOT NULL,
  dconf text NOT NULL,
  tags text NOT NULL
)
notes|CREATE TABLE notes (
  id integer PRIMARY KEY,
  guid text NOT NULL,
  mid integer NOT NULL,
  mod integer NOT NULL,
  usn integer NOT NULL,
  tags text NOT NULL,
  flds text NOT NULL,
  -- The use of type integer for sfld is deliberate, because it means that integer values in this
  -- field will sort numerically.
  sfld integer NOT NULL,
  csum integer NOT NULL,
  flags integer NOT NULL,
  data text NOT NULL
)
cards|CREATE TABLE cards (
  id integer PRIMARY KEY,
  nid integer NOT NULL,
  did integer NOT NULL,
  ord integer NOT NULL,
  mod integer NOT NULL,
  usn integer NOT NULL,
  type integer NOT NULL,
  queue integer NOT NULL,
  due integer NOT NULL,
  ivl integer NOT NULL,
  factor integer NOT NULL,
  reps integer NOT NULL,
  lapses integer NOT NULL,
  left integer NOT NULL,
  odue integer NOT NULL,
  odid integer NOT NULL,
  flags integer NOT NULL,
  data text NOT NULL
)
revlog|CREATE TABLE revlog (
  id integer PRIMARY KEY,
  cid integer NOT NULL,
  usn integer NOT NULL,
  ease integer NOT NULL,
  ivl integer NOT NULL,
  lastIvl integer NOT NULL,
  factor integer NOT NULL,
  time integer NOT NULL,
  type integer NOT NULL
)
ix_notes_usn|CREATE INDEX ix_notes_usn ON notes (usn)
ix_cards_usn|CREATE INDEX ix_cards_usn ON cards (usn)
ix_revlog_usn|CREATE INDEX ix_revlog_usn ON revlog (usn)
ix_cards_nid|CREATE INDEX ix_cards_nid ON cards (nid)
ix_cards_sched|CREATE INDEX ix_cards_sched ON cards (did, queue, due)
ix_revlog_cid|CREATE INDEX ix_revlog_cid ON revlog (cid)
ix_notes_csum|CREATE INDEX ix_notes_csum ON notes (csum)
sqlite_stat1|CREATE TABLE sqlite_stat1(tbl,idx,stat)
sqlite_stat4|CREATE TABLE sqlite_stat4(tbl,idx,neq,nlt,ndlt,sample)
graves|CREATE TABLE graves (
  usn integer NOT NULL,
  oid integer NOT NULL,
  type integer NOT NULL
)

sqlite> .mode column
sqlite> .headers on
sqlite> select * from cards;
id             nid            did  ord  mod         usn  type  queue  due  ivl  factor  reps  lapses  left  odue  odid  flags  data
-------------  -------------  ---  ---  ----------  ---  ----  -----  ---  ---  ------  ----  ------  ----  ----  ----  -----  ----
1675291807717  1675291807717  1    0    1675291807  -1   0     0      1    0    0       0     0       0     0     0     0      {}
sqlite> select * from notes;
id             guid        mid            mod         usn  tags  flds                                          sfld
                       csum        flags  data
-------------  ----------  -------------  ----------  ---  ----  --------------------------------------------  -------------------------------------------  ----------  -----  ----
1675291807717  x+=^uPIU4W  1675291807710  1675291807  -1         This file requires a newer version of Anki.  This file requires a newer version of Anki.  2258790693  0
{% endhighlight %}

# Appendix: SQLite

SQLite provides a relational database management system (RDBMS) with a dynamic type system that does not use a client/server architecture. The database (including the schema) is itself just a single file, which conveniently is cross-platform.

## sqlite3

This is a command line tool for interacting with a SQLite database. It is like the `mysql` and `pgsql` applications.

{% highlight console %}
 $ sqlite3 collection.anki21
{% endhighlight %}

The `collection.anki21` file is a SQLite database. I exported some old cards from Anki that I had tagged "sql" and then unzipped the resulting `*.apkg` file to get this to use as an example.

This shell shows the `sqlite>` prompt to which you can give dot-commands or SQL commands. `.exit` or `.quit` will exit the `sqlite3` interface. `.headers on` and `.mode column` make the output easier to read. `.schema` will output the DDL SQL statements (like `CREATE TABLE`) used to define the database schema. `.dump` dumps all the SQL needed to recreate both the schema and the data. `.read filename` can be used to execute a list of dot-commands and SQL statements from a file. To see a list of all the dot-commands, use `.help`.

{% highlight console %}
 $ sqlite3 collection.anki21
SQLite version 3.37.2 2022-01-06 13:25:41
Enter ".help" for usage hints.
sqlite> .headers on
sqlite> .mode column
sqlite> select id, tags, sfld from notes;
id             tags   sfld

-------------  -----  --------------------------------------------------------------------------------------------------------------------------------------
1648325779377   sql   When using the decimal data type in PostgreSQL, what happens if a precision and scale are not specified?

1648913496242   sql   What would be the table column definition for a column called 'initial_price' that cannot be null and holds dollar amounts up to 1000?
1649004161370   sql   When using the decimal data type in PostgreSQL, the first argument is called the

1649004176326   sql   When using the decimal data type in PostgreSQL, the second argument is the

1649435545603   sql   Why not index every column in a table?

1649436618774   sql   What would be the SQL statement to SELECT the next value of a sequence 'colors_id_seq'?
{% endhighlight %}

## System Catalogs

These are data structures holding system state data. In SQLite, they start with the prefix `sqlite_`. The most important one is the `sqlite_master` table, which has five columns: `type`, `name`, `tbl_name`, `rootpage`, and `sql`. `name` and `tbl_name` will have the same value for tables. The `sql` column usually holds the original SQL statement used to create the object, but it will reflect any modifications, such as if `ALTER TABLE` commands were applied to a table after the original `CREATE TABLE`.

{% include attribution-book.html
  book_title = "Using SQLite"
  book_author = "Jay A. Kreibich"
  book_publisher = "O'Reilly Media"
  book_isbn = "978-0596521189"
  book_link = "https://www.amazon.com/Using-SQLite-Small-Reliable-Choose/dp/0596521189"
%}