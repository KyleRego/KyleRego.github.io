---
layout: post
title: "Customizing the Trix editor heading button (Razor pages)"
date: 2025-06-23 06:35:00 -0800
categories: ["programming", "c#"]
permalink: /customizing-header-trix-editor-razor-pages
emoji: 🖤
mathjax: false
---

After doing the initial work of integrating the Trix editor for editing the content of posts in my app recently, there was an issue with the heading functionality with the approach to customizing Trix I was using so that the editor used `h2` instead of `h1` (with the toolbar unchanged). The problem was that when the Trix content was loaded into the `<trix-editor>`, the heading did not preserve itself, so while headings could be added to the content and displayed correctly, if the post was edited later, then the headings would have to be set again.

The initial approach I was using had the Trix editor itself coming from a CDN so this was just inside the `</body>`:

{% highlight html %}
<script src="~/js/site.js" asp-append-version="true"></script>
<script src="https://cdn.jsdelivr.net/npm/trix@2.1.15/dist/trix.umd.min.js"></script>
<script src="~/js/trix-upload.js"></script>
<script src="~/js/trix-config.js"></script>
{% endhighlight %}

With `trix-config.js` having this:

{% highlight js %}
addEventListener("trix-initialize", function (event) {
  Trix.config.blockAttributes.heading1.tagName = "h2";
});
{% endhighlight %}

For one thing, I realized that the event being listened to probably should have been `trix-before-initialize` for this. Despite making that change, as well as many other tweaks to the approach, I could not resolve the issue while Trix was being served from the CDN.

# Using Trix as an NPM package to fix the problem

I decided to try refactoring to use Trix as an NPM package. My approach was to use a `package.json` script to copy the files from `node_modules` (after installing Trix with `npm install Trix`), specifically the ES-module build of Trix (the `.esm` file):

{% highlight json %}
"scripts": {
    "build-bootstrap-css": "sass scss/custom-bootstrap.scss wwwroot/css/bootstrap-custom.css",
    "build-bootstrap-js-win": "copy \"node_modules\\bootstrap\\dist\\js\\bootstrap.bundle.min.js\" \"wwwroot\\js\\bootstrap.bundle.min.js\"",
    "build-bootstrap-js-linux": "cp node_modules/bootstrap/dist/js/bootstrap.bundle.min.js wwwroot/js/bootstrap.bundle.min.js",
    "build-trix-js-win":    "copy \"node_modules\\trix\\dist\\trix.esm.min.js\" \"wwwroot\\js\\trix.esm.min.js\"",
    "build-trix-js-linux":  "cp node_modules/trix/dist/trix.esm.min.js wwwroot/js/trix.esm.min.js\"",
    "build-trix-css-win":   "copy \"node_modules\\trix\\dist\\trix.css\" \"wwwroot\\css\\trix.css\"",
    "build-trix-css-linux": "cp node_modules/trix/dist/trix.css wwwroot/css/trix.css\"",

    "build-assets-win":   "npm run build-bootstrap-js-win  && npm run build-trix-js-win  && npm run build-trix-css-win",
    "build-assets-linux": "npm run build-bootstrap-js-linux && npm run build-trix-js-linux && npm run build-trix-css-linux"
  },
{% endhighlight %}

This project also has bootstrap assets being copied in the same way, and versions of the script to copy for Windows (development) and Linux (GitHub Action) as well as scripts that serve to just run the Windows or Linux scripts together.

Now I added to `site.js` (`wwwroot/js/site.js` default Razor pages file):

{% highlight js %}
import Trix from "./trix.esm.min.js";

document.addEventListener("trix-before-initialize", (_) => {
    Trix.config.blockAttributes.heading1 = {
        tagName:       "h2",
        parse:         el => el.tagName === "H2",
        breakOnReturn: true,
        terminal:      true,
        group:         false
    };
})
{% endhighlight %}

and removed the `trix-config.js` (the change to this from the previous event listener was part of what I was trying while Trix was from the CDN). To use `import` requires `type="module"` (ECMAScript modules) so here is what went just inside `</body>`:

{% highlight html %}
<script type="module" src="~/js/site.js" asp-append-version="true"></script>
<script src="~/js/trix-upload.js" defer></script>
{% endhighlight %}

With this approach, the goal of customizing the Trix editor to use `h2` instead of `h1` was accomplished without the issue of the heading not being preserved on editing the post content.