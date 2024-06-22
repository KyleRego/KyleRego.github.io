---
layout: post
title: "Ending thoughts on Blazor (for now)"
date: 2024-06-13 00:00:00 -0500
categories: blogging
permalink: /ending-thoughts-on-blazor
emoji: 🫥
mathjax: false
---

My effort at developing my Blazor app, .NET Anki Books has fizzled out. The development direction seemed to go toward it being its own spaced repetition app (instead of creating an Anki package file to import the flashcards into Anki like the Rails Anki Books, the .NET version had studying the flashcards with spaced repetition built in). A couple drawbacks of a Blazor Web App for this kind of app made me stop development:

- Card templates that allow user input of HTML, CSS, and JS was not something I was comfortable with trying for security reasons
- Storing notes on the server first did not seem right for a note-taking app; it would be better to store notes on the client first so that the user fully owns their data

If I were to continue the project with Blazor, I would probably look into developing it as a Blazor Hybrid app and renaming the project to something else.

# Ending thoughts on Blazor

My app was a Blazor Web App that used mostly client-side rendering, prerendering, and static rendering for ASP.NET Core Identity components.

## UI development

Developing the UI with Razor components was good and bad. I felt that it was easy to develop the UI but the experience of doing so was not the best. VS code support for Razor components didn't work that well a lot of the time. I wasted a lot of time trying to make incorrect warnings go away, usually due to it not being able to resolve namespaces, even though the UI code was not that big. Slow build times, lack of hot reload made the development loop not as fast as what I would expect developing a JavaScript SPA.

## JavaScript interop

The thing with interop is the Blazor app/runtime maintains a representation of the DOM, and if JS changes the DOM, the Blazor representation can become inconsistent with what the DOM really is. I was able to use the HTML `<modal>` element though and it didn't seem to have any problems.