---
layout: post
title: "Customizing the Trix editor in a Rails app (Action Text)"
date: 2024-11-09 08:25:00 -0500
categories: programming ruby ruby-on-rails
permalink: /customizing-the-trix-editor
emoji: 🐬
mathjax: false
---

I noticed an issue yesterday in the production website for my Ruby on Rails app, Anki Books. I had recently migrated the website from being served from a laptop I had to an Azure VM, and to save compute I also somewhat tactically added caching to the public facing controller actions. The issue that I realized yesterday was that due to an inline script using a nonce for the Content Security Policy, the cached action result was including an outdated nonce, so the CSP was failing which was causing all of the JavaScript on the page to not work.

The nonce was needed for a script that was being used to change the Trix configuration. It was something I worked on over a year ago, but after trying other approaches that I think would have been better but I couldn't get to work, ended up an ERB partial `_trix_config.erb` which was being included in the layout of the app in the `<head>`:

{% highlight javascript %}
<%= javascript_tag nonce: true do -%> <%# erblint:disable NoJavascriptTagHelper %>
  // Changes the Trix.config to support the subheadings.
  // The order that things need to load seems to make it necessary
  // to add this to the head after the modules
  document.addEventListener("trix-before-initialize", () => {
    Trix.config.blockAttributes.heading2 = {
      tagName: "h2",
      terminal: true,
      breakOnReturn: true,
      group: false,
    };
    Trix.config.blockAttributes.heading3 = {
      tagName: "h3",
      terminal: true,
      breakOnReturn: true,
      group: false,
    };
    Trix.config.blockAttributes.heading4 = {
      tagName: "h4",
      terminal: true,
      breakOnReturn: true,
      group: false,
    };
    Trix.config.blockAttributes.heading5 = {
      tagName: "h5",
      terminal: true,
      breakOnReturn: true,
      group: false,
    };
    Trix.config.blockAttributes.heading6 = {
      tagName: "h6",
      terminal: true,
      breakOnReturn: true,
      group: false,
    };
  })
<% end -%>
{% endhighlight %}

I never really felt that approach was an ideal way to do it, but it worked, at least until adding the caching and realizing that the outdated nonce served from the cache was breaking the JavaScript. Since the nonce is only needed for inline JavaScript like this, I just had to change the approach so that it wasn't an inline script and a nonce wasn't necessary.

So today I tried for a while to get this in a Stimulus controller that in the `connect()` method would add the event listener, but I found it didn't work well. The behavior seemed to vary on different page refreshes as if there were some race conditions. It seemed like the `trix-before-initialize` event was firing before the Stimulus controller connected sometimes, so the event was never observed and the Trix object wasn't changed. But it turned out that simply putting this in `app/javascript/application.js` worked well:

{% highlight javascript %}
import Trix from "trix";
Trix.config.blockAttributes.heading2 = {
  tagName: "h2",
  terminal: true,
  breakOnReturn: true,
  group: false,
};
Trix.config.blockAttributes.heading3 = {
  tagName: "h3",
  terminal: true,
  breakOnReturn: true,
  group: false,
};
Trix.config.blockAttributes.heading4 = {
  tagName: "h4",
  terminal: true,
  breakOnReturn: true,
  group: false,
};
Trix.config.blockAttributes.heading5 = {
  tagName: "h5",
  terminal: true,
  breakOnReturn: true,
  group: false,
};
Trix.config.blockAttributes.heading6 = {
  tagName: "h6",
  terminal: true,
  breakOnReturn: true,
  group: false,
};
{% endhighlight %}

I was surprised it worked without the event listener as I thought that was necessary from my previous experience, and I feel like when I was working on this the first time, the above would have been the first thing I tried. Ibelieve with this way it's changing the `Trix` configuration for all instances of the Trix editor though. It may be that if you needed different Trix editors to have different configuration, this wouldn't work, and listening to the `trix-before-initialize` event could be a way to do it that would let you have different configurations.

