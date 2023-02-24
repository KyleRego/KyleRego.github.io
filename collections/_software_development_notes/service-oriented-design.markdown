---
layout: post
title:  "Service-Oriented Design (book)"
categories: ruby rails programming
permalink: /service-oriented-design-with-ruby-and-rails
emoji: 🥳
mathjax: false
---

These are some notes on web services that I took while reading [Service Oriented Design with Ruby and Rails](https://www.amazon.com/Service-Oriented-Design-Rails-Addison-Wesley-Professional/dp/0321659368). This book is a little old but definitely still worth reading (it's a buy), especially if you are a developer spending your workdays toiling on a Rails monolith and daydreaming about smaller code bases.

Other related topics that the book offers a lot of information or advice about are testing services, versioning services (with URLs vs. HTTP headers), RESTful API design, running requests in parallel (asynchronous vs. multiple threads), performance logging, client libraries, JSON, XML, SOAP, load balancing software (Unicorn, Phusion Passenger, and HAProxy) and algorithms (random, round robin, least connections, URI-based to increase cache hit ratio), caching, security, messaging, the CAP theorem, and web hooks.

# What is a service?

A service is a system that responds to HTTP requests. It may also be defined as a system that provides some functionality through a standard interface. Amazon's service-oriented approach to its internal systems informed its development of Amazon Web Services.

Services can be isolated as different code bases that run on the same server and use the same database. They can also run on the same server but use different databases. Full isolation is when the service has its own code base, physical server, and database.

Usually the Rails application starts off as a monolith with one server running the application server, web server, and background processes and a separate server for the database. Caching with Memcached and load balancers are added next, and then later the design and planning of how best to partition the monolith into services begins.

Some considerations here are iteration speed (what parts of the monolith are stable vs. rapidly changing), logical function (S3 is a good example of a service with one function), and data optimization needs and join frequency.

## Advantages of web services

- With good design, web services can be more agile in the long term
  - The absolute size of the application can scale to a larger size
- Developers can take responsibility for certain services
  - The entirety of the code is probably big enough that each developer can only understand parts of it anyway
  - Services hide complexity similar to encapsulation in object-oriented programming
  - Helps to scale the absolute size of the entire team
- Services can be scaled independently of each other
  - Horizontally scale only where it's strictly needed
- Service test suites can be run in isolation
  - Less time wasted waiting for tests to run
- Services can have their differing optimization needs be met separately
  - Some data has high write frequency while other data has high read frequency
- Web services can use technologies that might be better for specific purposes
  - Not every service needs to be a Rails or Sinatra application
- Multiple applications can use the same service for a shared functionality

## Disadvantages of web services

- More big up-front design
  - This may be less agile in the beginning
  - Lots of tradeoffs to consider
  - No standard architecture--the final design can vary considerably
- Services introduce other kinds of complexity compared to a monolith
  - Such as having to mock service API responses but also having to end-to-end test functionality involving service clients and multiple code bases
- Versioning services can increase complexity
  - Multiple versions of a service may be run at the same time
    - Especially so if the service API is exposed externally
- Joins between data will need to happen across services

{% include attribution-book.html
  book_title = "Service-Oriented Design with Ruby and Rails"
  book_author = "Paul Dix"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0321659361"
  book_link = "https://www.amazon.com/Service-Oriented-Design-Rails-Addison-Wesley-Professional/dp/0321659368"
%}
