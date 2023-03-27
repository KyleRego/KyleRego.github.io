---
layout: post
title: "Ruby and Rails resources"
categories: ruby programming
permalink: /ruby
emoji: ❤️
mathjax: false
small_title: true
---

This page is a collection of links to documentation, articles, books, and libraries related to Ruby and Rails.

- [Ruby guides, tutorials, and reference material](https://www.ruby-lang.org/en/documentation/)
  - [Official API documentation](https://docs.ruby-lang.org/en/)
    - [Ruby 2.7](https://docs.ruby-lang.org/en/2.7.0/)
    - [Ruby 3.2](https://docs.ruby-lang.org/en/3.2/)
- [Rails guides](https://guides.rubyonrails.org/)
- [The Rails doctrine](https://rubyonrails.org/doctrine)
- [How to make a gem](https://guides.rubygems.org/make-your-own-gem/)
- [RubyGems .gemspec reference](https://guides.rubygems.org/specification-reference/)

## Articles

- [The Case Against Monkey Patching](https://shopify.engineering/the-case-against-monkey-patching)
- [Feature Tests vs. Integration Tests vs. Unit Tests](https://mixandgo.com/learn/ruby-on-rails/feature-vs-integration-vs-unit-tests)

## Books

- [Design Patterns in Ruby](https://www.amazon.com/Design-Patterns-Ruby-Russ-Olsen/dp/0321490452/ref=sr_1_1?crid=2NPII8XEZBIRI&keywords=design+patterns+ruby&qid=1675739319&s=books&sprefix=design+patterns+ruby%2Cstripbooks%2C100&sr=1-1&ufe=app_do%3Aamzn1.fos.18ed3cb5-28d5-4975-8bc7-93deae8f9840)
  - This book covers the 14 most relevant Gang of Four design patterns for Ruby programmers. I haven't finished reading it yet.
- [Metaprogramming Ruby](https://www.amazon.com/Metaprogramming-Ruby-Program-Like-Pros/dp/1934356476)
  - If you've seen things like `class << self` in your codebase and aren't sure what that means, you should probably read this. It covers somewhat advanced topics like the Ruby object model, scope flattening, closures, ghost methods, and more, as if a more senior developer was giving you mini-lectures at your new job.
- [Practical Object-Oriented Design: An Agile Primer Using Ruby](https://www.amazon.com/Practical-Object-Oriented-Design-Agile-Primer/dp/0134456475/ref=pd_lpo_2?pd_rd_w=fujt0&content-id=amzn1.sym.116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_p=116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_r=Z8EPG65DMRBH054G5PM1&pd_rd_wg=XEGYO&pd_rd_r=de83e3d0-a6af-42b1-abbb-3da70ee64f75&pd_rd_i=0134456475&psc=1)
  - This book improved the way I think about object-oriented programming. It covers topics like how to focus on the messages between objects, minimizing dependencies and coupling, and how to structure tests to be maintainable. It also uses UML sequence diagrams at times to make abstract discussions more concrete, which I thought was interesting.
- [Modern Front-End Development for Rails: Hotwire, Stimulus, Turbo, and React (1st Edition)](https://www.amazon.com/Modern-Front-End-Development-Rails-Webpacker/dp/1680507214)
  - As a primarily backend web developer, I read this to learn about Hotwire. This book delivered on that and then some (I learned a fair bit about React too). I also haven't finished reading this one.
- [Rails Anti-patterns](https://www.amazon.com/Rails-AntiPatterns-Refactoring-Addison-Wesley-Professional/dp/0321604814)
  -  This book covers a wide range of Rails anti-patterns using Rails 3, with explanations of what to do instead.
- [The RSpec Book](https://www.amazon.com/RSpec-Book-Behaviour-Development-Cucumber/dp/1934356379)
  - A nice introduction to RSpec, BDD, Cucumber, and other tools for testing. Some of the syntax may be outdated, but it's still worth reading in general.
- [Service-Oriented Design with Ruby and Rails](https://www.amazon.com/Service-Oriented-Design-Rails-Addison-Wesley-Professional/dp/0321659368)
  -  If you're working on a Rails monolith and dream of smaller code bases, you may find this book interesting. I personally probably wouldn't try to break up a monolith into services without first going back to this book and considering its advice.

## Libraries

- [jekyll](https://github.com/jekyll/jekyll)
- [rdoc](https://github.com/ruby/rdoc)
- [rubocop](https://github.com/rubocop/rubocop)
- [rubyzip](https://github.com/rubyzip/rubyzip)
- [simplecov](https://github.com/simplecov-ruby/simplecov)
- [sqlite3](https://github.com/sparklemotion/sqlite3-ruby)
