---
layout: post
title: "Initial commit of inventory on the blog"
date: 2024-02-06 10:15:00 -0500
categories: ruby-on-rails
permalink: /inventory-initial-commit
emoji: 😋
mathjax: true
---

I developed a Rails app pretty quickly for practice, to use, and for fun recently and of course Microsoft ended Azure App Service for a Ruby runtime for Rails in 2023. But I still developed this Rails app thinking I would just pop it on Azure App Service. I feel like I want to write books explaining programming so I am just going to try to explain this program for practice writing about programming.

![Picture of inventory's GitHub repo where commits can be viewed with a web browser which you have if you're reading this on my website](assets/inventory.png)

Ok initial commit: [we don't talk about this one](https://github.com/eggrain/inventory/commit/86268a12854f2b29f26450f8acd65372caede539). That is all written by the Rails framework with a single command and a couple options. If you refer to the very first Rails guide you will see what I mean but realistically it is going to have a very steep learning curve for you if you do not know either Ruby or programming. And it has way too much boilerplate to go over anyway.

The second commit: this is just [a license](https://github.com/eggrain/inventory/commit/781d06b27e21dc7775a45f8bd8549211a83d678e) that I think is funny and I am serious when I put this license on the project because I believe it is an honorable commit. This is not a super serious app anyway, just something I wanted to make before going on an adventure, so it is not meant to be too strong just strongly copyleft.

Right, so the third commit: this is code I scaffolded up by using the Rails command line with very little editing afterwards I am pretty sure:

{% highlight Ruby %}
class ItemsController < ApplicationController
  before_action :set_item, only: %i[ show edit update destroy ]

  # GET /items or /items.json
  def index
    @items = Item.all
  end

  # GET /items/1 or /items/1.json
  def show
  end

  # GET /items/new
  def new
    @item = Item.new
  end

  # GET /items/1/edit
  def edit
  end

  # POST /items or /items.json
  def create
    @item = Item.new(item_params)

    respond_to do |format|
      if @item.save
        format.html { redirect_to item_url(@item), notice: "Item was successfully created." }
        format.json { render :show, status: :created, location: @item }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @item.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /items/1 or /items/1.json
  def update
    respond_to do |format|
      if @item.update(item_params)
        format.html { redirect_to item_url(@item), notice: "Item was successfully updated." }
        format.json { render :show, status: :ok, location: @item }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @item.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /items/1 or /items/1.json
  def destroy
    @item.destroy

    respond_to do |format|
      format.html { redirect_to items_url, notice: "Item was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_item
      @item = Item.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def item_params
      params.require(:item).permit(:name, :description, :notes, :item_id, :container, :weight, :location_id)
    end
end
{% endhighlight %}

Ok so this is a class in a text file that contains a Ruby program. The file has the `.rb` extension. It shows a custom class being defined called `ItemsController` that is inheriting from, is a child class of, or derives from the class given to you (like canned Ravioli that you just heat up) a class called `ApplicationController` which is part of Rails and is notable for having a singular pluralized name. Pretty much every other controller you will see in a Rails app will have a plural name if its going by the convention recommended by the Rails guides.

Then the first line of code inside the code inside the controller. It is specifying that there will be a filter that is invoked before some of the controller's actions. Actions are public methods of a controller that respond to HTTP requests through a routing system. In Rails for example, an action called `index` in a controller is used to respond to HTTP requests to the path `items` in this case if you do not like to call the `/` in `/items` part of the path. And `show` is an action that would respond to requests to a path of the pattern `items/:id` where :id really would be an integer in the case of this app but it could also be an universally unique identifier that will never be computed again in the universe going by language of logic. So the line `before_action :set_item, only: %i[show edit update destroy]` is simply saying before the following actions, that are `show`, `edit`, `update`, and `destroy`, run a filter called `set_item` and run it before the action is run.

Anyway the next thing of significance going by order in the source code is this:

{% highlight Ruby %}
  # GET /items or /items.json
  def index
    @items = Item.all
  end
{% endhighlight %}

That `#` starts a comment in Ruby. A comment in source code does not affect the result of compiling the program. It is ignored by the compiler and does not matter to the machine (unless you accidentally make it not a comment). It is only an aid to human beings reading the program (poor souls).

Then here we have a method being defined with the `def` keyword in Ruby. Keywords are those words reserved for use by the programming language itself and you should avoid using them as names or identifiers in your programs if you want the program to work correctly always.

Then the body of the method declares a variable and initializes it. Ruby is dynamically typed so a type of the variable does not need to be declared. At runtime, the type will have been determined by what the type of the object literal (Ruby is fiercely object-oriented and it is all objects at runtime). Here the type is a container with all of the `Item` objects that represent the data from the `items` table in the app's database which we will hopefully get to later.

Also, any variable in Ruby that starts with `@` is an instance variable and belongs to an object. An object is an instance of a class in Ruby which is like a template definition of what a certain type of object is. `@items = Item.all` declares an instance variable called `@items` and associates it some data which is a bit pattern but really it is an object with references to more objects that represent all of the items from the database through an object-relational mapping framework Active Record or pattern (Martin Fowler's architectual pattern?) active record.

The reason to declare instance variables is that they will be in scope in the view code which means they can be used in the view code. The view code is what is translated into HTML which is displayed to the user as a website. Probably we will see some of that later in this post too.

{% highlight Ruby %}
  # GET /items/1 or /items/1.json
  def show
  end
{% endhighlight %}

`@item` has been assigned a value in the before action filter. So it will be available in the view. Also, the view code files that are used for a controller action are determined through name matching. For example, the `show` action by convention and default will give its data as instance variables to the view `items/show.html.erb`. That file extension `.html.erb` is for ERB code (Embedded Ruby) which is again given to you with the Rails Ravioli.  

{% highlight Ruby %}
  # GET /items/new
  def new
    @item = Item.new
  end
{% endhighlight %}

The `new` action is for showing the page that is not for any particular item but lets you make a new one usually through a decent form.

{% highlight Ruby %}
  # GET /items/1/edit
  def edit
  end
{% endhighlight %}

This is another where the `@item` is being set in the before filter action.

{% highlight Ruby %}
  # POST /items or /items.json
  def create
    @item = Item.new(item_params)

    respond_to do |format|
      if @item.save
        format.html { redirect_to item_url(@item), notice: "Item was successfully created." }
        format.json { render :show, status: :created, location: @item }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @item.errors, status: :unprocessable_entity }
      end
    end
  end
{% endhighlight %}

Yea this is scaffolded code remember. It is for creating an item through either an HTML form and as a JSON API that might be for if you wanted a single page app like a React app which a lot of people would call good separation of concerns. The `redirect_to` method that controllers can use in their actions cause the web browser to make an HTTP request to a different path of the Rails app. In this case, `item_url(@item)` is a method `item_url` getting passed one argument `@item` that returns a string which is the path that goes to a path that will route to the `show` action of `ItemsController` and `set_item` will have assigned to `@item` for the same data from the database as the `@item` that is itself the first argument to `redirect_to`.

Looking at this `create` action some more, I think it is pretty hard to understand the first time you see it. I remember first looking at code that used this Rails idiom that allows the action to respond to different requested formats. The block argument to `format.html` is what is done to send HTML that is a website or a redirect to tell the web browser to request something different. The block argument to `format.json` is what is done when the requesting agent wants `JSON`.

The `notice: "Item was successfully created.` puts a key-value pair in a part of the response called the flash that has the value `"Item was successfully created."` and this will be available in the response to the following HTTP request. So the web browser makes a request to the other URL and a little bit of extra data from here will also be present in the response to that request - see `redirect_to item_url(@item), notice: "Item was successfully created."`.

`status: :created` is setting a status code to some number and status code I don't know. The `status: :unprocessable_entity` is one I definitely do know though. Some status codes to know are 5xx for server errors, 301 for permanent redirection, 302 for temporary redirection, 504 for gateway timeout where the nginx server doesn't get a response as it was acting as a proxy server, 418 I'm a teapot which is used by teapots with a connection to the Internet I guess.

I did explain what JSON is on this blog before but here I will just say it is a good format for exchanging data between programs over the Internet using web services. It is based on the JavaScript object.

{% highlight Ruby %}
  # PATCH/PUT /items/1 or /items/1.json
  def update
    respond_to do |format|
      if @item.update(item_params)
        format.html { redirect_to item_url(@item), notice: "Item was successfully updated." }
        format.json { render :show, status: :ok, location: @item }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @item.errors, status: :unprocessable_entity }
      end
    end
  end
{% endhighlight %}

After explaining that last one. I think this one is hopefully a bit clearer. One thing to note is that the `update` method (part of the Active Record Rails API) returns a value of either `true` if the update was successful or `false` if the update was not successful. There is a similar method `update!` that instead throws an exception which makes the problem much easier to debug and get the stack trace logged to see what happened to make the update fail. Rails validations are one potential cause. They describe rules that must hold for the record data of the object to be considered valid. I hope that the keywords `if` and `else` kind of make some intuitive sense as they control the logical control of how the program flows and what code gets logically executed at runtime etc.


{% highlight Ruby %}
  # DELETE /items/1 or /items/1.json
  def destroy
    @item.destroy

    respond_to do |format|
      format.html { redirect_to items_url, notice: "Item was successfully destroyed." }
      format.json { head :no_content }
    end
  end
{% endhighlight %}

This shows the code that deletes an item and the `head` method that is used in a controller to send an HTTP response with no content, only a status code probably which means an HTTP header.

{% highlight Ruby %}
  private
    # Use callbacks to share common setup or constraints between actions.
    def set_item
      @item = Item.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def item_params
      params.require(:item).permit(:name, :description, :notes, :item_id, :container, :weight, :location_id)
    end
end
{% endhighlight %}

Finally we see where the private methods are. In Ruby, you write the word `private` and everything following that in the class is considered private. Here we have two methods which are private so they are not actions and they do not respond to HTTP requests although they are going to be invoked as part of the preparation of the response to the request. Some folks like to indent the private methods an extra two spaces which is fine I guess (here it was done by the Rails scaffolded code). There is that `set_item` setting the `@item` like I mentioned. The `params` is a hash of key-value pairs representing values extracted from the URL path, form data, and also query parameters which are also in the URL but after the path and separated from the path by a `?`. The `params[:id]` ends up being the ID that was in the URL path. The class method call `find` on the class `Item` is used to instantiate an item object corresponding to the record in the database with that primary key `id` (the most important ID for identifying that record in the database).

The `item_params` is a strong params feature of Rails. It is an easy way to rule out mass assignment problems and basically specifies what keys are allowed in the params or something with the same effect. Inside the `params` there is a key `item` with nested values for the keys `name`, `description`, `notes`, etc. I didn't mention it earlier because I must have moved on but it is used in the actions for creating and updating an item. It is not a filter like `set_item` but it is another non-action private method of the controller.

In the commit you will also see a similar `LocationsController` class. Since the scaffolded code is so similar, I will not go over it. It is interesting that Rails is able to output code that is pretty fluent English code.

The scaffolded code includes some modules like this:

{% highlight Ruby %}
module ItemsHelper
end
{% endhighlight %}

This is an incase you want to put some methods here later sort of thing.

{% highlight Ruby %}
class Item < ApplicationRecord
  belongs_to :item
  belongs_to :location
end
{% endhighlight %}

This is the `Item` model. A model is a class that corresponds to a table in the database. The `Item` model corresponds to the `items` table in the database. It derives from the Rails Ravioli class `ApplicationRecord`. Active Record is an implementation of a pattern called the active record pattern where the classes which are called models correspond to tables in the database and the column values of the tables correspond to attributes of the corresponding objects at runtime. An item has a foreign key id that references a parent item in terms of the database schema so the model code needs to have the relationship also specified through the association `belongs_to :item`. An item also has a `location_id` in the database so there is `belongs_to :location`.

{% highlight Ruby %}
<%= form_with(model: item) do |form| %>
  <% if item.errors.any? %>
    <div style="color: red">
      <h2><%= pluralize(item.errors.count, "error") %> prohibited this item from being saved:</h2>

      <ul>
        <% item.errors.each do |error| %>
          <li><%= error.full_message %></li>
        <% end %>
      </ul>
    </div>
  <% end %>

  <div>
    <%= form.label :name, style: "display: block" %>
    <%= form.text_field :name %>
  </div>

  <div>
    <%= form.label :description, style: "display: block" %>
    <%= form.text_area :description %>
  </div>

  <div>
    <%= form.label :notes, style: "display: block" %>
    <%= form.text_area :notes %>
  </div>

  <div>
    <%= form.label :item_id, style: "display: block" %>
    <%= form.text_field :item_id %>
  </div>

  <div>
    <%= form.label :container, style: "display: block" %>
    <%= form.check_box :container %>
  </div>

  <div>
    <%= form.label :weight, style: "display: block" %>
    <%= form.text_field :weight %>
  </div>

  <div>
    <%= form.label :location_id, style: "display: block" %>
    <%= form.text_field :location_id %>
  </div>

  <div>
    <%= form.submit %>
  </div>
<% end %>
{% endhighlight %}

This is some view code in the file `app/views/items/_form.html.erb`. It is a partial and you can tell it is a partial because the file name begins with an underscore. It is reused in a few view code templates: `new.html.erb` and `edit.html.erb` which I hope should be intuitive.

Honestly I think that's enough for one post. I may need to jump around in the commits a little bit more than go this linearly as the real logic is not this linear. Anyone still reading this is pretty weird by the way but it could be helpful to someone in the future. I may try to write about commits after a shorter period of writing the code, at least if they are interesting or helpful.