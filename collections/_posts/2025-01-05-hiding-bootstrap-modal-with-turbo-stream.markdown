---
layout: post
title: "Replacing and hiding Bootstrap modal as part of Turbo Stream"
date: 2025-01-05 11:35:00 -0800
categories: programming
permalink: /replacing-hiding-bootstrap-modal-turbo-stream
emoji: 😋
mathjax: false
---

Previously I wrote a post on [showing a Bootstrap modal](using-bootstrap-modal-with-turbo) when it is added to the DOM by a Turbo Frame. To recap that, the approach was to insert the Bootstrap modal into the DOM as a Turbo Frame, and then have this event listener in `application.js` to show the modal:

{% highlight javascript %}
document.addEventListener("turbo:frame-load", (event) => {
  if (event.target.id === "modal") {
    const modalElement = document.querySelector("#modal .modal");
    if (modalElement) {
      const modalInstance = new Modal(modalElement);
      modalInstance.show();
    }
  }
});
{% endhighlight %}

Showing the modal causes some changes to the page such as the addition of `<div class="modal-backdrop show"></div>` and the `modal-open` class to the body. Previous features in my app were redirecting or reloading the page with the modal form submission which reset those changes.

However today I was working on a feature where the form modal submission resulted in a Turbo Stream response, replacing some element in the page, and also replacing the modal with this part in the Turbo Stream (the partial being rendered is a new Turbo Frame element ready to be replaced by another modal):

{% highlight ruby %}
<%= turbo_stream.replace "modal" do %>
  <%= render "layouts/modal_frame" %>
<% end %>
{% endhighlight %}

The problem with this was the modal was being removed from the DOM but the modal backdrop remained, which left a grey backdrop over everything after the modal was gone. 

The solution I found, which I am not completely happy with as this depends very specifically on what features are using turbo frames and turbo streams, was to add this event listener in `application.js`:

{% highlight javascript %}
document.addEventListener("turbo:before-stream-render", (event) => {
    // Notice how "modal" is obtained from event differently
    // compared to the "turbo-frame:load" event above
  if (event.target.getAttribute("target") === "modal") {
    const modalElement = document.querySelector("#modal .modal");
    if (modalElement) {
      const modalInstance = Modal.getInstance(modalElement);
      modalInstance.hide();
    }
  }
});
{% endhighlight %}

With this, just before the Turbo Stream replaces the modal in the DOM, the already shown modal instance is hidden which makes the changes removing the backdrop from the page.
