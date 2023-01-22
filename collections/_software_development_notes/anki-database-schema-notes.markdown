---
layout: post
title: Anki schema
categories: programming SQL anki
permalink: /anki-schema
emoji: 😋
mathjax: false
---

**This note is a work in progress. It will change as I understand the important aspects of the schema. Probably the part about the old version of the database will be removed soon.**

Related:
- [SQLite notes](/sqlite-notes)

Unzipping `test.apkg` created by exporting an Anki deck creates three files:
- `collection.anki2`
- `collection.anki21`
- `media`

`collection.anki21` is the newer version of the database. The version of Anki I used to export the example deck is past the transition from `collection.anki2` to `collection.anki21` and if you read the section below you will see that I found `collection.anki2` to be pretty empty and with configuration values that did not reflect my actual Anki settings.

**I recommend skipping the following section to see the section about `collection.anki21` which is the real SQLite database for newer Anki versions.**

# The collection.anki2 SQLite database

This is the Anki SQLite database from older versions. I believe this entire section generally shows what it looks like when you export a deck from a newer Anki version. Inspecting `sqlite_master` shows there is a `col` table, a `notes` table, a `cards` table, a `revlog` table, and a `graves` table. There are also two tables called `sqlite_stat1` and `sqlite_stat4` and 7 indexes.

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
sqlite> select sql from sqlite_master where name = "col"; -- I cleaned up the output
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

This table seems to generally be used to store a single record. Therefore each column of the table has one value for the entire Anki collection/exported database.

### col.conf

The conf value is JSON:

{% highlight json %}
{
"timeLim":0,
"_deck_0_lastNotetype":1673711727720,
"estTimes":true,
"nextPos":2,
"activeDecks":[1],
"curModel":1673711727720,
"newSpread":0,
"addToCur":true,
"schedVer":2,
"creationOffset":300,
"sortBackwards":false,
"dayLearnFirst":false,
"_nt_1673711727720_lastDeck":0,
"dueCounts":true,
"sortType":"noteFld",
"curDeck":1,
"collapseTime":1200
}
{% endhighlight %}

A lot of these values can be configured from the Anki Preferences. Some of them track the active deck (and sub-decks), the current deck, and the current model (note type). There may be other keys sometimes present in this JSON value that are missing from my particular example.

**TODO** - Does the conf value of an imported Anki deck have any effect during the import?

### col.models

A quick inspection of this value using `sqlite3` shows that it is a very large piece of JSON data that includes data about the note types in the collection including details like the CSS.

I wrote the following short script to format the data nicely. It uses the sqlite3-ruby gem which is not part of the Ruby standard library.

{% highlight ruby %}
require 'sqlite3'
require 'json'

db = SQLite3::Database.new "collection.anki2"
db.results_as_hash = true

rows = db.execute "select models from col;"

rows.each do |row|
  x = JSON.parse(row['models'])
  pp x
end

{% endhighlight %}

This allows us to inspect the JSON value as a Ruby hash object:

