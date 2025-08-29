---
layout: post
title: "Inventory Rails app explained (part two)"
date: 2024-02-10 10:15:00 -0500
categories: ruby-on-rails
permalink: /inventory-rails-app-explained-part-two
emoji: 😋
mathjax: true
---

Continuing the last post I will keep explaining code. I will look at [this commit](https://github.com/eggrain/inventory/commit/7719843933ae35370bff979e505d9b99ee9ec84a) which is a small change that may be a good one to explain some basic ideas about ERB (Embedded Ruby) and the modest JavaScript framework, Stimulus, that is part of Hotwire, which seems to me to be the default approach to spicing up the front-end of Rails apps these days.

2 files are changed by this commit: `app/javascript/controllers/hamburger_controller.js` and `app/views/layouts/application.html.erb`. First I will point out that from the root directory of a Rails software project, the `app` folder is where most of the app code will be. The view code of a Rails app is in `app/views`. A lot of the philosophy of Rails has to do with convention over configuration. This means we take the opinions of Rails as our own in order to do more while thinking less since things will hopefully just work out of the box. The `app/views/layouts` is for layouts which are like the outer structure of the pages that individual pages will share and may include elements of the UI such as navigation bars that are present through the app. The `app/views/application.html.erb` is the main layout of the app. Specific pages can use other layouts but by default views will be rendered inside this application layout. The `app/javascript/controllers/hamburger_controller.js` is some JavaScript code that is a Stimulus controller.

`app/javascript/controllers/hamburger_controller.js` is changed from this:

```
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.element.textContent = "Hello World!"
  }
}
```

to

```
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "menu" ];

  connect() {
    console.log("hamburger controller has been connected");
  }

  show() {
    this.menuTarget.hidden = false;
  }

  hide() {
    this.menuTarget.hidden = true;
  }
}
```

and a part of the other file is changed from

```
      <span class="mr-2 sm-show" data-controller="hamburger">
        <%= render partial: "layouts/heroicons/hamburger",
              locals: { css_class: "inline w-8 h-8" } %>
      </span>
    </header>
```

to 

```
     <div class="inline mr-2 sm-show" data-controller="hamburger">
        <button type="button" data-action="click->hamburger#show" title="Show navigation menu">
          <%= render partial: "layouts/heroicons/hamburger",
                      locals: { css_class: "inline w-8 h-8" } %>
        </button>

        <div data-hamburger-target="menu" hidden>
          <button type="button" data-action="click->hamburger#hide" title="Hide navigation menu">
            <%= render partial: "layouts/heroicons/hamburger",
                        locals: { css_class: "inline w-8 h-8" } %>
          </button>
          <ul>
            <li><%= link_to "New location", new_location_path, class: "text-link" %></li>
            <li><%= link_to "New item", new_item_path, class: "text-link" %></li>
            <li><%= link_to "Locations", locations_path, class: "text-link" %></li>
            <li><%= link_to "Items", items_path, class: "text-link" %></li>
          </ul>
        </div>
      </div>
    </header>
```

by the commit (a commit is just the means to make a code change to a software project using Git as the version control system, or a Git repository).

# HTML and Embedded Ruby

When you look at a website, your web browser has taken some code that is HTML, CSS, and JavaScript and shown it to you as a website. That front-end code is sent to your web browser by a server. With a Rails app like this that renders HTML on the server, the server compiles some Ruby view code that is embedded Ruby in a file with the `html.erb` extension and generates the HTML of a web page which describes the web page's structure with headings, paragraphs, forms, and other familiar UI elements.

