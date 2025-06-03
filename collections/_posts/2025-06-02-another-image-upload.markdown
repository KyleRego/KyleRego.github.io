---
layout: post
title: "Razor pages file upload model binding with EF Core"
date: 2025-06-02 12:35:00 -0800
categories: ["programming", "c#"]
permalink: /img-upload-for-card-header
emoji: 🖤
mathjax: false
---

Today I wanted to add an image upload to my post model in a Razor pages ASP.NET Core blog app to be the header image of the post's card styled with Bootstrap.

As this would be a single image for the post, I thought it would suffice to store the uploaded image data just in the SQLite database as part of the post record. That can be accomplished by adding a `byte[]` property of the `Post` model and then scaffolding migrations to add that to the database provider, in my case SQLite database, to add that column to the `Posts` table:

{% highlight c# %}
using System.ComponentModel.DataAnnotations;

namespace lilgobguides.Models;

public class Post
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PostCategorization Categorization { get; set; } = new();

    public Post()
    {
        Categorization.PostId = Id;
    }

    public byte[]? HeaderImageData { get; set; }

    // (e.g. "image/png")
    public string? HeaderImageContentType { get; set; }
}
{% endhighlight %}

The last two properties in the type are what was added for this feature. The auto-scaffolded migration from `dotnet ef migrations add AddHeaderImageData` or similar:

{% highlight c# %}
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lilgobguides.Migrations
{
    /// <inheritdoc />
    public partial class AddHeaderImageData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeaderImageContentType",
                table: "Posts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "HeaderImageData",
                table: "Posts",
                type: "BLOB",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeaderImageContentType",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "HeaderImageData",
                table: "Posts");
        }
    }
}
{% endhighlight %}

So this shows the `byte[]` type in C# is mapped to a `BLOB` type in the SQLite database.

To do the image upload, the form has to have the `enctype="multipart/form-data"` attribute-value pair:

{% highlight c# %}{% raw %}
<form method="post" enctype="multipart/form-data">
    @await Html.PartialAsync("_PostForm", Model.Post)
    <div class="mt-4">
      <button type="submit" class="btn btn-primary">Create post</button>
    </div>
    
  </form>
{% endraw %}{% endhighlight %}

The page model for the page with this needs a property to bind the incoming `IFormFile`:

{% highlight c# %}
[BindProperty]
public IFormFile? HeaderImageFile { get; set; }
{% endhighlight %}

The `POST` action method handling the form submission can then use the value bound to that property (`ModelState.IsValid` is checking the state of model validation which happens after model binding):

{% highlight c# %}
public async Task<IActionResult> OnPostAsync(string id)
{
    if (!ModelState.IsValid)
    {
        Console.WriteLine("Model validation failed");
        return Page();
    }

    Post? post = await _db.Posts
                        .Include(p => p.Categorization)
                        .Where(p => p.Id == id)
                        .FirstOrDefaultAsync();

    if (post == null) return NotFound();

    post.Categorization ??= new() { PostId = Post.Id };

    post.Title = Post.Title;
    post.Content = Post.Content;
    post.Categorization.Skilling = Post.Categorization.Skilling;
    post.Categorization.Minigame = Post.Categorization.Minigame;
    post.Categorization.Item = Post.Categorization.Item;
    post.Categorization.Boss = Post.Categorization.Boss;

    if (HeaderImageFile != null && HeaderImageFile.Length > 0)
    {
        using var ms = new MemoryStream();
        await HeaderImageFile.CopyToAsync(ms);
        post.HeaderImageData = ms.ToArray();
        post.HeaderImageContentType = HeaderImageFile.ContentType;
    }
    else
    {
        Console.WriteLine("There was no header image");
        _db.Entry(post).Property(p => p.HeaderImageData).IsModified = false;
        _db.Entry(post).Property(p => p.HeaderImageContentType).IsModified = false;
    }

    await _db.SaveChangesAsync();

    return RedirectToPage("/Posts/ShowPost", new { post.Id });
}
{% endhighlight %}

And finally this is how the `img` tag is used:

{% highlight c# %}
@using System.Text.RegularExpressions
@model lilgobguides.Models.Post

<div class="card" style="width:20rem" asp-page="/Posts/ShowPost" asp-route-id="@Model.Id">
    @if (Model.HeaderImageData != null && Model.HeaderImageContentType != null)
    {
        var base64 = Convert.ToBase64String(Model.HeaderImageData);
        var imgSrc = $"data:{Model.HeaderImageContentType};base64,{base64}";
        <img src="@imgSrc" class="card-img-top" alt="Header Image" />
    }
    <div class="card-body">
        <h5 class="card-title">@Model.Title</h5>
        <p class="card-text">
            @{
                var text = Regex.Replace(Model.Content, "<.*?>", "");
                if (text.Length > 200) {
                    @($"{text.Substring(0,100)}...")
                } else {
                    @text
                }
            }
        </p>
        <a asp-page="/Posts/ShowPost" asp-route-id="@Model.Id" class="btn btn-primary">
            Read more
        </a>
    </div>
</div>
{% endhighlight %}

which is a nice looking Bootstrap card (thanks Bootstrap):

![Bootstrap card with an image h](assets/bootstrap-card.png)