---
layout: post
title:  "RSpec notes"
categories: ruby programming rspec
permalink: /rspec-notes
emoji: 🧪
mathjax: false
---

RSpec is described as a BDD tool for Ruby programmers and DSL for testing and describing the behavior of objects.

Although RSpec does not explicitly use the "given, when, then" words or Gherkin language like Cucumber, the specs can be designed with the same intention (to provide executable documentation). While Cucumber generally describes the application behavior of features from the outside, RSpec focuses on much more granular application behavior (specifically, the objects).

Usually the RSpec tests are written in a directory `spec` that has additional directories and files that parallel the structure of the application directories and source code files (e.g. the specs for `app/models/book.rb` are expected to be in `spec/app/models/book_spec.rb`). This kind of mapping helps make understanding the project and finding the relevant files easier.

# The rspec command

The `rspec` command is used to run the RSpec test suite. If given a file or directory argument, it runs the subset of the test suite inside that file or directory. A line number can be appended to a file argument (e.g. `rspec spec/example.rb:10`) to run the subset of tests in that file specified by the line number.

The `--format doc` option formats the output in a way that reflects the nested structure of the example groups in the test suite. To see all of the options, use the `--help` option.

# The specs

An `example group` is declared using the `describe` method and an `example` is declared using the `it` method. A good practice is to only have a single expectation per example.

The `subject` method is intended to be used to setup an instance variable with the object being described. The return value of a block passed to this method becomes the subject. The subject may be defined in other ways too, like calling a class method.

{% include attribution-book.html
  book_title = "The RSpec Book: Behaviour Driven Development with RSpec, Cucumber, and Friends"
  book_author = "David Chelimsky, Dave Astels, Bryan Helmkamp, Dan North, Zach Dennis, Aslak Hellesoy"
  book_publisher = "Pragmatic Bookshelf"
  book_isbn = "978-1934356371"
  book_link = "https://www.amazon.com/RSpec-Book-Behaviour-Development-Cucumber/dp/1934356379"
%}