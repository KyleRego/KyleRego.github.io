---
layout: post
title: "Blazor Anki Books (failed Clean Architecture effort)"
date: 2024-05-17 00:00:00 -0500
categories: blogging
permalink: /ankibooks-codereview-1
emoji: 🫡
mathjax: false
---

Blazor Anki Books has a design following the idea of clean architecture as I understood it when I developed this project, partly from Uncle Bob's book "Clean Architecture" and stack overflow answers where I pieced together the dependency injection design. Blazor Anki Books is a Blazor web app using HTML rendering from both the server and client. There is an application core project, an infrastructure project, a server web app project, a client app project, and three test projects. WebApp has controllers and a REST API. Infrastructure has a repository implementation that all database access is done through. The Migrations folder in Infrastructure is migrations code that is scaffolded with dotnet-ef. WebApp.Client has the Razor components that will be rendered interactively on the client (with the Blazor WebAssembly runtime), and is the project lacking a test project. Any Razor components in WebApp cannot use client-side rendering.

![SVG Diagram representation of Anki Books (.NET version)](assets/ankibooks-diagram-5-17-2024.svg)