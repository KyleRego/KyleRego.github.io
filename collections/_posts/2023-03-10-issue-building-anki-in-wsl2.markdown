---
layout: post
title: "Issue building Anki in WSL2"
date: 2023-10-03 3:30:00 -0500
categories: programming ruby
permalink: /issue-building-anki-in-wsl2
emoji: 👻
mathjax: false
---

I had the following error trying to build and run Anki from source following the instructions in `development.md` and `linux.md` using WSL2 with Ubuntu (using the `./run` script after installing the recommended system dependencies):

```
qt warning: could not connect to display
qt info: could not load the qt platform plugin "xcb" in "" even though it was found.
qt fatal: this application failed to start because no qt platform plugin could be initialized. reinstalling the application may fix this problem.
```

I had this a few weeks ago trying to build Anki but couldn't quite work out the solution then. There are a lot of threads about the same error but for different things and usually it involved installing missing packages.

Eventually what got it working for me was to follow the [Microsoft documentation on running GUI apps in WSL2](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps). Thinking about it, I use WSL2 a lot but the only app I use that has a GUI and WSL2 is VS Code (maybe Docker Desktop too). I think this is a special case though because VS Code involves the Remote-WSL extension which is different. After following the instructions in that documentation (a few simple steps of installing the GPU driver, updating WSL2, and doing a `sudo apt update`), the `./run` did run Anki and I did not see the above Qt problems. I did see this stack trace that I had also seen before with the QT problem output though:

```
  File "/path_to_anki/anki/tools/run.py", line 12, in <module>
    aqt.run()
  File "/path_to_anki/anki/qt/aqt/__init__.py", line 503, in run
    _run()
  File "/path_to_anki/anki/qt/aqt/__init__.py", line 577, in _run
    pmLoadResult = pm.setupMeta()
  File "/path_to_anki/anki/qt/aqt/profiles.py", line 139, in setupMeta
    res = self._loadMeta()
  File "/path_to_anki/anki/qt/aqt/profiles.py", line 421, in _loadMeta
    traceback.print_stack()
resetting corrupt _global
```

But when I closed Anki and invoked `./run` a second time, I didn't see the stack trace again.
