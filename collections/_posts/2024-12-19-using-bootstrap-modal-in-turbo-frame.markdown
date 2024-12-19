---
layout: post
title: "Inserting and showing Bootstrap modal within a Turbo Frame (Rails)"
date: 2024-12-19 9:25:00 -0500
categories: programming
permalink: /using-bootstrap-modal-with-turbo
emoji: 😪
mathjax: false
---

Today I worked out an example of using the Bootstrap modal component in a Turbo Frame.

This link triggers the response with the Turbo Frame containing the Boostrap modal. It is not inside a Turbo Frame, so the `data-turbo-frame` attribute is used to specify which Turbo Frame is the target:

{% highlight ruby %}
<%= link_to "Open Modal",  edit_article_path(@article), data: { turbo_frame: "modal" } %>
{% endhighlight %}

This is the target Turbo Frame to be replaced:

{% highlight html %}{% raw %}
<turbo-frame id="modal" target="_top">
  
</turbo-frame>
{% endraw %}{% endhighlight %}

This is the ERB with the replacement Turbo Frame which has the Bootstrap modal:

{% highlight ruby %}{% raw %}
<turbo-frame id="modal">
  <div class="modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editing article "<%= @article.title %>"</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <%= render "form", url: article_path(@article) %>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  </div>
</turbo-frame>
{% endraw %}{% endhighlight %}

The problem with this is the Bootstrap modal will not show itself just from being inserted in the DOM as a Turbo Frame.

To accomplish that, add an event listener in `application.js` that listens to the `"turbo:frame-load"` event and shows the modal:

{% highlight javascript %}
import { Modal } from "bootstrap";

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

With this, the modal will show itself when it's inserted in the DOM as a Turbo Frame.
