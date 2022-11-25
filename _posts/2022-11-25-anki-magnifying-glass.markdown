---
layout: post
title:  "How to write an Anki add-on: the Anki magnifying glass mouse cursor"
date:   2022-11-25 13:30:00 -0500
categories: programming python pyqt anki
permalink: /anki-magnifying-glass-mouse-cursor
emoji: 😇
long_title: true
---
If you're a power user of Anki and have an add-on idea, you can probably make it even if you have minimal programming experience. This is a case study of a very simple add-on I wrote a few years ago when I was in medical school. I am hoping it may provide a helpful example to someone interested in writing their own Anki add-on. Before the case study, I want to give some background on what to study in order to write Anki add-ons in general.

# Background

There are two topics to familiarize yourself with to write an Anki add-on: Python and PyQt. Python is one of the most popular programming languages and a very good one for people who want to get things done quickly. Qt (pronounced "cute") is a C++ library for creating cross-platform graphical user interfaces. PyQt lets you use Qt through Python.

For Python, I recommend [Python Crash Course, 2nd Edition](https://www.amazon.com/Python-Crash-Course-2nd-Edition/dp/1593279280). The first 200 pages or so teach Python and are all you really need to read. The rest of the book is about completing projects which could be a fun time if you find yourself enjoying Python.

For PyQt, I did consult [Create GUI Applications with Python & PyQt5](https://leanpub.com/create-simple-gui-applications). I recommend reading this once you have identified you need a deeper understanding of PyQt to make progress on your add-on.

You will also have to refer to the official documentation. Unfortunately, I found that the PyQt docs were somewhat incomplete compared to the Qt documentation. Eventually I was only reading the Qt docs. Since Qt is a C++ library and not Python, it takes some time to understand how to read its documentation to understand PyQt.

I also recommend checking out [Anki Scripting For Non-programmers](https://www.juliensobczak.com/write/2020/12/26/anki-scripting-for-non-programmers.html). This is a really good article about writing Python scripts that create Anki flashcards. 

The last resource is the [official documentation about writing Anki add-ons](https://addon-docs.ankiweb.net/). This has the most up-to-date information about what you need to do and you're probably going to be reading this a lot as you write your add-on.

# Case Study

Let's take a look at the source code of the [Anki magnifying glass mouse cursor with crosshairs](https://ankiweb.net/shared/info/129808160). If you install this add-on in the usual way, you can navigate to the source code through Anki. From the Add-ons widget just select the add-on and click the View Files button. Here is the `__init__.py` file:

{% highlight Python %}
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from aqt import mw
from aqt.qt import *

config = mw.addonManager.getConfig(__name__)
zoomwidth = zoomheight = config["larger square side (pixels)"]
width = height = config["smaller square side (pixels)"]
unitless_time_constant = 10 # config["Time (unitless)"]

def turn_on_zoom_mouse() -> None:
    i = 0
    while i < unitless_time_constant:
        parent: AnkiQt = mw
        point1: QPoint = QCursor.pos()
        point2: QPoint = parent.mapFromGlobal(point1)
        size = QSize(width, height)
        rectangle  = QRect(point2, size)
        rectangle.moveCenter(point2)
        pixmap1: QPixmap = parent.grab(rectangle)

        painter = QPainter(pixmap1)
        midx, midy = width/2, height/2
        painter.drawLine(midx, midy-5, midx, midy+5)
        painter.drawLine(midx-5, midy, midx+5, midy)
        painter.end()

        pixmap3 = pixmap1.scaled(zoomwidth, zoomheight)
        newcursor = QCursor(pixmap3)
        mw.app.setOverrideCursor(newcursor)
        i += 1


def reset_cursor() -> None:
    k = 0
    while k < 10000:
        mw.app.restoreOverrideCursor()
        k += 1

action = QAction("Zoom Mouse", mw)
action.setShortcut("Alt+C")
action.triggered.connect(turn_on_zoom_mouse)
mw.form.menuTools.addAction(action)

action = QAction("Zoom Mouse", mw)
action.setShortcut("Alt+X")
action.triggered.connect(reset_cursor)
mw.form.menuTools.addAction(action)
{% endhighlight %}

There is also a `config.json` file:

{% highlight json %}
{"larger square side (pixels)": 400, 
"smaller square side (pixels)": 200, 
"Time (unitless)": 100}
{% endhighlight %}

You can edit these values from inside the Add-ons widget in Anki by clicking the Config button on the right.

## What does this add-on do?

This add-on adds two keyboard shortcuts to Anki:

- Alt + C:
  - The following happens 10 times:
    - A pixel map is made from a small square of the Anki window centered at the instantaneous position of the mouse cursor.
    - A small + is drawn onto the center of this pixel map (the crosshairs).
    - A second pixel map is made by enlarging the first pixel map.
    - The mouse cursor on the screen, and inside the Anki window, becomes the second pixel map.
- Alt + X
  - The mouse cursor is reverted to whatever it was previously, 10,000 times, which usually returns it to the default.

By holding Alt + C, the mouse cursor will always be showing a magnified picture of the screen at the mouse cursor position.

## Reading config.json

{% highlight Python %}
config = mw.addonManager.getConfig(__name__)
zoomwidth = zoomheight = config["larger square side (pixels)"]
width = height = config["smaller square side (pixels)"]
unitless_time_constant = 10 # config["Time (unitless)"]
{% endhighlight %}

This is generally how Anki add-ons can read in values from a configuration file. The third value from the config file is apparently ignored (oops).

## Registering the actions

{% highlight Python %}
action = QAction("Zoom Mouse", mw)
action.setShortcut("Alt+C")
action.triggered.connect(turn_on_zoom_mouse)
mw.form.menuTools.addAction(action)
{% endhighlight %}

The `QAction` class represents an abstraction for user commands. In the snippet above we are instantiating one with some descriptive text and a parent object, which in this case is the Anki main window object.

Then we do three things: 
- We specify that this action should be triggered with the keyboard shortcut Alt + C.
- We specify that the `turn_on_zoom_mouse` function should run when the action is triggered.
- We add this action so that it can be triggered from the menu tools.

![Anki tools menu with some added actions](/assets/anki-zoom-mouse-buttons.png)

You wouldn't ever use these buttons, but they are a nice reminder of what the keyboard shortcuts are. I probably should have given them different descriptions though (oops).

## turn_on_zoom_mouse

The important part of this function is the body of the `while` loop. We'll look at it line by line.

{% highlight Python %}
parent: AnkiQt = mw
{% endhighlight %}

This just makes a variable `parent` also pointing to the Anki main window object. `mw` is in scope inside the function even though it wasn't passed as an argument due to the scoping rules of Python. Having two variables referencing this object was probably unnecessary (oops).

{% highlight Python %}
point1: QPoint = QCursor.pos()
point2: QPoint = parent.mapFromGlobal(point1)
{% endhighlight %}

This is a good time to talk about how to read the Qt documentation. Take a look at [QCursor::pos()](https://doc.qt.io/qt-6/qcursor.html#pos). Here are the relevant bits:

> QPoint QCursor::pos()

> Returns the position of the cursor (hot spot) of the primary screen in global screen coordinates.

`::` in the Qt documentation means `.` in Python. This is a static method which means its called on the class itself, not an instance of the class. The class on the left is the type of the returned value.

The documentation also notes this:

> You can call QWidget::mapFromGlobal() to translate it to widget coordinates.

This one is not a static method, so we call it on `parent`, which references the Anki main window object. `QWidget` is inherited by a lot of other classes in Qt, including `QMainWindow`, which is the parent class of `AnkiQt`. Therefore `AnkiQt` inherits this method from `QWidget`.

This method is also overloaded, which means we can pass it different combinations of arguments. It will determine the correct implementation of the method to use from the types of the arguments you pass it. A lot of the Qt methods are like this.

Comparing the Python methods to their Qt documentation will help a lot in order to understand the Qt documentation for methods you don't have Python examples of. 

Moving on:

{% highlight Python %}
size = QSize(width, height)
rectangle  = QRect(point2, size)
rectangle.moveCenter(point2)
{% endhighlight %}

Here we make a rectangle, which is represented by a top-left corner and a size. Instead of calculating what the top-left corner of a rectangle centered at the point should be, we make a rectangle with its top-left coordinate at that point and then move the rectangle such that the point becomes its center.

{% highlight Python %}
pixmap1: QPixmap = parent.grab(rectangle)
{% endhighlight %}

This makes an object which represents a map of the pixels on the screen specified by the rectangle we made.

{% highlight Python %}
painter = QPainter(pixmap1)
midx, midy = width/2, height/2
painter.drawLine(midx, midy-5, midx, midy+5)
painter.drawLine(midx-5, midy, midx+5, midy)
painter.end()
{% endhighlight %}

This draws the crosshairs. Notice how the constructor for the `QPainter` object takes the pixel map as an argument. Since the coordinate system assumes a top-left corner, the positive-y direction is down. `width` and `height` are the width and height of the square so dividing them by 2 gives the center coordinates of the square. All we have to do is draw short horizontal and vertical lines through that point to make the crosshairs.

{% highlight Python %}
pixmap3 = pixmap1.scaled(zoomwidth, zoomheight)
{% endhighlight %}

This makes a pixel map which is just an enlarged version of the first one.

{% highlight Python %}
newcursor = QCursor(pixmap3)
mw.app.setOverrideCursor(newcursor)
{% endhighlight %}

This makes a mouse cursor where the image of it is our pixel map, and then sets the "application override cursor" to be this cursor.

## reset_cursor

The interesting part of this function is this:

{% highlight Python %}
mw.app.restoreOverrideCursor()
{% endhighlight %}

We call this 10,000 times when the function is called. From reading the Qt documentation, the cursors are stored on a stack. (This data structure is like a stack of books on a table--you can put a book on top, and you can take the top book off.) `setOverrideCursor` pushes a cursor onto the stack, and `restoreOverrideCursor` pops the active one off. 

Every call to `turn_on_zoom_mouse` will push 10 new cursors onto the stack, and this function is called continuously while Alt + C is held, so we just go ahead and pop off 10,000 cursors for every Alt + X.

And that's all I really have to say about this add-on. Hopefully this example will help you understand the tools which are at your disposal to write your own Anki add-on.