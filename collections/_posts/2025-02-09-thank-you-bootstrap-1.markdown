---
layout: post
title: "Thank you Bootstrap 1"
date: 2025-02-09 01:35:00 -0800
categories: programming bootstrap
permalink: /thank-you-bootstrap-1
emoji: 🕸️
mathjax: false
---

Over time I have gravitated toward using Bootstrap for the CSS in my personal projects (currently both in Anki Books, which uses Bootstrap JavaScript in server-rendered HTML, and Larder for only the CSS since it's a React app which must have full control over the DOM). At this point I am very happy with how it's been easy to create nice interactive UI widgets in my websites, and I oftentimes think "thanks Bootstrap" and that I want to write a blog post about some thing that Bootstrap really did the heavy lifting on. Therefore I declare this blog post to be post 1 of a series Thank you Bootstrap.

In my project Larder, the design of the UI evolved toward a layout where the top is a navigation bar and the bottom is an action bar, with these sticky bars having the Bootstrap primary and secondary colors as their background colors (Bootstrap `bg-primary` and `bg-secondary`). I had been changing the values of the Bootstrap CSS variables to different colors to play with the color design easily since this cascades through the website easily with everything being styled with Bootstrap CSS, and I had switched the colors a few times from originally earthy colors like brown to purple and green, to purple and blue, etc since color theory is not something I know much about.

A web design idea that I had done some playground work with before was to use the colors of the transgender flag in a website in some way. And recently I was working on Larder and thought, what would be the result if I used those colors for the Bootstrap primary and secondary colors? And so I configured it in my `_custom.css`:

{% highlight css %}
$primary: #5BCEFA;
$secondary: #F5A9B8;

@import "../../node_modules/bootstrap/scss/bootstrap";
{% endhighlight %}

and I was really impressed/happy with the result:

![Screenshot of Larder with light blue navigation bar and light pink action bar](assets\screenshots\larder-trans-colors-example.png)

Also with this example, I decided to use a whitish color for the middle of the app but I did not check if it was exactly the same as in the trans flag, and I have liberal light outline buttons on the nav and action bars with equivalent CSS of Bootstrap `text-black` and `border-black` added to `btn btn-outline-light` by default (I found that that looks good on both the primary and secondary background colors).

It is a simple thing but Bootstrap saves a web developer like me a lot of work by calculating the RGB and opacity levels for everything from a smaller set of CSS variables, so it is very DRY to just change these two colors and have it cascade throughout the website, and avoids the confusion of me figuring out way more about color design than just picking two colors to sort of be the theme, all the design work and custom CSS that goes into that as well.
