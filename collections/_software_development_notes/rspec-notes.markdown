---
layout: post
title:  "RSpec notes"
categories: ruby programming rspec
permalink: /rspec-notes
emoji: 🥵
mathjax: false
---

RSpec is described as a DSL for testing and describing the behavior of objects.

Usually the RSpec tests are written in a directory `spec` that has additional directories that parallel the structure of the application source code files. This kind of mapping between the application files and spec files makes the project easy to understand and helps facilitate finding and switching to relevant files easily.

The `rspec` command is used to run the RSpec test suite. If given a file or directory argument, it runs the subset of the test suite inside that file or directory. The `--format doc` option formats the output in a way that reflects the nested structure of the example groups in the test suite.

An `example group` is declared using the `describe` method and an `example` is declared using the `it` method. A good practice is to only have a single expectation per example.

Although RSpec does not use the "given, when, then" words or Gherkin language as explicitly as Cucumber, RSpec does have roots in BDD and the specs can be designed with these terms in mind. While Cucumber generally describes the application behavior from the outside, RSpec focuses on much more granular application behavior (specifically, the objects).

{% include attribution-book.html
  book_title = "The RSpec Book: Behaviour Driven Development with RSpec, Cucumber, and Friends"
  book_author = "David Chelimsky, Dave Astels, Bryan Helmkamp, Dan North, Zach Dennis, Aslak Hellesoy"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "978-1934356371"
  book_link = "https://www.amazon.com/RSpec-Book-Behaviour-Development-Cucumber/dp/1934356379"
%}