{% highlight ruby %}{% raw %}
{"1673711727721"=>
  {"id"=>1673711727721,
   "name"=>"Basic (and reversed card)",
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
      "bsize"=>0},
     {"name"=>"Card 2",
      "ord"=>1,
      "qfmt"=>"{{Back}}",
      "afmt"=>
       "{{FrontSide}}\n" + "\n" + "<hr id=answer>\n" + "\n" + "{{Front}}",
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
   "req"=>[[0, "any", [0]], [1, "any", [1]]]},
 "1673711727724"=>
  {"id"=>1673711727724,
   "name"=>"Cloze",
   "type"=>1,
   "mod"=>0,
   "usn"=>0,
   "sortf"=>0,
   "did"=>nil,
   "tmpls"=>
    [{"name"=>"Cloze",
      "ord"=>0,
      "qfmt"=>"{{cloze:Text}}",
      "afmt"=>"{{cloze:Text}}<br>\n" + "{{Back Extra}}",
      "bqfmt"=>"",
      "bafmt"=>"",
      "did"=>nil,
      "bfont"=>"",
      "bsize"=>0}],
   "flds"=>
    [{"name"=>"Text",
      "ord"=>0,
      "sticky"=>false,
      "rtl"=>false,
      "font"=>"Arial",
      "size"=>20,
      "description"=>""},
     {"name"=>"Back Extra",
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
    "}\n" +
    ".cloze {\n" +
    "    font-weight: bold;\n" +
    "    color: blue;\n" +
    "}\n" +
    ".nightMode .cloze {\n" +
    "    color: lightblue;\n" +
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
 "1673711727723"=>
  {"id"=>1673711727723,
   "name"=>"Basic (type in the answer)",
   "type"=>0,
   "mod"=>0,
   "usn"=>0,
   "sortf"=>0,
   "did"=>nil,
   "tmpls"=>
    [{"name"=>"Card 1",
      "ord"=>0,
      "qfmt"=>"{{Front}}\n" + "\n" + "{{type:Back}}",
      "afmt"=>
       "{{Front}}\n" + "\n" + "<hr id=answer>\n" + "\n" + "{{type:Back}}",
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
   "req"=>[[0, "any", [0, 1]]]},
 "1673711727720"=>
  {"id"=>1673711727720,
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
 "1673711727722"=>
  {"id"=>1673711727722,
   "name"=>"Basic (optional reversed card)",
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
      "bsize"=>0},
     {"name"=>"Card 2",
      "ord"=>1,
      "qfmt"=>"{{#Add Reverse}}{{Back}}{{\/Add Reverse}}",
      "afmt"=>
       "{{FrontSide}}\n" + "\n" + "<hr id=answer>\n" + "\n" + "{{Front}}",
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
      "description"=>""},
     {"name"=>"Add Reverse",
      "ord"=>2,
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
   "req"=>[[0, "any", [0]], [1, "all", [1, 2]]]}}
{% endraw %}{% endhighlight %}

### col.decks

{% highlight json %}
{"1":
  {"id":1,
   "mod":0,
   "name":"Default",
   "usn":0,
   "lrnToday":[0,0],
   "revToday":[0,0],
   "newToday":[0,0],
   "timeToday":[0,0],
   "collapsed":true,
   "browserCollapsed":true,
   "desc":"",
   "dyn":0,
   "conf":1,
   "extendNew":0,
   "extendRev":0
  }
}
{% endhighlight %}

I think the `"name":"Default"` refers to the options/settings preset that is being applied to the single deck that I exported.

### col.dconf

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
   "new":
      {"bury":false,
       "delays":[1.0,10.0],
       "initialFactor":2500,
       "ints":[1,4,0],
       "order":1,
       "perDay":20},
    "rev":
      {"bury":false,
       "ease4":1.3,
       "ivlFct":1.0,
       "maxIvl":36500,
       "perDay":200,
       "hardFactor":1.2},
    "lapse":
      {"delays":[10.0],
       "leechAction":1,
       "leechFails":8,
       "minInt":1,
       "mult":0.0},
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

This looks like the Default preset options. What is interesting to me is that it appears like the true default options you get with a fresh install of Anki, and is different from my edited default options that are being applied to the deck that I exported. This may just be how the export works.

### col.tags

{% highlight console %}
sqlite> .mode column
sqlite> .headers on
sqlite> select tags from col;
tags
----
{}
{% endhighlight %}

I guess my exported deck doesn't have anything for this.

**TODO** - Get a `collection.anki2` which has this value.

## The notes table

{% highlight sql %}
sqlite> .mode column
sqlite> .headers on
sqlite> select sql from sqlite_master where name = "notes";
sql
-------------------------------------------------------------------------------------------------
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
sqlite> select count(*) from notes;
count(*)

sqlite> select * from notes;
id             guid        mid            mod         usn  tags  flds                                          sfld                                         csum        flags  data
-------------  ----------  -------------  ----------  ---  ----  --------------------------------------------  -------------------------------------------  ----------  -----  ----
1673711727728  e82aX*qsT5  1673711727720  1673711727  -1         This file requires a newer version of Anki.  This file requires a newer version of Anki.  2258790693  0      1
{% endhighlight %}

## The cards table

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "cards";
sql
--------------------------
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
sqlite> select * from cards;
id             nid            did  ord  mod         usn  type  queue  due  ivl  factor  reps  lapses  left  odue  odid  flags  data
-------------  -------------  ---  ---  ----------  ---  ----  -----  ---  ---  ------  ----  ------  ----  ----  ----  -----  ----
1673711727728  1673711727728  1    0    1673711727  -1   0     0      1    0    0       0     0       0     0     0     0      {}
{% endhighlight %}

## The revlog table

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "revlog";
sql
---------------------------
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
sqlite> select count(*) from revlog;
count(*)
--------
0
{% endhighlight %}

## The graves table

{% highlight sql %}
sqlite> select sql from sqlite_master where name = "graves";
sql
---------------------------------------
CREATE TABLE graves (
  usn integer NOT NULL,
  oid integer NOT NULL,
  type integer NOT NULL
)
sqlite> select count(*) from graves;
count(*)
--------
0
{% endhighlight %}

# The collection.anki21 SQLite database

{% highlight sql %}
sqlite> .mode column
sqlite> .headers on
sqlite> select name, type from sqlite_master;
name            type
--------------  -----
col             table
notes           table
cards           table
revlog          table
ix_notes_usn    index
ix_cards_usn    index
ix_revlog_usn   index
ix_cards_nid    index
ix_cards_sched  index
ix_revlog_cid   index
ix_notes_csum   index
sqlite_stat1    table
sqlite_stat4    table
graves          table
{% endhighlight %}

This system catalog shows that in terms of the names and types of objects in the database, there is no difference between `collection.anki2` and `collection.anki21`.

## The col table

{% highlight sql %}
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
sqlite> select id, crt, mod, scm, ver, dty, usn, ls from col;
id  crt         mod            scm            ver  dty  usn  ls
--  ----------  -------------  -------------  ---  ---  ---  --
1   1490252400  1673711727692  1673711727690  11   0    0    0
{% endhighlight %}

### col.conf

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

This shows some differences in the JSON keys from what I saw in the `collection.anki2` version.

### col.models

{% highlight ruby %}{% raw %}
{"1599087650848"=>
  {"id"=>1599087650848,
   "name"=>"Basic-2fa75",
   "type"=>0,
   "mod"=>1669860259,
   "usn"=>5854,
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
   "vers"=>[]},
 "1673711727690"=>
  {"id"=>1673711727690,
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
   "req"=>[[0, "any", [0]]]}}
{% endraw %}{% endhighlight %}

This is looking better compared to the `collection.anki2` version. All of the cards in the exported deck are of the Basic note type, so I am not sure why the Basic clone note type is included in this ("Basic-2fa75").

### col.decks

{% highlight json %}
{
"1673711691444":
  {"id":1673711691444,
   "mod":1673711695,
   "name":"Computer Science - Old::SQL::TEST",
   "usn":-1,
   "lrnToday":[0,0],
   "revToday":[0,0],
   "newToday":[0,0],
   "timeToday":[0,0],
   "collapsed":true,
   "browserCollapsed":true,
   "desc":"",
   "dyn":0,
   "conf":1,
   "extendNew":0,
   "extendRev":0},
"1":
  {"id":1,
    "mod":0,
    "name":"Default",
    "usn":0,
    "lrnToday":[0,0],
    "revToday":[0,0],
    "newToday":[0,0],
    "timeToday":[0,0],
    "collapsed":true,
    "browserCollapsed":true,
    "desc":"",
    "dyn":0,
    "conf":1,
    "extendNew":0,
    "extendRev":0}
}
{% endhighlight sql %}

Default deck could always be included in the exported Anki deck?

### col.dconf

{% highlight json %}
{
"1":
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

### col.tags

{% highlight sql %}
sqlite> select tags from col;
tags
----
{}
{% endhighlight %}

## The notes table

{% highlight sql %}
sqlite> select id, guid, mid, mod, usn, tags from notes;
id             guid        mid            mod         usn   tags
-------------  ----------  -------------  ----------  ----  -----
1648325779377  o&J*I(|]|o  1599087650848  1648325779  5691   sql
1648913496242  ca9yn4LW.I  1599087650848  1648913496  5714   sql
1649004161370  tu.>@K1|_#  1599087650848  1649004187  5715   sql
1649004176326  zTYo-KmaBj  1599087650848  1649004176  5715   sql
1649435545603  dT.b1dz~5[  1599087650848  1649435545  5730   sql
1649436618774  MF{:ZQ%#9#  1599087650848  1649436618  5730   sql

sqlite> select flds from notes;
flds

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
When using the decimal data type in PostgreSQL, what happens if a precision and scale are not specified?PostgreSQL allows values that have any precision or scale

What would be the table column definition for a column called 'initial_price' that cannot be null and holds dollar amounts up to 1000?initial_price decimal(6,2) NOT NULL CHECK(initial_price BETWEEN 0.01 AND 1000.00)
When using the decimal data type in PostgreSQL, the first argument is called the&nbsp;precision

When using the decimal data type in PostgreSQL, the second argument is the&nbsp;scale

Why not index every column in a table?Reads become faster but every time a row is updated or inserted, the index must be updated as well.

What would be the SQL statement to SELECT the next value of a sequence 'colors_id_seq'?SELECT nextval('colors_id_seq');

sqlite> select sfld, csum, flags, data from notes;
sfld                                                                                                                                    csum        flags  data
--------------------------------------------------------------------------------------------------------------------------------------  ----------  -----  ----
When using the decimal data type in PostgreSQL, what happens if a precision and scale are not specified?                                3255431505  0
What would be the table column definition for a column called 'initial_price' that cannot be null and holds dollar amounts up to 1000?  2253078971  0
When using the decimal data type in PostgreSQL, the first argument is called the                                                        3853034397  0
When using the decimal data type in PostgreSQL, the second argument is the                                                              1780383910  0
Why not index every column in a table?                                                                                                  4074392252  0
What would be the SQL statement to SELECT the next value of a sequence 'colors_id_seq'?                                                 372666139   0
{% endhighlight %}

