---
layout: post
title:  "Turbo notes"
categories: javascript rails programming turbo hotwire
permalink: /turbo-notes
emoji: 💪
mathjax: false
---

Turbo is the first part of Hotwire and consists of Turbo Drive (previously Turbo Links), Turbo Frames, and Turbo Streams. Without custom JavaScript, Turbo directs user actions into requests to get new HTML.

## Turbo Drive

When Turbo Drive is active, it will receive the response to any link click or form submission, extract its body and replace the existing page body with it while doing some other things like keeping the back button working and reducing page flickering. Performance is improved by not having to reload some large assets in the header, but not as much as Turbo Frames.

## Turbo Frames

A turbo frame is a custom HTML element `<turbo-frame>` that wraps some HTML. Any event such as a link click or form submission triggered from within the wrapped HTML will indicate to Turbo to look in the response for a turbo frame with a matching id to the `<turbo-frame>`. If it finds one, it will use it to update the matching turbo frame. There is a turbo frame tag helper which can be used to generate the turbo frame element in ERB. 

If there isn't a matching turbo frame in the response, the existing frame will be replaced by nothing. There are two ways to avoid this.

The first is the `target` attribute of the turbo frame tag (or `target` argument of the turbo frame helper method). The value of the `target` attribute is the DOM id of a different turbo frame. The turbo frame that will be updated will be the target instead of the highest level parent turbo frame.

The second way is the `data-turbo-frame` attribute. If this is set on a link or form with the value being the DOM id of a different turbo frame, then Turbo will target redrawing the turbo frame specified by that `data-turbo-frame`. The value `_top` specifies that the entire page should be redrawn.

A turbo frame may also use the `src` attribute. This will cause the contents of the frame to update once by making a request to this attribute's value. If the incoming HTML is a new turbo frame with the same `src` this may cause an infinite loop. There is also an attribute called `loading` which when given the value `lazy`, will delay the turbo frame from fetching its source until the frame is visible.

## Turbo Streams

**It is also designed to work well with websockets/ActionCable.**

This is the next step and is used when the want to allow updating multiple parts of the page from a single request. Turbo Streams allows sending an arbitrary amount of HTML to the page to replace existing stuff in multiple arbitrary locations. 

A turbo stream is another customer HTML element: `<turbo-stream>`. It has a child element of `<template>` which holds the incoming HTML. There are two attributes for turbo stream: `target` and `action`. Here `target` is again the DOM id of the element to be updated. What to do with the incoming HTML is specified by `action` and the values are `append`, `prepend`, `remove`, `replace`, and `update` where the difference between `replace` and `update` is that `replace` replaces the entire target element with the incoming HTML, whereas `update` only sets the content of the target element to the incoming HTML.

Turbo stream is also a recognized format inside the block argument to `respond_to` in a controller. Rails will look for a file with a format like `action_name.turbostream.erb` in the default way.

{% include attribution-book.html
  book_title = "Modern Front-End Development for Rails&#58; Hotwire, Stimulus, Turbo, and React 1st Edition"
  book_author = "Noel Rappin"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "9781680507218"
  book_link = "https://www.amazon.com/Modern-Front-End-Development-Rails-Webpacker/dp/1680507214"
%}