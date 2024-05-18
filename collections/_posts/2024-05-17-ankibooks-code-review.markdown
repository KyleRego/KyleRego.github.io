---
layout: post
title: "Anki Books code review"
date: 2024-05-17 00:00:00 -0500
categories: blogging
permalink: /ankibooks-codereview-1
emoji: 🫡
mathjax: false
---

I wrote this, I accidentally deleted the file which had not been git added yet, and here I am writing it again. Anki Books has a design following clean architecture. There is an application core project, an infrastructure project, a server web app project, a client app project, and three test projects. WebApp has controllers and a pretty RESTful API. Infrastructure has a repository layer that all database access is done through. WebApp.Client has the Razor components that will be rendered interactively on the client with the Blazor WebAssembly runtime following download with prerendering, and is the project lacking a test project. Any Razor components in WebApp cannot use client-side rendering. The Migrations folder in Infrastructure is migrations code that is scaffolded with dotnet-ef. The server WebApp Program.cs currently executes the migrations automatically and creates the git ignored SQLite database for easy development. To run it for local development, have the .NET 8 SDK installed which includes the runtime and `dotnet run` in WebApp.

![SVG Diagram representation of Anki Books (.NET version)](assets/ankibooks-diagram-5-17-2024.svg)