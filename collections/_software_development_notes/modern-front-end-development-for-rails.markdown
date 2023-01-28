---
layout: post
title:  "Modern Front-End Development for Rails"
categories: ruby rails programming
permalink: /modern-front-end-development-for-rails
emoji: 🥳
mathjax: false
---

**These notes are a work in progress.**

This book is about the front-end development tools that pair with Ruby on Rails 6.1.

# Hotwire

The server renders HTML and sends it to the client (HTML over the wire). Hotwire consists of Turbo (the successor to Turbolinks) and Stimulus. All logic is on the server. A small set of generic client actions are used to retrieve the HTML from the server. Views can be repurposed. Adding or removing CSS classes is a very generic thing to handle. If already using Rails conventions, complexity will be kept low.

## Turbo

Turbo 7.00 beta fork

This does not involve writing any JavaScript. There is Turbo Drive (new name for Turbo Links according to the book), Turbo Frames, and Turbo Streams. Basically, user actions are directed into requests to get new HTML.

### Turbo Drive

When Turbo Drive is active, it will receive the response to any link click or form submission, extract its body and replace the existing page body with it while doing some other things like keeping the back button working and reducing page flickering. Performance is improved by not having to reload some large assets in the header, but not as much as Turbo Frames.

### Turbo Frames

A turbo frame is a custom HTML element `<turbo-frame>` that wraps some HTML. Any event such as a link click or form submission triggered from within the wrapped HTML will indicate to Turbo to look in the response for a turbo frame with a matching id to the `<turbo-frame>`. If it finds one, it will use it to update the matching turbo frame. There is a turbo frame tag helper which can be used to generate the turbo frame element in ERB. 

If there isn't a matching turbo frame in the response, the existing frame will be replaced by nothing. There are two ways to avoid this.

The first is the `target` attribute of the turbo frame tag (or `target` argument of the turbo frame helper method). The value of the `target` attribute is the DOM id of a different turbo frame. The turbo frame that will be updated will be the target instead of the highest level parent turbo frame.

The second way is the `data-turbo-frame` attribute. If this is set on a link or form with the value being the DOM id of a different turbo frame, then Turbo will target redrawing the turbo frame specified by that `data-turbo-frame`. The value `_top` specifies that the entire page should be redrawn.

A turbo frame may also use the `src` attribute. This will cause the contents of the frame to update once by making a request to this attribute's value. If the incoming HTML is a new turbo frame with the same `src` this may cause an infinite loop. There is also an attribute called `loading` which when given the value `lazy`, will delay the turbo frame from fetching its source until the frame is visible.

### Turbo Streams

**It is also designed to work well with websockets/ActionCable.**

This is the next step and is used when the want to allow updating multiple parts of the page from a single request. Turbo Streams allows sending an arbitrary amount of HTML to the page to replace existing stuff in multiple arbitrary locations. 

A turbo stream is another customer HTML element: `<turbo-stream>`. It has a child element of `<template>` which holds the incoming HTML. There are two attributes for turbo stream: `target` and `action`. Here `target` is again the DOM id of the element to be updated. What to do with the incoming HTML is specified by `action` and the values are `append`, `prepend`, `remove`, `replace`, and `update` where the difference between `replace` and `update` is that `replace` replaces the entire target element with the incoming HTML, whereas `update` only sets the content of the target element to the incoming HTML.

Turbo stream is also a recognized format inside the block argument to `respond_to` in a controller. Rails will look for a file with a format like `action_name.turbostream.erb` in the default way.

## Stimulus

The book uses Stimulus 2.00.

This is a JavaScript library that gives you more direct management and does involve writing JavaScript. It simplifies creating the relationship between an event and the code that is invoked in response. The opinion is that a web application is primarily on the server and the client is just to provide a small amount of interactivity. It makes extensive use of HTML attributes to specify the interaction. Unobtrusive JavaScript refers to putting the event handlers in separate files from the markup.

Generally it works by more special HTML attributes. When the page is loaded, Stimulus looks for them and instantiates the necessary controllers and sets up the event listeners. The Stimulus controllers organize the methods that are called in response to the events.

### The data-controller attribute

The `data-controller` attribute specifies the Stimulus controller to instantiate. Conventions are used around naming and file locations which allows Stimulus to find the correct controller. The Stimulus controller has the same scope as the element which caused it to be instantiated, so any target elements need to be children of that element.

You can have the same `data-controller` attribute/value on many different elements in the same page, and separate instances of the controller will be instantiated. You can also have a single `data-controller` attribute with a value that causes multiple Stimulus controllers to be instantiated.

The `connect` method of the Stimulus controller is invoked at the moment the controller is instantiated.

### The data-action attribute and action descriptors

The attribute used to define an action is `data-action` the value of this attribute has a specific format called an action descriptor and has three parts: event_name->controller_name#method_name. It is allowed to leave off the event name in which case the default event for the type of element will be used but in general it is a good practice to be explicit here. The event can also be a custom one. The `data-action` attribute supports have multiple action descriptors in the value and the controller methods will be invoked in the same order.

Stimulus passes one argument to the methods it calls. In TypeScript, its type is `CustomEvent`. This has a `target` method which returns the element which hosted the event and `currentTarget` which is the element with the `data-action` element. 

### Targets

Stimulus allows you to explicity define DOM elements of interest by specifying them as targets through an attribute with a name of the format `data-controller_name-target` with a value that is the name of the target in camelCase.

It also needs to be declared in the controller, in a static variable `targets`, which is an array of strings. The strings are the camelCase values of the target attributes.

