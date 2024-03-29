---
layout: post
title: "Initial thoughts on Blazor"
date: 2024-03-29 08:15:00 -0500
categories: blogging
permalink: /initial-thoughts-on-blazor
emoji: 🫡
mathjax: false
---

I've been using Blazor for a bit now, it's good so far I guess. I started with an ASP.NET Core web API and standalone Blazor WebAssembly app and it was pretty good except for the seconds of loading every time it downloads the (enormous) Blazor WebAssembly runtime to the web browser that renders the HTML client-side. Then I read more about the Blazor hosting models and the render modes after being reminded from this [free architecture book](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/choose-between-traditional-web-and-single-page-apps) that slow response time is bad for search engine optimization. I refactored my app quite a bit working through the render modes, refactoring the code of the original projects into projects from the `blazor` template (the standalone WebAssembly app was from the `blazorwasm` template) and testing a lot of combinations of stuff (I don't remember them all).

Before .NET 8 there were 2 hosting models: Blazor Server and Blazor WebAssembly. With Blazor Server everything is done on the server. The server maintains a circuit for each user with a SignalR connection and renders HTML from there. This probably works pretty well when you have one or 10 users but will have scaling problems if every user requires a circuit. With Blazor WebAssembly, it's an app running in the browser so the work is offloaded, but it's a big download to get the assemblies and .NET runtime downloaded so the load speed is slow, hurting SEO and making the initial load slow.

Now with .NET 8 the new documentation talks about render modes instead of hosting models. With static server side rendering, the server can render a Razor component on the server and send it the client with no interactivity. To me this conceptually seems similar to prerendering which is the server rendering the UI on the server and sending it without interactivity while interactivity is established which may be while the Blazor WebAssembly runtime is getting downloaded. Interactive server-side rendering is like Blazor Server and client-side rendering is like Blazor WebAssembly. Then there is "Auto mode" where it can do anything, the framework decides what rendering mode makes sense to use. I'm not that crazy so for my project I am using client-side rendering and taking advantage of prerendering with an ASP.NET Core app that also has API controllers and Razor components using static rendering.

Some downsides to the prerendering with client-side rendering:

- Prerendering a Razor component where a client asynchronously requests data from an API endpoint will happen twice, but you can store the state in a `PersistentStateComponent` and retrieve it client-side instead of making a second request, so you can at least address that problem in a supported way.

- Once you do the above, the enhanced page navigation will still cause some UI flickering. (At least it did for me and I have been unable to solve it yet. I disabled enhanced page navigation to solve the issue for now.) Enhanced page navigation is like Turbo Drive in Rails. The requests are intercepted, fetch requests are sent instead, and then the page gets updated by patching in only part of the page, avoiding replacing the `<head>`. Even in Rails that feature had caused me problems, but at that time, the problems had more to do with JavaScript page load events being different.