The main change this is making is adding `h2` through `h6` buttons to the editor. The other Trix editor changes I am making are changes to its DOM elements, which is done by a Stimulus controller connected to a `div` that wraps where Action Text renders the editor:

{% highlight ruby %}
<div  data-controller="article-editor"
        data-article-editor-target="editorContainer">
<%= form.label :content %>
<%= form.rich_text_area :content %>
</div>
{% endhighlight %}

And so the changes to the DOM itself happen with this controller, which involves some changes that are very specific to my app, such as setting the `y` position of the toolbar to just below the header, but also adding the additional heading buttons and giving the redo button a keyboard shortcut. 

{% highlight javascript %}
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "editorContainer" ];

  connect() {
    this.toolbarTarget = this.editorContainerTarget.querySelector("[id^='trix-toolbar-']");
    this.configureToolbar();
    this.setupHeaderButtonsGroup();
    this.addHeaderButtonsGroupToButtonsRow();
    this.removeOriginalHeadersButton();
    this.changeKeyboardShortcuts();
  }

  configureToolbar() {
    const topNavBarHeight = document.querySelector("#top-nav").offsetHeight;
    this.toolbarTarget.classList.add("position-sticky");
    this.toolbarTarget.classList.add("z-50");
    this.toolbarTarget.classList.add("bg-white");
    this.toolbarTarget.classList.add("dark:bg-gray-900");
    this.toolbarTarget.style.top = `${topNavBarHeight}px`;
  }

  setupHeaderButtonsGroup() {
    this.headersButtonGroup = document.createElement("span");
    this.headersButtonGroup.setAttribute("class", "trix-button-group");
    const headings = ["1", "2", "3", "4", "5", "6"];
    headings.forEach((heading) => {
      const button = document.createElement("button");
      button.innerText = `H${heading}`;
      button.setAttribute("type", "button");
      button.setAttribute("class", "trix-button");
      button.setAttribute("data-trix-attribute", `heading${heading}`);
      button.setAttribute("title", `H${heading}`);
      button.setAttribute("tabindex", "-1");
      button.setAttribute("data-trix-active", "");
      this.headersButtonGroup.appendChild(button);
    });
  }

  addHeaderButtonsGroupToButtonsRow() {
    const buttonsRow = document.querySelector("div.trix-button-row");
    const secondButtonGroup = buttonsRow.children[1];
    secondButtonGroup.insertBefore(this.headersButtonGroup, secondButtonGroup.firstChild);
    while (this.headersButtonGroup.firstChild) {
      this.headersButtonGroup.parentNode.insertBefore(this.headersButtonGroup.firstChild, this.headersButtonGroup);
    }
    this.headersButtonGroup.parentNode.removeChild(this.headersButtonGroup);
  }

  removeOriginalHeadersButton() {
    this.showHeadersButtonGroup = this.toolbarTarget.querySelector(".trix-button--icon-heading-1");
    this.showHeadersButtonGroup.parentNode.removeChild(this.showHeadersButtonGroup);
  }

  changeKeyboardShortcuts() {
    this.changeRedoButtonKeyboardShortcut();
  }

  changeRedoButtonKeyboardShortcut() {
    const redoButton = document.querySelector("button.trix-button--icon-redo");
    redoButton.setAttribute("data-trix-key", "y");
  }
}
{% endhighlight %}

Unfortunately, most of the work here was from a while ago so it is harder for me to describe what parts of the Trix API I am using in a helpful way.

This is what the Trix editor toolbar ends up looking like in my app (the toolbar is mainly what is being changed with the above):

![Customized Trix editor toolbar](assets/screenshots/ankibooks-trix-toolbar.png)

This shows how using the added heading buttons keep the consistent behavior of disabling the other block-level buttons:

![Customized Trix editor toolbar with H2 active](assets/screenshots/ankibooks-trix-toolbar-2.png)