For each target, Stimulus defines three properties on the controller that you may use, where `targetName` in the following method names would again be the camelCase content of a string in the `targets` array:
- `targetNameTarget` returns the first element in the controller's scope that declares this target
- `targetNameTargets` returns an array of the elements in the controller's scope that declare this target
- `hasTargetNameTarget` returns a boolean

These need to be declared before you use them if you are using TypeScript.

### Values

Values allow us to use attributes to store data associated with a controller. The attribute names are of the format `data-controller_name-value_name-value`. Typically these attributes are set on the same element as the `data-controller` attribute. The names of the values come from `value_name` in the name of the attribute, and their initial values are the values of the attributes.

Like the targets, the values need to be declared in the controller in a static variable called `values` which is an object. The object keys are the names of the values (matching `value_name`) and the object values are the data types. 

Similar to how it does for targets, Stimulus gives you some methods for each value you declare in the `values` object. These include a getter, setter, and a method which returns true if the attribute is present in the DOM and false otherwise.

The Stimulus API also includes a callback method which is called whenever a value is changed.

### Classes

Attributes of the form `data-controller_name-class_description-class` allow decoupling class names from the controller. The value of this attribute is the CSS class name being described. A static array of strings called `classes` declared in the controller where the strings come from the `class_description` of the attributes. Just like with targets and values, Stimulus gives us some helper methods for every class we declare in this way.

# React

React is currently the most popular JavaScript framework. This book only focuses on some of React's capabilities and does not focus on making an SPA, only simpler use cases. React is declarative. We specify what the output should be for a given state, and React works out for us how to accomplish that. React needs to know when the state changes, so we must use specific functions provided by React to change the state.

The rendering logic is on the client. Output is described using JSX, some kind of hybrid mini language between HTML and JS that generates HTML. React consumes JSON sent from the server and handles any updates that are needed when the state changes.

Most React code will be inside a React component. A component is like a template combining data with markup (JSX) that results in HTML that is sent to the DOM. JSX allows mixing JavaScript with HTML and also calls to other React components.

Components can be a function that returns a JSX element or a class with a `render` method that returns a JSX element. Functional components are the future apparently, but class components that were written already obviously will continue to exist all over the place.

An idiom for JSX is to enclose a multiline return value in parenthesis. HTML elements in JSX look pretty normal and other React components appear basically the same. If inside the angle brackets starts a word with a lowercase letter then React will know its HTML, if its an uppercase letter then React will know its a component.

`class` is a reserved word in JavaScript so in JSX it is replaced by `className`. The interpolation markers are curly braces and can contain arbitrary JavaScript expressions (that return a value).

`props` in React is short for properties. The attributes of a component are passed to the constructor as an object argument that the convention is to call `props`. The values of the attributes are written as string literals if they are string literals, or by using the interpolation markers if it something that an expression will return. They are the only allowed argument to a component. The most important thing about this is a component cannot change its own props once it has been instantiated. Changeable values in React are called state and are handled differently. 

If you ask React to render a list you must pass a `key` attribute in the props with a unique value for each element. This is used by React to keep track of which element has changed, if you do not do this then React will print a warning to the browser console.

If you use a component tag that is not self closing, then the expression inside becomes available as `props.children`. If you want to render a set of JSX elements but without a parent element then you may do so using a fragment. This is just an empty element that groups unrelated items together.

The term for the parts of a component that may change, triggering an update to how the component is displayed is state. **They must be registered as part of the state, this may be done with hooks.**

`React.useState` is a React hook method and one way to register something as the state for a functional component. It takes one argument, the initial value of of the state, but only uses that to set the state the first time the component is rendered. It returns a two element array. The first element of the array is the current value of the state. The second is the state setter, a function used to update the state.

Event handling in React is specified by a prop with a name like `onClick` and a value which is the function to call when the event happens. 

If state is shared among many different components then this becomes a little more complicated. If there is a common parent to all elements that share the state, it is common to have the state be owned by the parent and for the parent to send the state down to the children as props as well as the setting functions for changing the state. A component cannot change its own props, but it can change a state which would cause itself to be re-rendered with new props.

# CSS

For a review on CSS:
- [Learn CSS Layout](learnlayout.com)
- [Hell Yes! CSS!](wizardzines.com/zines/css).

Webpacker provides support for CSS, css processers like PostCSS, and variant languages of CSS like Sass and SCSS. In a Rails view, Webpacker also provides some helper methods like `asset_pack_path` and `image_pack_tag`.

## CSS animations

CSS properties:
- `transform` 
  - This uses transformation functions such as `rotate`, `scale`, `skew`, and `translate` to rotate, scale, skew, or translate an element.
- `transition`
  - This defines how the element changes between two states such as the duration it changes over.
  - It works for transitions caused by JavaScript and also transitions between states defined by pseudo-classes such as `:hover`.
- `animation`
  - This defines an animation between styles

# Typescript

This extends JavaScript to add type checking which makes some runtime errors less likely.

# webpack

Converts all of the front-end assets from a structure that is easy to maintain for developers to something that is better for the web browser.

# Webpacker

Rails wrapper around webpack

# Redux

Implements the reducer pattern and is commonly used with React.

{% include book_attribution.html
  book_title = "Modern Front-End Development for Rails&#58; Hotwire, Stimulus, Turbo, and React 1st Edition"
  book_author = "Noel Rappin"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "9781680507218"
  book_link = "https://www.amazon.com/Modern-Front-End-Development-Rails-Webpacker/dp/1680507214"
%}