---
layout: post
title:  "How to write an Anki add-on: the Anki enumeration tool"
date:   2022-11-30 20:00:00 -0500
categories: programming python pyqt anki
permalink: /anki-enumeration-tool
emoji: 😆
long_title: true
---
In the last post, we looked at the source code of the Anki magnifying glass. I also published a different add-on called the [Anki enumeration tool](https://ankiweb.net/shared/info/268751365). Personally, I think this add-on is extremely flawed, but at least one person found it useful:

![A review of the Anki enumeration tool](/assets/anki-enumeration-tool-review.png)

So it remains up on AnkiWeb. Even though I think it isn't that great, it's probably as useful an example as the last one, hence this post.

This is not meant to show code that I am proud of or is good. It is just another case study of an Anki add-on that could be useful to someone new to writing Anki add-ons. I will also explain why I think this add-on is not worth refactoring (the same functionality would be better achieved with a custom note or card type instead of an add-on).

# Case Study

Here is the source code:

{% highlight Python %}
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from aqt import mw
from aqt.utils import showInfo, tooltip
from aqt.qt import *

class OsceDialog(QDialog):

    def __init__(self, mw):
        QDialog.__init__(self)
        self.setWindowTitle("OSCE Note Creator")

        label1 = QLabel("Enter lines below, each line goes into {{ "{{c1::line"}}}} in a note")
        self.noteseditor = QPlainTextEdit()

        label2 = QLabel("Enter name of deck below")
        self.deck_taker = QLineEdit()

        label3 = QLabel("Enter name of note type below")
        self.notetype_taker = QLineEdit()

        label4 = QLabel("Press button below to make notes")
        self.button = button = QPushButton("Create notes")
        button.clicked.connect(self.makeNotes)

        label5 = QLabel("Enter title below")
        self.tag_taker = QLineEdit()

        self.layout = layout = QVBoxLayout()
        layout.addWidget(label1)
        layout.addWidget(self.noteseditor)

        layout.addWidget(label2)
        layout.addWidget(self.deck_taker)

        layout.addWidget(label3)
        layout.addWidget(self.notetype_taker)

        layout.addWidget(label5)
        layout.addWidget(self.tag_taker)

        layout.addWidget(label4)
        layout.addWidget(button)

        self.setLayout(layout)

    def makeNotes(self):
        title: str = self.tag_taker.text()

        deck_name: str = self.deck_taker.text()
        did = mw.col.decks.id(deck_name)
        mw.col.decks.select(did)
        deck = mw.col.decks.get(did)

        notetype_name: str = self.notetype_taker.text()
        notes_content: Sequence[str] = make_osce_notes(self.noteseditor.toPlainText())

        model_to_use: Union[None, NoteType] = mw.col.models.byName(notetype_name)
        if model_to_use is None:
            outstring = "model chosen was None object; note type may not exist"
            showInfo(outstring)
        model_to_use['did'] = did
        mw.col.models.save(model_to_use)

        deck['mid'] = model_to_use['id']
        mw.col.decks.save(deck)
        
        for content in notes_content:
            new_note: Note = mw.col.newNote()
            new_note.fields[0] = title + "<br>" + content
            mw.col.addNote(new_note)


osce_dialog = OsceDialog(mw)

def showoscedialog() -> None:
    osce_dialog.show()

def make_osce_notes(a: str) -> Sequence[str]:
    string_list: Sequence[str] = a.split('\n')
    out_list = []
    for line in string_list:
        important_line = line
        index_of_line = string_list.index(line)
        if index_of_line == 0:
            out_list.append(f"{1}: {{ "{{{{c1::{important_line"}}}}}}}")
        if index_of_line > 0:
            not_important_lines = string_list[:index_of_line]
            outstring = ""
            i = 1
            for notimportline in not_important_lines:
                outstring += f"{i}: {notimportline}<br>"
                i += 1
            outstring += f"{i}: {{ "{{{{c1::{important_line"}}}}}}}"
            out_list.append(outstring)

    return out_list

action = QAction()
action.setText("OSCE Notes Maker")
mw.form.menuTools.addAction(action)
action.triggered.connect(showoscedialog)
{% endhighlight %}

## What does this add-on do?

"OSCE Notes Maker" is added to the Tools:

![Anki tools menu with the enumeration tool](/assets/anki-enumeration-tool-button.png)

OSCE means objective structured clinical examination. This is where an actor pretends to be a patient so that a medical student can practice taking a history, performing a physical examination, and exercising medical decision-making against the patient's presentation. 

I made this add-on to help myself remember all of the things I was supposed to be doing in OSCEs during my year in medical school. It carried its weight for me when I had to remember 30+ steps involved in testing the 12 cranial nerves.

Here is what you get by clicking the button (except the fields would all be empty--I have filled them out here):

![The special enumeration note-making window](/assets/anki-osce-notes-maker-filled-out.png)

There is no deck called Temporary, but there is a note type called Basic. Clicking the Create Notes button creates a Temporary deck and makes three notes:

![The enumeration notes made by the add-on](/assets/anki-enumeration-notes.png)

The Basic note type isn't a cloze deletion type so these notes won't work, but the more serious problem is that the information is repeated over three notes. Each of the three notes creates one card. What you actually want is one note creating three cards--this is the biggest flaw with this add-on. 

Because the Anki data structure is not being used correctly, if you make an enumeration with N steps, you have N notes each with N steps instead of 1 note with N steps. In the worst-case scenario, if you wanted to edit all N steps, you have to edit N steps for N notes. The number of edits you have to make to change an enumeration grows quadratically with the size of the enumeration rather than linearly.

It's [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) being violated by Anki notes.  Even with bulk note editing, the Anki notes made by this add-on are hard to maintain. You could probably get the same functionality as this add-on without this problem by creating a custom note type or card type for enumerations.

## Registering the action

Just like with the magnifying glass, we make an action, add it to the Tools, and connect it to a function:

{% highlight Python %}
action = QAction()
action.setText("OSCE Notes Maker")
mw.form.menuTools.addAction(action)
action.triggered.connect(showoscedialog)
{% endhighlight %}

## showoscedialog

I really should have given this function a better name (oops).

{% highlight Python %}
osce_dialog = OsceDialog(mw)

def showoscedialog() -> None:
    osce_dialog.show()
{% endhighlight %}

This makes an instance of the `OsceDialog` class--the superclass of `OsceDialog` is `QDialog`, which is another Qt class which inherits from `QWidget`, which is where `show` comes from. This method just causes the widget, and any of its child widgets, to be shown.

## OsceDialog

This class represents the enumeration note-making window.

{% highlight Python %}
class OsceDialog(QDialog):
{% endhighlight %}

This starts the class definition, names the class `OsceDialog`, and makes it a child class of `QDialog`.

{% highlight Python %}
def __init__(self, mw):
{% endhighlight %}

This is the constructor method--when instantiating an object from this class, this method is called to set up the object.

{% highlight Python %}
QDialog.__init__(self)
{% endhighlight %}

The first thing the constructor does is call the constructor of the parent class which is necessary to set up the object correctly.

{% highlight Python %}
self.setWindowTitle("OSCE Note Creator")
{% endhighlight %}

This sets the title of the window. It's similar to the `<title>` element in HTML. `self` is the object we are constructing. In general `self` is a reference to the current instance of the class. 

{% highlight Python %}
label1 = QLabel("Enter lines below, each line goes into  in a note")
{% endhighlight %}

This makes the first label.

{% highlight Python %}
self.noteseditor = QPlainTextEdit()
{% endhighlight %}

This instantiates an instance of the `QPlainTextEdit` class and creates an attribute of the object we are making, `noteseditor`, which references it. This becomes the multiline text field where we enter the steps of the enumeration.

{% highlight Python %}
label2 = QLabel("Enter name of deck below")
self.deck_taker = QLineEdit()

label3 = QLabel("Enter name of note type below")
self.notetype_taker = QLineEdit()
{% endhighlight %}

Here we have a couple more labels, a couple more attributes, and a couple instances of the `QLineEdit` class which is for a single line text field.

{% highlight Python %}
label4 = QLabel("Press button below to make notes")
self.button = button = QPushButton("Create notes")
button.clicked.connect(self.makeNotes)
{% endhighlight %}

This makes the button and specifies that clicking it will trigger the `makeNotes` method of the object we are constructing.

{% highlight Python %}
label5 = QLabel("Enter title below")
self.tag_taker = QLineEdit()
{% endhighlight %}

This is very similar to what we already saw.

{% highlight Python %}
self.layout = layout = QVBoxLayout()
{% endhighlight %}

Here we are giving the object a `layout` attribute which is an instance of `QVBoxLayout`, a Qt class which is used to line up widgets vertically.

{% highlight Python %}
layout.addWidget(label1)
layout.addWidget(self.noteseditor)

layout.addWidget(label2)
layout.addWidget(self.deck_taker)

layout.addWidget(label3)
layout.addWidget(self.notetype_taker)

layout.addWidget(label5)
layout.addWidget(self.tag_taker)

layout.addWidget(label4)
layout.addWidget(button)
{% endhighlight %}

This adds all those text edit fields and the button to the layout.

{% highlight Python %}
self.setLayout(layout)
{% endhighlight %}

The `setLayout` method comes from `QWidget` and takes an argument of type `QLayout`. `QLayout` is inherited by `QBoxLayout`, which is inherited by `QVBoxLayout`, so this works. The argument becomes the layout manager for the receiver of the method.

## makeNotes

{% highlight Python %}
def makeNotes(self):
{% endhighlight %}

We saw above that this method will be called when clicking the button.

{% highlight Python %}
title: str = self.tag_taker.text()

deck_name: str = self.deck_taker.text()
{% endhighlight %}

This just grabs the text inputs entered into those text fields and assigns them to some variables.

{% highlight Python %}
did = mw.col.decks.id(deck_name)
{% endhighlight %}

With this we are starting to get out of the Qt stuff and into the Anki data structure. `mw` is the Anki main window object, an instance of `AnkiQt`. `mw.col` is the `Collection` object--the official Anki add-on writing documentation has a lot to say about this. We can access this object's `decks` attribute which is an instance of the `DeckManager` class. This has a method `id` which, as we see here, can take a deck name string argument and return the id of that deck.

{% highlight Python %}
mw.col.decks.select(did)
{% endhighlight %}

This finds a deck by id and sets that to be the current deck.

{% highlight Python %}
deck = mw.col.decks.get(did)
{% endhighlight %}

Now we have the current deck assigned to a variable. I think this object is an instance of `DeckDict`. 

{% highlight Python %}
notetype_name: str = self.notetype_taker.text()
{% endhighlight %}

Just like how we got the deck name from the input, here we get the note type name.

{% highlight Python %}
notes_content: Sequence[str] = make_osce_notes(self.noteseditor.toPlainText())
{% endhighlight %}

This is where the input from the multiline text field gets converted to the contents of the notes--we will look at the `make_osce_notes` function later.

{% highlight Python %}
model_to_use: Union[None, NoteType] = mw.col.models.byName(notetype_name)
{% endhighlight %}

Like how we were able to chain a couple method calls to the `Collection` object to get to a deck id or a deck, here we able to get the model with a certain name. In the Anki source, model is another term for note type. If there is no model with the given name then it will return `None`. 

{% highlight Python %}
if model_to_use is None:
    outstring = "model chosen was None object; note type may not exist"
    showInfo(outstring)
{% endhighlight %}

The `showInfo` function is a nice helper that does this:

![The output of the showInfo function](/assets/anki-enumeration-tool-model-not-found-info.png)

Despite providing this somewhat cryptic message to the user, we don't handle this case gracefully. The very next line of the function will throw an error if `model_to_use` is `None` (oops).

{% highlight Python %}
model_to_use['did'] = did
mw.col.models.save(model_to_use)
{% endhighlight %}

This sets the deck id of the note type and persists the update to the database.

{% highlight Python %}
deck['mid'] = model_to_use['id']
mw.col.decks.save(deck)
{% endhighlight %}

I had to also set the model id of the deck to be the model's id.

I think this was probably necessary due to the default way Anki decides what model to use and what deck to put new notes in. It may be that the model used is determined by the current model of the selected deck and the deck that notes are added to is determined by the last deck used by the model.

{% highlight Python %}
for content in notes_content:
    new_note: Note = mw.col.newNote()
    new_note.fields[0] = title + "<br>" + content
    mw.col.addNote(new_note)
{% endhighlight %}

This is where the notes are made. Note how we don't specify here what model to use for the new note or what deck to put it in. The `<br>` is the [line break HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br)--it prevents the title and first line of the content from being on the same line.

Reading the source, it looks like `newNote` is deprecated and `new_note` (a method called `new_note`--not the variable I called `new_note` above) should be used instead. Both are methods of `Collection` but it looks like `new_note` takes the model to use as an argument instead of just defaulting to the current model of the selected deck.

## make_osce_notes

The details of this function aren't important. It takes an input like `"1\n2\n3"` and returns a Python list like {% raw %}`["1: {{c1::1}}", "1: 1<br>2: {{c2::2}}", 1: 1<br>2: 2<br>3: {{c1::3}}"]`{% endraw %} which becomes the `notes_content` in `makeNotes`. The `a` parameter should have a better name (oops).

{% highlight Python %}
def make_osce_notes(a: str) -> Sequence[str]:
    string_list: Sequence[str] = a.split('\n')
    out_list = []
    for line in string_list:
        important_line = line
        index_of_line = string_list.index(line)
        if index_of_line == 0:
            out_list.append(f"{1}: {{ "{{{{c1::{important_line"}}}}}}}")
        if index_of_line > 0:
            not_important_lines = string_list[:index_of_line]
            outstring = ""
            i = 1
            for notimportline in not_important_lines:
                outstring += f"{i}: {notimportline}<br>"
                i += 1
            outstring += f"{i}: {{ "{{{{c1::{important_line"}}}}}}}"
            out_list.append(outstring)

    return out_list
{% endhighlight %}

And once again, that's all I really have to say about this add-on. Hopefully this example will help you understand the tools which are at your disposal to write your own Anki add-on. I'm also not a Pythonista, so if I wrote something that is incorrect, please let me know. A pull request to improve the article would also be very welcome.
