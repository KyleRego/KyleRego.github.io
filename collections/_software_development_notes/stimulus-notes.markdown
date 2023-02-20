---
layout: post
title:  "Stimulus notes"
categories: javascript rails programming stimulus hotwire
permalink: /stimulus-notes
emoji: 🥳
mathjax: false
---

Stimulus is the second part of Hotwire. In contrast to Turbo, it does involve writing some JavaScript, but it also allows you to manage what happens even more directly.

When the page is loaded, Stimulus looks for some special HTML attributes which it uses to instantiate the necessary controllers and set up the event listeners. The Stimulus controllers organize the methods that are called in response to the events.

## The data-controller attribute

The `data-controller` attribute specifies the Stimulus controller to instantiate. Conventions are used around naming and file locations which allows Stimulus to find the correct controller. The Stimulus controller has the same scope as the element which caused it to be instantiated, so any target elements need to be children of that element.

You can have the same `data-controller` attribute/value on many different elements in the same page, and separate instances of the controller will be instantiated. You can also have a single `data-controller` attribute with a value that causes multiple Stimulus controllers to be instantiated.

The `connect` method of the Stimulus controller is invoked at the moment the controller is instantiated.

## The data-action attribute and action descriptors

The attribute used to define an action is `data-action` the value of this attribute has a specific format called an action descriptor and has three parts:

`event_name->controller_name#method_name`

It is allowed to leave off the event name in which case the default event for the type of element will be used but in general it is a good practice to be explicit here. The event can also be a custom one. The `data-action` attribute supports multiple action descriptors in the value and the controller methods will be invoked in the same order.

Stimulus passes one argument to the methods it calls. In TypeScript, its type is `CustomEvent`. This has a `target` method which returns the element which hosted the event and `currentTarget` which is the element with the `data-action` element. 

## Targets

Stimulus allows you to explicity define DOM elements of interest by specifying them as targets through an attribute with a name of the format `data-controller_name-target` with a value that is the name of the target in camelCase.

It also needs to be declared in the controller, in a static variable `targets`, which is an array of strings. The strings are the camelCase values of the target attributes.

For each target, Stimulus defines three properties on the controller that you may use, where `targetName` in the following method names would again be the camelCase content of a string in the `targets` array:
- `targetNameTarget` returns the first element in the controller's scope that declares this target
- `targetNameTargets` returns an array of the elements in the controller's scope that declare this target
- `hasTargetNameTarget` returns a boolean

These need to be declared before you use them if you are using TypeScript.

## Values

Values allow us to use attributes to store data associated with a controller. The attribute names are of the format `data-controller_name-value_name-value`. Typically these attributes are set on the same element as the `data-controller` attribute. The names of the values come from `value_name` in the name of the attribute, and their initial values are the values of the attributes.

Like the targets, the values need to be declared in the controller in a static variable called `values` which is an object. The object keys are the names of the values (matching `value_name`) and the object values are the data types. 

Similar to how it does for targets, Stimulus gives you some methods for each value you declare in the `values` object. These include a getter, setter, and a method which returns true if the attribute is present in the DOM and false otherwise.

The Stimulus API also includes a callback method which is called whenever a value is changed.

## Classes

Attributes of the form `data-controller_name-class_description-class` allow decoupling class names from the controller. The value of this attribute is the CSS class name being described. A static array of strings called `classes` declared in the controller where the strings come from the `class_description` of the attributes. Just like with targets and values, Stimulus gives us some helper methods for every class we declare in this way.


{% include attribution-book.html
  book_title = "Modern Front-End Development for Rails&#58; Hotwire, Stimulus, Turbo, and React 1st Edition"
  book_author = "Noel Rappin"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "9781680507218"
  book_link = "https://www.amazon.com/Modern-Front-End-Development-Rails-Webpacker/dp/1680507214"
%}