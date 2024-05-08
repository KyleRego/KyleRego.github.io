---
layout: post
title: "Drag and drop in Blazor with service"
date: 2024-05-01 00:00:00 -0500
categories: blogging
permalink: /drag-and-drop-in-blazor-with-service
emoji: 🫡
mathjax: false
---

I tried a few ways today (about one month ago, but I wrote the beginning of this post, except for this part, a month ago) to implement a drag and drop feature in my Blazor app, for now I got the essential functionality of what I wanted in a way I didn't see in these blog posts that I had a look at:

- [Drag-N-Drop File Upload In Blazor Using JS Interop And Minimal API (Part 1)](https://www.binaryintellect.net/articles/d40fbcb5-fb25-4d83-950c-47632dc632c1.aspx)
- [A Simple To-Do App Using JS Interop with HTML5 Drag and Drop in Blazor WebAssembly](https://www.syncfusion.com/blogs/post/to-do-app-using-js-interop-with-html5-drag-and-drop-in-blazor-webassembly?ref=dailydev)
- [Investigating Drag and Drop with Blazor](https://chrissainty.com/investigating-drag-and-drop-with-blazor/)

Also see [Microsoft Won't Do Drag-and-Drop for Blazor](https://visualstudiomagazine.com/articles/2022/03/30/blazor-drag-drop.aspx).

The examples linked to above did not seem to quite fit my use case where all of the dragging and dropping logic isn't limited to a single component. I thought the HTML drag and drop API could be used pretty directly to do what I needed to do, but when I tried that I ran into some issues with not seeing how to use the [DataTranfer](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.components.web.datatransfer?view=aspnetcore-8.0) type. It seems like these .NET types for the drag and drop JS event object may be [incompletely implemented](https://github.com/dotnet/aspnetcore/issues/43976) and I also never found an example showing a correct way of passing the `DragEventArgs` argument to the .NET event handler callback being passed into the JavaScript method called via the JSRuntime service, which I was doing but then the JS object didn't have the expected members which may have been due to it being different or I was doing it wrong.

I ended up doing something pretty to solve my problem. I have a class to hold an object representing what is being dragged:

{% highlight c# %}
using AnkiBooks.ApplicationCore.Interfaces;

namespace AnkiBooks.WebApp.Client.Services;

public class DraggedItemHolder<T>
{
    public T? DraggedItem { get; set; }
}
{% endhighlight %}

The class uses a generic type `T` currently. It needs to be registered as a service so it can be injected into the Razor components where it is needed. My app is a Blazor Web App that uses prerendering (that happens on the server, with the main rendering being Blazor client-side rendering). This means that the services that are injected into Razor components need to be registered on both the server and client project, which I accomplish with this class:

{% highlight c# %}
public static class CommonServices
{
    public static void Configure(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped(_ => new HttpClient { BaseAddress = new Uri(configuration["AppUrl"]!) });
        services.AddScoped<IAnkiBooksApiService, AnkiBooksApiService>();
        services.AddScoped<DraggedItemHolder<ArticleElement>>();
    }
}
{% endhighlight %}

So in the client project `Program.cs`:

{% highlight c# %}
WebAssemblyHostBuilder builder = WebAssemblyHostBuilder.CreateDefault(args);

CommonServices.Configure(builder.Services, builder.Configuration);
{% endhighlight %}

And some example code of one of the Razor components that uses this:

{% highlight c# %}{% raw %}
...

@inject ILogger<NoteElement> logger
@inject DraggedItemHolder<ArticleElement> draggedItemHolder

...

<div class="@(nestedDragLevels != 0 ? "dragover-highlight" : "")"

            draggable="true"
            @ondragstart="HandleDrag"
            @ondragend="HandleDragEnd"
            @ondragenter="HandleDragEnter" @ondragenter:preventDefault
            ondragover="event.preventDefault();"
            @ondragleave="HandleDragLeave" @ondragleave:preventDefault
            @ondrop="HandleDrop">
    @switch (Note)
    {
        case BasicNote basicNote:
            <ShowBasicNote BasicNoteFront="@basicNote.Front" BasicNoteBack="@basicNote.Back" />
            break;

        case ClozeNote clozeNote:
            <ShowClozeNote ClozeNoteText="@clozeNote.Text" />
            break;
    }
</div>

...

private void HandleDrag()
{
    logger.LogInformation("drag");
    draggedItemHolder.DraggedItem = (ArticleElement)Note;
}

private void HandleDragEnd()
{
    logger.LogInformation("dragend");
    draggedItemHolder.DraggedItem = null;
}

private int nestedDragLevels = 0;

private void HandleDragEnter()
{
    ArticleElement? draggedItem = draggedItemHolder.DraggedItem;

    if (draggedItem == null) return;
    if (draggedItem == Note) return;
    logger.LogInformation("dragenter");
    nestedDragLevels += 1;
}

private void HandleDragLeave()
{
    ArticleElement? draggedItem = draggedItemHolder.DraggedItem;

    if (draggedItem == null) return;
    if (draggedItem == Note) return;
    logger.LogInformation("dragleave");

    nestedDragLevels -= 1;
}

private async Task HandleDrop()
{
    nestedDragLevels = 0;
    logger.LogInformation("drop");
    ArticleElement? droppedElement = draggedItemHolder.DraggedItem;

    if (droppedElement == null) return;
    if (droppedElement == Note) return;

    droppedElement.OrdinalPosition = Note.OrdinalPosition;

    await ApiService.PutElement(droppedElement);

    ElementsContainer.UpdatePosition(droppedElement);
    await ElementsContainerChanged.InvokeAsync(ElementsContainer);
}
{% endraw %}{% endhighlight %}

The `drop` event always fires before the `dragend` event. There are some other things here worth commenting on but to be honest the beginning of this blog post was written about a month ago and I'm just finishing it now. I found that the syntax for attaching the Razor event handlers was tricky to make it work correct just from reading the docs and I had to experiment a bit to get the above syntax which worked. Due to the way event firing is in JavaScript (bubbling and capture and all that) it was necessary to keep track of how many nested levels of dragenter there are to highlight the dropzone correctly by adding a CSS class (`dragover-highlight`) to it.