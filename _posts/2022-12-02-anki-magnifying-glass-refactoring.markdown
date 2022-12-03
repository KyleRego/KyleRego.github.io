---
layout: post
title:  "How to write an Anki add-on: the Anki magnifying glass mouse cursor v2"
date:   2022-12-02 19:30:00 -0500
categories: programming python pyqt anki
permalink: /anki-magnifying-glass-mouse-cursor-v2
emoji: 😊
long_title: true
---
There has been a feature requested for the Anki magnifying glass mouse cursor a few times. That feature is for the zoom mouse to reset automatically when Alt + C is lifted, instead of having to additionally use Alt + X. In this post, we are going to look at the source code of the add-on in progress of, and after implementing this feature. The changes are significant enough to provide a third case study of Anki add-on programming.

# Case Study

Here is the original `__init__.py` source and `config.json` file:

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

{% highlight json %}
{"larger square side (pixels)": 400, 
"smaller square side (pixels)": 200, 
"Time (unitless)": 100}
{% endhighlight %}

First let's get rid of the unused configuration value. Here is the new config file:

{% highlight json %}
{
"larger square side (pixels)": 400, 
"smaller square side (pixels)": 200
}
{% endhighlight %}

My first attempt at refactoring was to use a class called `AnkiMagnifyingGlassMouseCursor` with attributes to track if the zoom mouse was on or off, the last time that the zoom mouse was triggered, and how many `QCursor` objects have been pushed on the stack. I was hoping to just have the zoom mouse turn off after a certain amount of time passed since the last time the keyboard shortcut was triggered. Keeping track of how many cursors are on the stack allows popping off the exact number that we need to in order to return to the normal mouse cursor.

That lead to this code:

{% highlight Python %}
class AnkiMagnifyingGlassMouseCursor():
    def __init__(self):
    	self.zoom_mouse_on = False
    	self.last_time_triggered = None
        self.cursors_on_stack = 0
    
    def handle_zoom_mouse_shortcut(self):
        self.last_time_triggered = time.time()
        if (not self.zoom_mouse_on):
            self.start_zoom_mouse()
    
    def start_zoom_mouse(self):
        self.zoom_mouse_on = True
        while (time.time() - self.last_time_triggered) < 0.2:
            self.persist_zoom_mouse()
        self.reset_zoom_mouse()

    def persist_zoom_mouse(self):
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
        self.cursors_on_stack += 10

    def reset_zoom_mouse(self):
        k = 0
        while k < self.cursors_on_stack:
            mw.app.restoreOverrideCursor()
            k += 1
        self.cursors_on_stack = 0
        self.zoom_mouse_on = False
{% endhighlight %}

