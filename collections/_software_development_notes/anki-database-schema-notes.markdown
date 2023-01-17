---
layout: post
title: Anki schema
categories: programming SQL anki
permalink: /anki-schema
emoji: 😋
mathjax: false
book_review: false
note_category: Software development
---

**This note is a work in progress.**

Related:
- [SQLite notes](/sqlite-notes)

Unzipping `test.apkg` created by exporting an Anki deck creates three files:
- `collection.anki2`
- `collection.anki21`
- `media`

**TODO** - What are the differences between `collection.anki2` and `collection.anki21` and at what version of Anki was the second version introduced?

# collection.anki2

Inspecting `sqlite_master` shows there is a `col` table, a `notes` table, a `cards` table, a `revlog` table, and a `graves` table. There are also two tables called `sqlite_stat1` and `sqlite_stat4`.

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

## col

{% highlight console %}
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

### conf

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

A lot of these values can be configured from the Anki Preferences. Some of them track the active deck (and sub-decks), the current deck, and the current model (note type). There may be other keys which are possible in this JSON that are not being used in my particular example.

### models

A quick inspection of this value using `sqlite3` shows that it is a very large piece of JSON data that includes data about the note types in the collection including details like the CSS.