---
layout: post
title: Anki schema
categories: programming SQL anki
permalink: /anki-schema
emoji: 😋
mathjax: false
---

These are my notes on the Anki database schema and data. They probably will continue to change over time and may include a lot more detail on some parts than others.

Related:
- [SQLite notes](/sqlite) - this page explains using `sqlite3` to inspect SQLite databases
- [Ankidroid document on the Anki schema](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure)
- [Comments on the Anki database design](https://www.natemeyvis.com/on-ankis-database.html)

Unzipping `*.apkg` (`unzip 日本語.apkg` in Unix-like operating systems) created by exporting an Anki deck creates three files:
- `collection.anki2`
- `collection.anki21`
- `media`

The following notes are based on inspection of the data in `collection.anki21.` The `.anki2` file would be the correct one to inspect when exporting decks from older Anki versions. When I looked at the one exported here from my newer Anki version, it did contain some data but from what I could tell, it did not reflect my Anki settings or any of the data I exported.

I recently removed all of my ~50,000+ Anki cards that I had accumulated up to this point. I just backed them up in the cloud because it was causing my Anki to take a few seconds to open and close and they were mostly about medicine and anatomy which I don't care about anymore (bye bye "In addition to the \{\{c4::VL::a thalamic nucleus\}\}, the \{\{c1::interposed nuclei::deep cerebellar nuclei\}\} also project to the \{\{c3::magnocellular division::red nucleus division\}\} to influence the \{\{c2::rubrospinal tract::a tract\}\}."!).

Since then, I have only added a few new notes to gradually get back into it. For this study, I added a couple of additional test decks and notes. The following are the decks that were exported for inspection here:

![The exported Anki decks](/assets/anki-schema-images/anki-screenshot-1.png)

Test deck 1 contains a single Basic note with three tags, one of which is hierarchical, and also has the red flag applied:

![The single Basic note in Test deck 1](/assets/anki-schema-images/anki-screenshot-2.png)

Test deck 2 contains a single Cloze note with the turquoise flag applied:

![The single Cloze note in Test deck 2](/assets/anki-schema-images/anki-screenshot-3.png)

The "Colors" and "Days of the week" decks have many notes of a custom type called Kanji Vocabulary Type. The following screenshot was taken a bit later than the others and on the left hand side you can see I deleted the test decks and added another deck that wasn't exported here, but the cards shown in the browser were exported here and are the same. I also suspended some cards in this deck before the export which are highlighted in yellow:

![More notes including some suspended ones](/assets/anki-schema-images/anki-screenshot-4.png)

The Kanji Vocabulary Type has three custom card types:

![The card types editor of the Kanji Vocabulary Type](/assets/anki-schema-images/anki-screenshot-5.png)

# The collection.anki21 SQLite database

Inspection of `sqlite_master` shows there is a `col` table, a `notes` table, a `cards` table, a `revlog` table, and a `graves` table. There are also two tables called `sqlite_stat1` and `sqlite_stat4` and 7 indexes.

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
1   1490252400  1673711727692  1673711727690  11   0    0    0
{% endhighlight %}

### The conf column

This column has a JSON value:

{% highlight json %}
{
  "newSpread":0,
  "dueCounts":true,
  "curDeck":1,
  "nextPos":1,
  "activeDecks":[1],
  "sortType":"noteFld",
  "sortBackwards":false,
  "schedVer":2,
  "addToCur":true,
  "dayLearnFirst":false,
  "collapseTime":1200,
  "curModel":1599087650848,
  "creationOffset":300,
  "timeLim":0,
  "estTimes":true
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
{"1674448040667"=>
  {"id"=>1674448040667,
   "name"=>"Kanji Vocabulary Type",
   "type"=>0,
   "mod"=>1674448483,
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
    "}\n" +
    "\n" +
    "span {\n" +
    " background-color: transparent !important;\n" +
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
   "vers"=>[],
   "tags"=>["japanese"]},
 "1609035088779"=>
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
 "1674513600207"=>
  {"id"=>1674513600207,
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
   "name"=>"Basic-3d37e",
   "type"=>0,
   "mod"=>1669860259,
   "usn"=>0,
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
   "vers"=>[],
   "tags"=>["linux-command-line"]}}
{% endraw %}{% endhighlight %}

This has a lot of information about the note types, including the fields, HTML card templates, CSS, and LaTeX. A copy of the Basic note type that I wasn't expecting also seems to have snuck in. This may have just been due to me missing deleting that before I exported the deck.

### The decks column

This column also has a JSON value that is easier to see as a Ruby hash:

{% highlight ruby %}
{"1674448105992"=>
  {"id"=>1674448105992,
   "mod"=>1674512694,
   "name"=>"日本語",
   "usn"=>-1,
   "lrnToday"=>[2132, 0],
   "revToday"=>[2132, 0],
   "newToday"=>[2132, 3],
   "timeToday"=>[2132, 255226],
   "collapsed"=>false,
   "browserCollapsed"=>false,
   "desc"=>"",
   "dyn"=>0,
   "newLimit"=>nil,
   "reviewLimit"=>nil,
   "reviewLimitToday"=>nil,
   "newLimitToday"=>nil,
   "conf"=>1,
   "extendNew"=>0,
   "extendRev"=>0},
 "1674511921387"=>
  {"id"=>1674511921387,
   "mod"=>1674511923,
   "name"=>"日本語::Days of the week",
   "usn"=>5875,
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
 "1674511952800"=>
  {"id"=>1674511952800,
   "mod"=>1674512097,
   "name"=>"日本語::Colors",
   "usn"=>-1,
   "lrnToday"=>[2132, 0],
   "revToday"=>[2132, 0],
   "newToday"=>[2132, 3],
   "timeToday"=>[2132, 15129],
   "collapsed"=>true,
   "browserCollapsed"=>true,
   "desc"=>"",
   "dyn"=>0,
   "conf"=>1,
   "extendNew"=>0,
   "extendRev"=>0},
 "1674512125442"=>
  {"id"=>1674512125442,
   "mod"=>1674512127,
   "name"=>"日本語::Test deck 1",
   "usn"=>-1,
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
 "1674512188946"=>
  {"id"=>1674512188946,
   "mod"=>1674512190,
   "name"=>"日本語::Test deck 2",
   "usn"=>-1,
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
 "1"=>
  {"id"=>1,
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
-------------  ----------  -------------  ----------  ----
1674448195864  UIkul}1W%   1674448040667  1674448195  0
1674448236927  E.dNl$2k.@  1674448040667  1674448236  0
1674448258661  d%`f~lxX(X  1674448040667  1674448258  0
1674448280029  jpLr_a9sL!  1674448040667  1674448280  0
1674448302294  Fvfn.@t/U#  1674448040667  1674448302  0
1674448334463  GxM)c${s2|  1674448040667  1674448334  0
1674448351508  t@?p@qn?lY  1674448040667  1674448351  0
1674511981514  ml}gJs=U]i  1674448040667  1674511981  5875
1674511997096  cQOQF+R0:E  1674448040667  1674511997  5875
1674512012783  K^:!n:oRP7  1674448040667  1674512012  5875
1674512029545  yzOlM-(YFJ  1674448040667  1674512029  5875
1674512180609  Nc_f>6+BRp  1599087650848  1674512180  -1
1674512230110  iW%z&a5$~[  1609035088779  1674512230  -1
{% endhighlight %}

- id
  - The primary key id of the note record
  - Based on the time the note was created
- guid
  - A globally unique id
- mid
  - The note's model (note type) id
- mod
  - Last time modified?
- usn

### The tags column

This shows the tags of the notes:

{% highlight sql %}
sqlite> select id, tags from notes;
id             tags
-------------  ----------------
1674448195864
1674448236927
1674448258661
1674448280029
1674448302294
1674448334463
1674448351508
1674511981514
1674511997096
1674512012783
1674512029545
1674512180609   a::b tag1 tag2
1674512230110
{% endhighlight %}

Here we can see that the single test note has three tags and the rest have no tags. The tags are a string of the tag names separated by spaces.

### The flds column

{% highlight console %}{% raw %}
sqlite> select flds from notes where id = 1674512180609;
flds
---------------------------------------------
Basic card exampleBack of basic card example
{% endraw %}{% endhighlight %}

`flds` stores the values of the fields. The individual fields are separated from each other in the `flds` by one of the ASCII control codes, the unit separator (31 or `1F` in hexadecimal). It looks like this in the `sqlite3` interface:

![The unit separator character in the sqlite3 command line program](/assets/anki-schema-images/unit-separator-1.png)

This is how it looks in VS Code:

![The unit separator character in VS Code](/assets/anki-schema-images/unit-separator-2.png)

Here is the `flds` for one of the Kanji Vocabulary Type notes:

{% highlight console %}
sqlite> select flds from notes where id = 1674512029545;
flds

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
black<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">黒</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">くろ</span>
{% endhighlight %}

There are some HTML elements here with inline CSS styling due to me copy and pasting these characters from a web page into Anki. The HTML content of the fields can be seen in the note editor by toggling on the HTML editor:

![Anki note editor with HTML editor toggled on](/assets/anki-schema-images/anki-screenshot-6.png)

This explains why I added the following CSS to the Kanji Vocabulary Type:

{% highlight css %}
span {
  background-color: transparent !important;
}
{% endhighlight %}

### The sfld column

{% highlight console %}{% raw %}
sqlite> select sfld from notes;
sfld
-----------------------------
Sunday
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
red
blue
white
black
Basic card example
A {{c1::cloze deletion note}}
{% endraw %}{% endhighlight %}

This stores the specific field which is used for sorting the notes.

### The csum, flags, and data columns

{% highlight console %}
sqlite> select csum, flags, data from notes;
csum        flags  data
----------  -----  ----
3160264773  0
2469325584  0
1122253665  0
1448524215  0
1979915743  0
3513182276  0
386284624   0
2023260176  0
1285194446  0
1384968071  0
1181468878  0
3930697018  0
3693921969  0
{% endhighlight %}

The `csum` is some kind of checksum used to detect duplicates.

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
1674448195869  1674448195864  1674511921387  0    1674511933
1674448195872  1674448195864  1674511921387  1    1674511933
1674448195873  1674448195864  1674511921387  2    1674511933
1674448236928  1674448236927  1674511921387  0    1674511933
1674448236929  1674448236927  1674511921387  1    1674511933
1674448236930  1674448236927  1674511921387  2    1674511933
1674448258663  1674448258661  1674511921387  0    1674511933
1674448258664  1674448258661  1674511921387  1    1674511933
1674448258665  1674448258661  1674511921387  2    1674511933
1674448280030  1674448280029  1674511921387  0    1674511933
1674448280031  1674448280029  1674511921387  1    1674511933
1674448280032  1674448280029  1674511921387  2    1674511933
1674448302294  1674448302294  1674511921387  0    1674511933
1674448302295  1674448302294  1674511921387  1    1674511933
1674448302296  1674448302294  1674511921387  2    1674511933
1674448334464  1674448334463  1674511921387  0    1674511933
1674448334465  1674448334463  1674511921387  1    1674511933
1674448334466  1674448334463  1674511921387  2    1674511933
1674448351508  1674448351508  1674511921387  0    1674511933
1674448351509  1674448351508  1674511921387  1    1674511933
1674448351510  1674448351508  1674511921387  2    1674511933
1674511981515  1674511981514  1674511952800  0    1674512341
1674511981516  1674511981514  1674511952800  1    1674512339
1674511981517  1674511981514  1674511952800  2    1674512338
1674511997096  1674511997096  1674511952800  0    1674512093
1674511997097  1674511997096  1674511952800  1    1674511997
1674511997098  1674511997096  1674511952800  2    1674511997
1674512012783  1674512012783  1674511952800  0    1674512323
1674512012784  1674512012783  1674511952800  1    1674512012
1674512012785  1674512012783  1674511952800  2    1674512012
1674512029545  1674512029545  1674511952800  0    1674512029
1674512029546  1674512029545  1674511952800  1    1674512029
1674512029547  1674512029545  1674511952800  2    1674512029
1674512180609  1674512180609  1674512125442  0    1674512180
1674512230119  1674512230110  1674512188946  0    1674512230
{% endhighlight %}

- id
  - The primary key id of the card record
- nid
  - The id of the note that the card is created from
- did
  - The id of the deck that the card belongs to
- ord
  - e.g. a note that creates three cards will create three cards with `oid` 0, 1, and 2
- mod
  - last time modified

### The usn, type, queue, and due columns

{% highlight sql %}
sqlite> select id, usn, type, queue, due from cards;
id             usn   type  queue  due
-------------  ----  ----  -----  ----------
1674448195869  5875  1     3      2133
1674448195872  5875  2     2      2133
1674448195873  5875  2     2      2133
1674448236928  5875  2     2      2133
1674448236929  5875  2     2      2133
1674448236930  5875  2     2      2133
1674448258663  5875  2     2      2133
1674448258664  5875  2     2      2133
1674448258665  5875  2     2      2133
1674448280030  5875  2     2      2133
1674448280031  5875  2     2      2133
1674448280032  5875  2     2      2133
1674448302294  5875  2     2      2133
1674448302295  5875  2     2      2133
1674448302296  5875  2     2      2133
1674448334464  5875  2     2      2133
1674448334465  5875  2     2      2133
1674448334466  5875  1     3      2133
1674448351508  5875  2     2      2133
1674448351509  5875  2     2      2133
1674448351510  5875  2     2      2133
1674511981515  -1    1     -1     2133
1674511981516  -1    0     -1     0
1674511981517  -1    0     -1     0
1674511997096  -1    1     1      1674512758
1674511997097  5875  0     0      1
1674511997098  5875  0     0      1
1674512012783  -1    1     -1     2133
1674512012784  5875  0     0      2
1674512012785  5875  0     0      2
1674512029545  5875  0     0      3
1674512029546  5875  0     0      3
1674512029547  5875  0     0      3
1674512180609  -1    0     0      4
1674512230119  -1    0     0      5
{% endhighlight %}

- usn
- type
- queue
- due

### The ivl, factor, reps, and lapses columns

{% highlight sql %}
sqlite> select id, ivl, factor, reps, lapses from cards;
id             ivl  factor  reps  lapses
-------------  ---  ------  ----  ------
1674448195869  0    0       3     0
1674448195872  1    1750    3     0
1674448195873  1    1750    2     0
1674448236928  1    1750    4     0
1674448236929  1    1750    3     0
1674448236930  1    1750    3     0
1674448258663  1    1750    2     0
1674448258664  1    1750    4     0
1674448258665  1    1750    2     0
1674448280030  1    1750    6     0
1674448280031  1    1750    4     0
1674448280032  1    1750    5     0
1674448302294  1    1750    7     0
1674448302295  1    1750    3     0
1674448302296  1    1750    3     0
1674448334464  1    1750    4     0
1674448334465  1    1750    3     0
1674448334466  0    0       5     0
1674448351508  1    1750    3     0
1674448351509  1    1750    3     0
1674448351510  1    1750    2     0
1674511981515  0    0       1     0
1674511981516  0    0       0     0
1674511981517  0    0       0     0
1674511997096  0    0       1     0
1674511997097  0    0       0     0
1674511997098  0    0       0     0
1674512012783  0    0       1     0
1674512012784  0    0       0     0
1674512012785  0    0       0     0
1674512029545  0    0       0     0
1674512029546  0    0       0     0
1674512029547  0    0       0     0
1674512180609  0    0       0     0
1674512230119  0    0       0     0
{% endhighlight %}

- ivl
- factor
- reps
  - The number of times the card has been reviewed
- lapses

### The left, odue, odid, flags, and data columns

{% highlight console %}{% raw %}
sqlite> select id, left, odue, odid, flags, data from cards;
id             left  odue  odid  flags  data
-------------  ----  ----  ----  -----  ----
1674448195869  1001  0     0     0      {}
1674448195872  1001  0     0     0      {}
1674448195873  1001  0     0     0      {}
1674448236928  1001  0     0     0      {}
1674448236929  1001  0     0     0      {}
1674448236930  1001  0     0     0      {}
1674448258663  1001  0     0     0      {}
1674448258664  1001  0     0     0      {}
1674448258665  1001  0     0     0      {}
1674448280030  1001  0     0     0      {}
1674448280031  1001  0     0     0      {}
1674448280032  1001  0     0     0      {}
1674448302294  1001  0     0     0      {}
1674448302295  1001  0     0     0      {}
1674448302296  1001  0     0     0      {}
1674448334464  1001  0     0     0      {}
1674448334465  1001  0     0     0      {}
1674448334466  1001  0     0     0      {}
1674448351508  1001  0     0     0      {}
1674448351509  1001  0     0     0      {}
1674448351510  1001  0     0     0      {}
1674511981515  1002  0     0     0      {}
1674511981516  0     0     0     0      {}
1674511981517  0     0     0     0      {}
1674511997096  1002  0     0     0      {}
1674511997097  0     0     0     0      {}
1674511997098  0     0     0     0      {}
1674512012783  1001  0     0     0      {}
1674512012784  0     0     0     0      {}
1674512012785  0     0     0     0      {}
1674512029545  0     0     0     0      {}
1674512029546  0     0     0     0      {}
1674512029547  0     0     0     0      {}
1674512180609  0     0     0     0      {}
1674512230119  0     0     0     0      {}
{% endraw %}{% endhighlight %}

- left
- odue
- odid
  - The original deck id of a card in a filtered deck
- flags
  - An integer which represents a flag color such as turquoise
  - Although I flagged a few cards before the export, they were not exported
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
id             cid            usn   ease  ivl
-------------  -------------  ----  ----  ------
1674448510823  1674448195869  0     2     -43500
1674448515642  1674448236928  0     1     -600
1674448522329  1674448258663  0     3     -86400
1674448525510  1674448280030  0     1     -600
1674448529857  1674448302294  0     1     -600
1674448535769  1674448334464  0     1     -600
1674448539349  1674448351508  0     1     -600
1674448544960  1674448195872  0     1     -600
1674448546621  1674448236929  0     1     -600
1674448548221  1674448258664  0     1     -600
1674448549412  1674448280031  0     1     -600
1674448551411  1674448302295  0     1     -600
1674448553823  1674448334465  0     1     -600
1674448556032  1674448351509  0     1     -600
1674448563509  1674448195873  0     3     -86400
1674448575224  1674448236930  0     1     -600
1674448586062  1674448258665  0     3     -86400
1674448590300  1674448280032  0     1     -600
1674448594568  1674448302296  0     1     -600
1674448596960  1674448334466  0     1     -600
1674448601266  1674448351510  0     3     -86400
1674448623521  1674448236928  0     1     -600
1674448629400  1674448280030  0     1     -600
1674448634633  1674448280031  0     1     -600
1674448640599  1674448236930  0     3     -86400
1674448646188  1674448302294  0     1     -600
1674448651139  1674448195872  0     3     -86400
1674448656727  1674448334464  0     1     -600
1674448660953  1674448302295  0     3     -86400
1674448663833  1674448334465  0     3     -86400
1674448672996  1674448280030  0     1     -600
1674448677772  1674448236929  0     3     -86400
1674448680101  1674448351508  0     3     -86400
1674448704072  1674448280032  0     1     -600
1674448709888  1674448351509  0     3     -86400
1674448711993  1674448280031  0     3     -86400
1674448716265  1674448258664  0     1     -600
1674448722239  1674448302296  0     3     -86400
1674448737856  1674448236928  0     3     -86400
1674448767375  1674448280030  0     1     -600
1674448784770  1674448334466  0     1     -600
1674448796344  1674448302294  0     1     -600
1674448808865  1674448334464  0     3     -86400
1674448818474  1674448280032  0     1     -600
1674448837508  1674448302294  0     1     -600
1674448840336  1674448258664  0     3     -86400
1674448857054  1674448302294  0     1     -600
1674448868053  1674448334466  0     3     -86400
1674448876128  1674448280030  0     3     -86400
1674448887160  1674448280032  0     3     -86400
1674448890659  1674448302294  0     3     -86400
1674510829783  1674448258664  5871  3     1
1674510835872  1674448195872  5871  3     1
1674510850628  1674448302296  5871  3     1
1674510858915  1674448302294  5871  3     1
1674510862722  1674448280031  5871  3     1
1674510878597  1674448195869  5871  1     -600
1674510884615  1674448280032  5871  3     1
1674510889396  1674448236928  5871  3     1
1674510891831  1674448258663  5871  3     1
1674510896937  1674448334465  5871  3     1
1674510900344  1674448236929  5871  3     1
1674510902905  1674448351509  5871  3     1
1674510931417  1674448351508  5871  3     1
1674510944474  1674448258665  5871  3     1
1674510950329  1674448236930  5871  3     1
1674510971959  1674448334466  5871  1     -600
1674510975776  1674448302295  5871  3     1
1674510983169  1674448351510  5871  3     1
1674510985879  1674448334464  5871  3     1
1674510988959  1674448280030  5871  3     1
1674510996283  1674448195873  5871  3     1
1674511000165  1674448195869  5871  3     -86400
1674511065444  1674448334466  5871  3     -86400
1674512086900  1674511981515  -1    2     -43500
1674512093076  1674511997096  -1    1     -600
1674512097649  1674512012783  -1    3     -86400
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
id             lastIvl  factor  time    type
-------------  -------  ------  ------  ----
1674448510823  -600     0       120000  0
1674448515642  -600     0       4797    0
1674448522329  -600     0       6668    0
1674448525510  -600     0       3168    0
1674448529857  -600     0       4334    0
1674448535769  -600     0       5893    0
1674448539349  -600     0       3563    0
1674448544960  -600     0       5595    0
1674448546621  -600     0       1648    0
1674448548221  -600     0       1583    0
1674448549412  -600     0       1174    0
1674448551411  -600     0       1988    0
1674448553823  -600     0       2396    0
1674448556032  -600     0       2196    0
1674448563509  -600     0       7462    0
1674448575224  -600     0       11696   0
1674448586062  -600     0       10821   0
1674448590300  -600     0       4216    0
1674448594568  -600     0       4252    0
1674448596960  -600     0       2391    0
1674448601266  -600     0       4298    0
1674448623521  -600     0       22236   0
1674448629400  -600     0       5864    0
1674448634633  -600     0       5221    0
1674448640599  -600     0       5954    0
1674448646188  -600     0       5586    0
1674448651139  -600     0       4927    0
1674448656727  -600     0       5564    0
1674448660953  -600     0       4209    0
1674448663833  -600     0       2867    0
1674448672996  -600     0       9163    0
1674448677772  -600     0       4762    0
1674448680101  -600     0       2311    0
1674448704072  -600     0       23971   0
1674448709888  -600     0       5798    0
1674448711993  -600     0       2092    0
1674448716265  -600     0       1273    0
1674448722239  -600     0       5926    0
1674448737856  -600     0       15603   0
1674448767375  -600     0       29518   0
1674448784770  -600     0       17379   0
1674448796344  -600     0       11551   0
1674448808865  -600     0       12498   0
1674448818474  -600     0       9587    0
1674448837508  -600     0       19011   0
1674448840336  -600     0       2803    0
1674448857054  -600     0       16718   0
1674448868053  -600     0       10982   0
1674448876128  -600     0       8062    0
1674448887160  -600     0       11015   0
1674448890659  -600     0       3475    0
1674510829783  -86400   1750    4766    0
1674510835872  -86400   1750    6063    0
1674510850628  -86400   1750    14735   0
1674510858915  -86400   1750    8271    0
1674510862722  -86400   1750    3774    0
1674510878597  -600     0       15843   0
1674510884615  -86400   1750    5988    0
1674510889396  -86400   1750    4748    0
1674510891831  -86400   1750    2402    0
1674510896937  -86400   1750    5074    0
1674510900344  -86400   1750    3376    0
1674510902905  -86400   1750    2537    0
1674510931417  -86400   1750    28486   0
1674510944474  -86400   1750    13040   0
1674510950329  -86400   1750    5830    0
1674510971959  -86400   0       21602   0
1674510975776  -86400   1750    3799    0
1674510983169  -86400   1750    7364    0
1674510985879  -86400   1750    2668    0
1674510988959  -86400   1750    3048    0
1674510996283  -86400   1750    7289    0
1674511000165  -600     0       3851    0
1674511065444  -600     0       65252   0
1674512086900  -600     0       4399    0
1674512093076  -600     0       6168    0
1674512097649  -600     0       4560    0
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

The graves table contains references to things that have been deleted locally so that the sync can delete them remotely.
