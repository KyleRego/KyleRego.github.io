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

Unzipping `test.apkg` created by exporting an Anki deck creates three files:
- `collection.anki2`
- `collection.anki21`
- `media`

The following notes are based on inspection of the data in `collection.anki21.` The `.anki2` file would be the correct one to inspect when exporting decks from older Anki versions. When I inspected the one exported here from my newer Anki version, it did contain some data but from what I could tell, it did not reflect my Anki settings or any of the data I exported.

I recently removed all of my ~50,000+ Anki cards that I had accumulated to this point. I just backed them up in the cloud because it was causing my Anki to take a few seconds to open and close and they were mostly about medicine and anatomy which I don't care about anymore (bye bye "In addition to the \{\{c4::VL::a thalamic nucleus\}\}, the \{\{c1::interposed nuclei::deep cerebellar nuclei\}\} also project to the \{\{c3::magnocellular division::red nucleus division\}\} to influence the \{\{c2::rubrospinal tract::a tract\}\}."!).

Since then, I have only added a few new notes as I gradually get back into it. For this study, I added a couple of additional test decks and notes. The following are the decks that were exported for inspection here:

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

Inspecting `sqlite_master` shows there is a `col` table, a `notes` table, a `cards` table, a `revlog` table, and a `graves` table. There are also two tables called `sqlite_stat1` and `sqlite_stat4` and 7 indexes.

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
