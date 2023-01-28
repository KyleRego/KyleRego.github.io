---
layout: post
title: Unity
categories: programming [game development] unity
permalink: /unity
emoji: 😃
mathjax: false
---

**These notes are a work in progress.**

Unity is a game development framework/engine with an editor and C# API.

# GameObjects

A GameObject is a collection of components. The Inspector pane of the Unity editor can be used to inspect, add, remove, and edit the components of GameObjects.

Prefabs are custom assets that can be used to make copies of custom objects. GameObjects that are instances of a prefab have a blue name in the Hierarchy pane.

Prefab variants are prefabs which inherit the characteristics of an existing prefab which they can then add to or override.

# The Scene view

This pane of the Unity editor allows manipulation of the GameObjects in a scene.

A scene is a collection of objects that are loaded into memory together. A typical video game may design each level as a scene as well as the main menu and loading screens. An open world game may be designed with scenes that are open to each other and load into memory as the player moves around in the world.

Gizmos are visual debugging or setup tools used in the Scene view.

The axes here show the x-axis in red, the y-axis in green, and the z-axis in blue.

## Keyboard controls

The WASD and ED keys can be used to move around in the Scene view while right clicking over it while also looking around with the mouse.

After selecting a GameObject, the F key brings the object into focus. Holding Alt allows using the mouse to look at the object from different angles with it still in focus.

After selecting a GameObject, the Y key opens the Transform gizmo.

{% include book_attribution.html
  book_title = "Hands-On Unity 2022 Game Development, Third Edition"
  book_author = "Nicolas Alejandro Borromeo"
  book_publisher = "Packt Publishing"
  book_isbn = "978-1803236919"
  book_link = "https://www.amazon.com/Hands-Unity-2022-Game-Development/dp/1803236914"
%}