---
layout: post
title: "Initial thoughts on Blazor"
date: 2024-03-29 08:15:00 -0500
categories: blogging
permalink: /drag-and-drop-in-blazor-with-service
emoji: 🫡
mathjax: false
---

I tried a few ways today to implement a drag and drop feature in my Blazor app, for now I got the essential functionality of what I wanted in a way I didn't see in these blog posts that I had a look at:

- [Drag-N-Drop File Upload In Blazor Using JS Interop And Minimal API (Part 1)](https://www.binaryintellect.net/articles/d40fbcb5-fb25-4d83-950c-47632dc632c1.aspx)
- [A Simple To-Do App Using JS Interop with HTML5 Drag and Drop in Blazor WebAssembly](https://www.syncfusion.com/blogs/post/to-do-app-using-js-interop-with-html5-drag-and-drop-in-blazor-webassembly?ref=dailydev)
- [Investigating Drag and Drop with Blazor](https://chrissainty.com/investigating-drag-and-drop-with-blazor/)

Also see [Microsoft Won't Do Drag-and-Drop for Blazor](https://visualstudiomagazine.com/articles/2022/03/30/blazor-drag-drop.aspx).

The examples linked to above did not seem to quite fit my use case where all of the dragging and dropping logic isn't limited to a single component. I thought the HTML drag and drop API could be used pretty directly to do what I needed to do, but when I tried that I ran into some issues with not seeing how to use the [DataTranfer](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.components.web.datatransfer?view=aspnetcore-8.0) type. It seems like these .NET types for the drag and drop JS event object may be [incompletely implemented](https://github.com/dotnet/aspnetcore/issues/43976) and I also never found an example showing a correct way of passing the `DragEventArgs` argument to the .NET event handler callback being passed into the JavaScript method called via the JSRuntime service, which I was doing but then the JS object didn't have the expected members which may have been due to it being different or I was doing it wrong.

I ended up doing something pretty to solve my problem. I registered a scoped service and it has a nullable property to hold an object being dragged. The draggable element is in a Razor component with the service injected. The draggable element has an ondragstart handler that sets the property of the service to the object represented by the UI element, an ondragend handler sets it back to null, and an ondrop handler that receives the service's dragged element property. The order of these events firing is such that the object is used in the ondrop handler before its set to null by the ondragend.


