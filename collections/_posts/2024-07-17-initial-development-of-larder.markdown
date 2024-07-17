---
layout: post
title: "A change of direction"
date: 2024-07-17 00:00:00 -0500
categories: blogging
permalink: /general-update
emoji: 🤔
mathjax: false
---

As I move on from one project to the next, this post is to note some thoughts.

# No more Windows Subsystem for Linux

For a while now the amount of storage on my Windows 11 laptop (237Gb) has been a pain when trying to install things like Visual Studio, .NET development workloads, and Unity. Since I have an Ubuntu desktop that I can use if needed, I decided to uninstall WSL2/Ubuntu, which was using over 100Gb of storage. No longer will I have to follow [these steps](https://github.com/microsoft/WSL/issues/4699#issuecomment-627133168) to get a few Gb of disk space back from WSL2. So in the future if I want to try Unity again or something like .NET MAUI development, it should be a much smoother experience.

## Jekyll on Windows

Related to the above, I installed Ruby on Windows for the first time. Installing Ruby with [RubyInstaller](https://rubyinstaller.org/) worked well, the only issue I really ran into so far was during the `bundle install` of this Jekyll site, installation of the `wdm` gem threw an error, however I found a solution for that [here](https://stackoverflow.com/questions/78681618/getting-error-while-installing-wdm-0-1-1-with-rubygems-on-windows-11). Having done this, I am now able to write this blog post.

# Moving on from developing Anki Books

I think it was definitely a mistake to develop two apps both called Anki Books. While the second was meant to be a rewrite, the development direction and UI design went a different way, so I wouldn't really call it a rewrite anymore. The Anki Books that I worked on recently was a .NET 8 Blazor Web App. The previous Anki Books was a Ruby on Rails 7 app, and is the one more deserving of the name Anki Books.

Based on the experience I had had with developing UI features in the Ruby on Rails Anki Books, like creating a note at any position in the article which would be inserted with Turbo (as a Turbo frame), and reordering notes in the article with the HTML drag and drop API and Stimulus, I felt developing the UI as a single page application like a React app would be easier and pay off in the long run. Since .NET was what I had experience with other than Ruby, ASP.NET Core for the web API was the obvious choice, and I wanted to get more experience with it (I had been using Ruby for a lot longer). For the UI, I considered both React and Blazor, and I ended up going with Blazor, as using C# for both the front and back end seemed like a great advantage.

The really fundamental way that the .NET version diverged from the Ruby version was this. The Ruby version created an Anki package file of flashcards that imported into Anki. So the notes were taken in Anki Books as articles with flashcards, and then the flashcards were imported into Anki for study with spaced repetition. With the .NET Anki Books, I implemented simple spaced repetition in the app itself. This was just so I could use the app more without having to tackle implementing the file export, since the priority was figuring out the UI. This difference made the app feel more like an alternative to Anki, rather than something integrating with it. That wasn't really what I set out to do, and if that was what I wanted to do, I think that developing it as a web app was the wrong choice of architecture.

# Next project: Larder

After a few weeks of just solving LeetCode problems, I started working on a practice project called Larder, which is a React app with an ASP.NET Core web API. Using React instead of Blazor for the SPA has lead me to two relevations: using data transfer objects to define the API instead of using the entity types, and having a service layer between the controller and repository layer. I'll probably expand on what I mean in another blog post.
