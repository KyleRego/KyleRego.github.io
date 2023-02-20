---
layout: post
title:  "React notes"
categories: javascript react programming
permalink: /react-notes
emoji: 
mathjax: false
---

React is currently the most popular JavaScript framework.

React is declarative (we declare what the output should be with respect to the state and React figures out how to make it happen). React needs to know when the state changes, so we must use specific functions provided by React to change the state.

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

{% include attribution-book.html
  book_title = "Modern Front-End Development for Rails&#58; Hotwire, Stimulus, Turbo, and React 1st Edition"
  book_author = "Noel Rappin"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "9781680507218"
  book_link = "https://www.amazon.com/Modern-Front-End-Development-Rails-Webpacker/dp/1680507214"
%}