---
layout: post
title: Anki schema
categories: programming SQL anki
permalink: /anki-schema
emoji: 😋
mathjax: false
---

**These notes are a work in progress, very incomplete, and are subject to change.**

Related:
- [SQLite notes](/sqlite) - this page explains using `sqlite3` to inspect SQLite databases

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

This table is expected to have the data about the notes. In Anki, you create notes and study cards. Creating a note creates one or more cards to study according to the note type.

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

This includes a comment about the `flds` column deliberately using the integer type for ordering.

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
  - The primary key id
  - Based on the time the note was created
- guid
  - A globally unique id
- mid
- mod
  - The model (note type) id
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

Here we can see that the single test note has three tags and the rest have no tags.

### The flds column

{% highlight console %}{% raw %}
sqlite> select flds from notes;
flds

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Sunday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">日</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">にち</span>
Monday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">月</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">げつ</span>
Tuesday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">火</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">か</span>
Wednesday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">水</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">すい</span>
Thursday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">木</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">もく</span>
Friday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">金</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">きん</span>
Saturday<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">土</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">ど</span>
red<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">赤</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">あか</span>
blue<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">青</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">あお</span>
white<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">白</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">しろ</span>
black<span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">黒</span><span style="color: rgb(34, 34, 34); background-color: rgb(255, 255, 255);">くろ</span>
Basic card exampleBack of basic card example

A&nbsp;{{c1::cloze deletion note}}More context
{% endraw %}{% endhighlight %}

**TODO** - Figure out the character/character encoding being used to separate the fields here.