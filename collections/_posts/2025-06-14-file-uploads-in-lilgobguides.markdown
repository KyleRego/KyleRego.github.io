---
layout: post
title: "File uploads in lilgobguides (Razor Pages)"
date: 2025-06-14 12:35:00 -0800
categories: ["programming", "c#", "razor pages"]
permalink: /file-uploads-lilgobguides
emoji: 🖤
mathjax: false
---

In my Old School Runescape blog website lilgobguides, there are two different mechanisms for file uploads which I developed recently, and so I wanted to review and compare them. The first is a normal file upload control in a form for `Post`s, and there is a Trix editor for `Post`s which does file uploads and deletes. The image data is stored on the server differently in each case. I also include a snippet at the end for a third way to store image uploads, taken from a different project.

# Normal form with file upload

For an HTML form or `<input>` to be able to upload a file, the `enctype` attribute must be set to `"multipart/form-data"` (see [HTMLFormElement: enctype property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/enctype))

{% highlight html %}{% raw %}
<form method="post" enctype="multipart/form-data">
{% endraw %}

{% endhighlight %}
Then in the form there is this input for file upload:

{% highlight html %}{% raw %}
<label for="HeaderImageFile" class="form-label">Post Card Header Image</label>
<input type="file" class="form-control" id="HeaderImageFile" name="HeaderImageFile" />
{% endraw %}{% endhighlight %}

The page model (like a page controller) has a public property with a public property setter (`set` instead of `private set;`) which gets an `IFormFile` from model binding:
 
{% highlight c# %}
[Authorize]
public class NewPostModel(AppDbContext db) : PageModel
{
    ...

    [BindProperty]
    public IFormFile? HeaderImageFile { get; set; }

    ...
}
{% endhighlight %}

Then there is some logic in the POST action methods for new post and edit post, this is what adds the image to the `Post` object in the new post handler:

{% highlight c# %}
public async Task<IActionResult> OnPostAsync()
{
    if (!ModelState.IsValid)
    {
        return Page();
    }

    if (HeaderImageFile != null && HeaderImageFile.Length > 0)
    {
        using var ms = new MemoryStream();
        await HeaderImageFile.CopyToAsync(ms);
        Post.HeaderImageData = ms.ToArray();
        Post.HeaderImageContentType = HeaderImageFile.ContentType;
    }

    ...
}
{% endhighlight %}

The edit post logic has this:

{% highlight c# %}
if (HeaderImageFile != null && HeaderImageFile.Length > 0)
{
    using var ms = new MemoryStream();
    await HeaderImageFile.CopyToAsync(ms);
    post.HeaderImageData = ms.ToArray();
    post.HeaderImageContentType = HeaderImageFile.ContentType;
}
else
{
    _db.Entry(post).Property(p => p.HeaderImageData).IsModified = false;
    _db.Entry(post).Property(p => p.HeaderImageContentType).IsModified = false;
}
{% endhighlight %}

This makes it so if a post is edited without uploading a new file, the existing file data will not be removed when `await _db.SaveChangesAsync()` happens.

`Post` has these two properties:

{% highlight c# %}
public byte[]? HeaderImageData { get; set; }
public string? HeaderImageContentType { get; set; }
{% endhighlight %}

`Post` is also an EF Core entity type that has a table `Posts` in the SQLite database using EF Core.

{% highlight c# %}
public class AppDbContext(DbContextOptions<AppDbContext> options)
                                    : IdentityDbContext(options)
{
    public DbSet<Post> Posts { get; set; }
    ...
}
{% endhighlight %}

Thus there is this table (from the `sqlite_master` SQLite system catalog):

{% highlight sql %}
type   name                                      tbl_name               rootpage  sql 
table  Posts                                     Posts                  29        CREATE TABLE "Posts" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Posts" PRIMARY KEY,
    "Content" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Title" TEXT NOT NULL
, "HeaderImageContentType" TEXT NULL, "HeaderImageData" BLOB NULL, "Featured" INTEGER NOT NULL DEFAULT 0) 
{% endhighlight %}

So what this shows is the file upload data is being stored as the data value in the SQLite database in a column with the `BLOB` type. An SQLite database is a single on-disk database file.

To use that image in the HTML, the Razor pages `<img>` gets a `src` like so:

{% highlight c# %}
@if (Model.HeaderImageData != null && Model.HeaderImageContentType != null)
{
    var base64 = Convert.ToBase64String(Model.HeaderImageData);
    var imgSrc = $"data:{Model.HeaderImageContentType};base64,{base64}";
    <img src="@imgSrc" class="card-img-top" alt="Header Image" />
}
{% endhighlight %}

The [data: URLS](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data) MDN article explains the `src` syntax there.

# Trix editor file uploads and deletes

With Trix and `<trix-editor>` setup, there are some Trix JavaScript events that event listeners can add `fetch` calls to:

{% highlight javascript %}
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

To me, the simplest way to handle that on the server is with an API controller. Although `lilgobguides` is a Razor pages app, controllers can be added by registering their services and mapping their routes with `builder.Services.AddControllers();` and `app.MapControllers();` in `Program.cs`.

With those services in place, the specific controller for handling the Trix editor events' `fetch` requests is:

{% highlight c# %}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lilgobguides.Controllers;

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

`[Authorize]` enforces simple authorization (authentication) on both controller actions. `[ApiController]` does quite a lot including automatic 400 responses for requests failing model binding and conventional routing based on the class name.

This shows the images uploaded from the Trix editor are saved on the disk in the public web `wwwroot` folder with randomly generated file names, making them static assets of the site. In the other case, they were stored as `BLOB` values in the SQLite database with image data written into the HTML during server HTML rendering.

An alternative to saving the images in `wwwroot` would be to store them in a different folder, and use a controller to serve them from there. I used this approach in a quick project once about a year ago:

{% highlight c# %}
[ApiController, Route("api/[controller]")]
public class UploadedImagesController(ILogger<UploadedImagesController> logger, 
                                    IConfiguration config,
                                    GalleryDbContext dbContext) : ControllerBase
{
    private readonly ILogger<UploadedImagesController> _logger = logger;
    private readonly IConfiguration _config = config;
    private readonly GalleryDbContext _dbContext = dbContext;

    [HttpGet("{imageId}")]
    public IActionResult Get(string imageId)
    {
        UploadedImage? image = _dbContext.UploadedImages.FirstOrDefault(file => file.Id == imageId);

        if (image == null) return NotFound();

        string uploadedFilesPath = _config.GetValue<string>("StoredFilesPath")!;

        string uploadedFilePath = image.PathToFile(uploadedFilesPath);

        if (!System.IO.File.Exists(uploadedFilePath)) return NotFound();

        return PhysicalFile(uploadedFilePath, "image/png");
    }
}
{% endhighlight %}