We had to pull in the [`time` module](https://docs.python.org/3/library/time.html#module-time) from the Python standard library to get the `time.time()` method. This method returns the number of seconds since 1970 as a floating point number.

This is almost acceptable but the problem is `start_zoom_mouse` reaches `reset_zoom_mouse` even if Alt + C is being held down. This happens because the flow of execution does not allow the `last_time_triggered` to be updated. The zoom mouse keeps turning off and on while Alt + C is activated. This was a bit of a rookie mistake to try to be honest, but in my defense, it didn't take long to whip up.

After some research and trying out some other stuff, I found that using the `QTimer` class was a fairly straightforward approach. Here is the final version of `__init__.py` after using that in the implementation and doing some other refactoring:

{% highlight Python %}
from aqt import mw
from aqt.qt import *

config = mw.addonManager.getConfig(__name__)
zoomwidth = zoomheight = config["larger square side length (pixels)"]
width = height = config["smaller square side length (pixels)"]
pos_x_crosshair = config["positive-x crosshair length (pixels)"]
neg_x_crosshair = config["negative-x crosshair length (pixels)"]
pos_y_crosshair = config["positive-y crosshair length (pixels)"]
neg_y_crosshair = config["negative-y crosshair length (pixels)"]
timeout_interval = config["delay to turn off zoom mouse (milliseconds)"]

cursors_pushed_to_stack_per_shortcut = 10

class AnkiMagnifyingGlassMouseCursor():
    def __init__(self):
        self.timer = QTimer(mw)
        self.timer.setSingleShot(True)
        self.timer.timeout.connect(self.reset_zoom_mouse)
        self.cursors_on_stack = 0

    def handle_zoom_mouse_shortcut(self):
        self.persist_zoom_mouse()
        self.timer.start(timeout_interval)

    def persist_zoom_mouse(self):
        i = 0
        while i < cursors_pushed_to_stack_per_shortcut:
            parent: AnkiQt = mw
            point1: QPoint = QCursor.pos()
            point2: QPoint = parent.mapFromGlobal(point1)
            size = QSize(width, height)
            rectangle = QRect(point2, size)
            rectangle.moveCenter(point2)
            pixmap1: QPixmap = parent.grab(rectangle)

            painter = QPainter(pixmap1)
            midx, midy = width/2, height/2
            painter.drawLine(midx, midy-pos_y_crosshair, midx, midy+neg_y_crosshair)
            painter.drawLine(midx-neg_x_crosshair, midy, midx+pos_x_crosshair, midy)
            painter.end()

            pixmap3 = pixmap1.scaled(zoomwidth, zoomheight)
            newcursor = QCursor(pixmap3)
            mw.app.setOverrideCursor(newcursor)
            i += 1
        self.cursors_on_stack += cursors_pushed_to_stack_per_shortcut

    def reset_zoom_mouse(self):
        while self.cursors_on_stack > 0:
            mw.app.restoreOverrideCursor()
            self.cursors_on_stack -= 1

anki_magnifying_glass_mouse_cursor = AnkiMagnifyingGlassMouseCursor()

action = QAction("Zoom Mouse", mw)
action.setShortcut("Alt+C")
action.triggered.connect(anki_magnifying_glass_mouse_cursor.handle_zoom_mouse_shortcut)
mw.form.menuTools.addAction(action)

{% endhighlight %}

We also have a new `config.json`:

{% highlight json %}
{
"larger square side length (pixels)": 400, 
"smaller square side length (pixels)": 200,
"positive-x crosshair length (pixels)": 5,
"negative-x crosshair length (pixels)": 5,
"positive-y crosshair length (pixels)": 5,
"negative-y crosshair length (pixels)": 5,
"delay to turn off zoom mouse (milliseconds)": 500
}
{% endhighlight %}

If you are testing this add-on and notice that the cursor resets once while holding Alt + C and then stays on afterwards, this may be because of a keyboard shortcut repeat delay, which you can change in your operating system settings.

`QTimer` is a Qt class that emits a signal every `interval` milliseconds. The documentation refers to the `QTimer` emitting this signal as timing out. 

{% highlight Python %}
def __init__(self):
    self.timer = QTimer(mw)
    self.timer.setSingleShot(True)
    self.timer.timeout.connect(self.reset_zoom_mouse)
    self.cursors_on_stack = 0
{% endhighlight %}

In the constructor, we add a `timer` attribute, an object instantiated from the `QTimer` class, to the `AnkiMagnifyingGlassMouseCursor` object. The argument to the constructor, `mw`, becomes the parent of the `QTimer`. This wasn't necessary but may help Qt manage memory. The `setSingleShot` method sets an attribute of the `QTimer` object that indicates it should only time out once.

{% highlight Python %}
self.timer.timeout.connect(self.reset_zoom_mouse)
{% endhighlight %}

This specifies that the `reset_zoom_mouse` function should run when the timer emits the signal. Therefore, when the timer times out, the zoom mouse will be reset.

{% highlight Python %}
def handle_zoom_mouse_shortcut(self):
    self.timer.start(timeout_interval)
    self.persist_zoom_mouse()
{% endhighlight %}

The trick that makes this work is that calling `start` on a timer that is already on stops it and restarts it. Every trigger of Alt + C causes the `persist_zoom_mouse` method to be called and also resets the timer that triggers `reset_zoom_mouse`. Now we only need to remember one keyboard shortcut: Alt + C to "see" small details.

The [magic numbers](https://en.wikipedia.org/wiki/Magic_number_(programming)) that we had before are now less magical and can changed from the add-on configuration, except for the number of cursors pushed onto the stack per keyboard shortcut. I also noticed `k` was not necessary in `reset_zoom_mouse` since we could just decrement `cursors_on_stack` until it is 0. Another thing we could do is extract the details of constructing the `timer` object to a constructor method of an additional class, but I don't think that's too important.

I hope this provides another helpful example. This will be the last Anki add-on case study from me, at least for a while. Cheers, and remember if you are stuck writing your add-on, take a step back and sleep on it. When you work on it again, consider it an opportunity to learn.