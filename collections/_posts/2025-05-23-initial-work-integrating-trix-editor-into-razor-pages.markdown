---
layout: post
title: "Initial work integrating Trix editor into Razor pages"
date: 2025-05-23 12:35:00 -0800
categories: ["programming", "c#"]
permalink: /initial-trix-editor-razor-pages
emoji: 🖤
mathjax: false
---

Today I did some work in order to use the Trix editor (the rich text editor from Rails Action Text) to edit the content of posts in a Razor pages blog app that I started developing recently for a hobby website. This post describes how I initially got this working today and is about [this commit](https://github.com/KyleRego/lilgobguides/commit/800a9d99509c21e533e2fb95e0b8907a7a576c6c).

## Starting point

Previously I had just done the initial work of adding a `Post` entity:

{% highlight c# %}
public class Post
{
    public int Id { get; set; }
    [Required]
    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
{% endhighlight %}

and a shared component `_PostForm.cshtml.cs`:

{% highlight c# %}
@model lilgobguides.Models.Post

<div>
    <label asp-for="Title" class="form-label"></label>
    <input asp-for="Title" class="form-control" />
    <span asp-validation-for="Title"></span>
</div>
<div>
    <label asp-for="Content" class="form-label"></label>
    <textarea asp-for="Content" class="form-control"></textarea>
    <span asp-validation-for="Content"></span>
</div>
{% endhighlight %}

as well as new post and edit post pages that use that component and a show post page.

## Including the Trix assets

The first step to use the Trix editor is to include the JS and CSS assets for it from a CDN. For this project which is a new Razor pages app created with `dotnet new razor`, I added a `<link>` to the head of `Pages/Shared/_Layout.cshtml` and a `<script>` just inside the `</body>` like so:

{% highlight html %}
...
<link href="https://cdn.jsdelivr.net/npm/trix@2.1.15/dist/trix.min.css" rel="stylesheet">
</head>
...
{% endhighlight %}

{% highlight c# %}
...
<script src="https://cdn.jsdelivr.net/npm/trix@2.1.15/dist/trix.umd.min.js"></script>
<script src="~/js/trix-upload.js"></script>
@await RenderSectionAsync("Scripts", required: false)
</body>
...
{% endhighlight %}

## Using `<trix-editor>`

To use the Trix editor to edit the post content, I changed part of the `_PostForm.cshtml.cs` in the above to:

{% highlight c# %}
<div>
    <label for="Content" class="form-label">Content</label>
    <input id="Content" type="hidden" name="Content" value="@Model.Content" />
    <trix-editor input="Content"></trix-editor>
    <span asp-validation-for="Content" class="text-danger"></span>
</div>
{% endhighlight %}

## Rendering rich Trix HTML

With this, the `Content` edited with the Trix editor is saved as raw HTML. Razor pages escapes that by default, so to render it as rich HTML, the `ShowPost.cshtml` needed `<p>@Model.Post.Content</p>` to be changed to `<p>@Html.Raw(Model.Post.Content)</p>`. In my case I am not concerned about malicious HTML since I am the only user inputting it.

Later I also realized it was necessary to have the `trix-content` class present for the Trix stylesheet to target the HTML:

{% highlight c# %}
<div class="trix-content">
    @Html.Raw(Model.Post.Content)
</div>
{% endhighlight %}

## Image uploads

The way I approached this was very specific to the needs of my hobby website. In my case, I have set this up so I am the only user that is able to log in, so just basic authorization (is this request sent by a logged in user) for image uploads is good enough. As all of the posts will be public, all of the uploaded images can just go in a folder `uploads` inside `wwwroot`. For that, the controller for image uploads is:

{% highlight c# %}
[ApiController, Route("uploads")]
public class UploadsController(IWebHostEnvironment env) : ControllerBase
{
    private readonly IWebHostEnvironment _env = env;

    [Authorize, HttpDelete("trix")]
    public IActionResult DeleteImage([FromQuery] string url)
    {
        string fileName = Path.GetFileName(url);
        string path = Path.Combine(_env.WebRootPath, "uploads", fileName);

        if (System.IO.File.Exists(path))
            System.IO.File.Delete(path);

        return Ok();
    }

    [Authorize, HttpPost("trix")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        string uploadsPath = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsPath);

        string fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
        string filePath = Path.Combine(uploadsPath, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        string fileUrl = Url.Content($"~/uploads/{fileName}");
        return Ok(new { url = fileUrl });
    }
}
{% endhighlight %}

and event listeners for the Trix events related to uploading and removing attachments:

{% highlight js %}
document.addEventListener("trix-attachment-remove", function (event) {
    const attachment = event.attachment;
    const url = attachment.getAttribute("url");
    if (url) {
        fetch("/uploads/trix?url=" + encodeURIComponent(url), {
            method: "DELETE"
        }).catch(err => console.error("Delete failed:", err));
    }
});

document.addEventListener("trix-attachment-add", function (event) {
    const attachment = event.attachment;
    if (attachment.file) {
        uploadTrixFile(attachment);
    }
});

function uploadTrixFile(attachment) {
    const file = attachment.file;
    const formData = new FormData();
    formData.append("file", file);

    fetch("/uploads/trix", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error("Upload failed.");
        return response.json();
    })
    .then(data => {
        attachment.setAttributes({
            url: data.url,
            href: data.url
        });
    })
    .catch(error => {
        console.error("Upload error:", error);
    });
}
{% endhighlight %}

in a file `wwwroot/js/trix-upload.js` included into `_Layout.cshtml` with `<script src="~/js/trix-upload.js"></script>`.

It was also necessary to add `builder.Services.AddControllers()` and `app.MapControllers()` to `Program.cs` as previously this was a Razor pages web app without controllers.

This is not an airtight approach with regards to removing images; uploads can be removed from the post with the delete image endpoint and event listener to send a fetch request to it above, however if a post with uploads is deleted directly, those uploaded files will remain on the disk. In my case I am the only stakeholder for this hobby website where I am aware of the issue and not too concerned about it. Other ways this could be handled might be a table `PostUploads` keeping track of the uploads, or scanning the content of a post for uploads just before deleting the post.

## Configuring the Trix editor to use H2 for headings instead of H1

By default, the Trix editor toolbar has one heading button and saves the heading as an HTML `h1` element. Since it is a best practice to have only one `h1` per web page, I used the following event listener to make it so the Trix editor will save those as `h2` instead:

{% highlight javascript %}
addEventListener("trix-initialize", function (event) {
  Trix.config.blockAttributes.heading1.tagName = "h2";
});
{% endhighlight %}
