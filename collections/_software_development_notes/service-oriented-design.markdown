---
layout: post
title:  "Service-Oriented Design (book)"
categories: ruby rails programming
permalink: /service-oriented-design-with-ruby-and-rails
emoji: 🥳
mathjax: false
---

These are some notes I took while reading [Service Oriented Design with Ruby and Rails](https://www.amazon.com/Service-Oriented-Design-Rails-Addison-Wesley-Professional/dp/0321659368). This book is a little old but definitely worth reading (it's a buy), especially if you are a Rails developer spending your workdays toiling on a monolith and daydreaming about smaller code bases.

# What is a service?

A service is a system that responds to HTTP requests. It may also be defined as a system that provides some functionality through a standard interface. Amazon's service-oriented approach to its internal systems informed its development of Amazon Web Services.

Services can be isolated as different code bases that run on the same server and use the same database. They can also run on the same server but use different databases. Full isolation is when the service has its own code base, physical server, and database.

Usually the Rails application starts off as a monolith with one server running the application server, web server, and background processes and a separate server for the database. Caching with Memcached and load balancers are added, and then the design and planning of how best to partition the monolith into services begins.

Some considerations here are iteration speed (what parts are stable vs. rapidly changing), logical function (S3 is a good example of a service with one function), and data optimization needs and join frequency.

## Advantages of web services

- Service test suites can be run in isolation
  - Tests will be run more often
- Different services can have their varying optimization needs be met separately
  - Some data has high write frequency, other data has high read frequency
- Developers can focus on the services that they are responsible for
  - Helps to scale the absolute size of the entire team
- With proper design, web services can be more agile in the long term
  - Helps to scale the absolute size of the application
- Web services can utilize different technologies that might be better for specific purposes
  - Not every service needs to be a Ruby application
- Services can be scaled independently of each other
- Multiple applications can use the same service for a shared functionality (e.g. user authentication)

## Disadvantages of web services

- More big up-front design
  - This may be less agile in the beginning
  - No standard architecture
  - Lots of tradeoffs to consider
  - The final design can vary considerably
- Versioning services increases complexity
  - Multiple versions of a service may be run at the same time
- Joins between data will need to happen across services
- Services introduce other kinds of complexity compared to one monolith

# Other topics covered in the book

There is a lot of high quality information, code examples, and useful advice in this book about all of the following topics:

- Testing services
- Versioning services
  - Versioning with URLs vs. HTTP headers
  - Internal vs. external facing APIs
- API design
  - Representational state transfer
- Running requests in parallel
  - Asynchronous vs. multiple threads
- Performance logging
- Client libraries
- JSON, XML, and SOAP
- Load balancing software and algorithms
  - Unicorn, Phusion Passenger, and HAProxy
  - Random, round robin, least connections, URI-based load balancing algorithms
- Caching
  - HTTP based caches
  - Memcached
- Security, messaging, the CAP theorem, and web hooks

{% include attribution-book.html
  book_title = "Service-Oriented Design with Ruby and Rails"
  book_author = "Paul Dix"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0321659361"
  book_link = "https://www.amazon.com/Service-Oriented-Design-Rails-Addison-Wesley-Professional/dp/0321659368"
%}
