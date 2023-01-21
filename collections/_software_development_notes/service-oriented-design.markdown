---
layout: post
title:  "Service-Oriented Design with Ruby and Rails"
categories: ruby rails programming
permalink: /service-oriented-design-with-ruby-and-rails
emoji: 🥳
mathjax: false
---

**This note is a work in progress. This book is really excellent though.**

# What is a service?

A service is a system that responds to HTTP requests. A broader definition may be a system that provides some functionality through a standard interface. This book generally uses the first definition and focuses on services which follow a RESTful paradigm.

# Service-oriented design

A service-oriented approach provides many advantages, but it does require more up-front design around how to separate logic and data in an application. Amazon's service-oriented approach to its internal systems informed its development of Amazon Web Services. The parts of a Rails application that are best extracted to services are those with the most stable and well understood requirements.

## Isolation

Services can be tested, optimized, and deployed separately. The time required to run tests will decrease, since as long as the public interface to a service is well tested, changes to that service which do not change its public API only require the test suite for that specific service to be run.

### Business logic isolation

Services isolated based on business logic generally have their own application code (multiple code bases) but have shared data stores and run on shared systems. They should not communicate with each other through the database. This may be a necessary step when migrating an existing large Rails application to services.

### Shared system isolation

These services have their own databases but are still running on shared systems. This can be a tricky situation to manage which may affect scaling.

### Full isolation

Each service has its own completely separate code base, data store, and server.

## Scalability

Applications that rely on services can scale to a greater complexity. With services, the different parts of the application can be scaled individually. By splitting data into multiple data stores, the individual optimization needs of each part can be met separately, rather than trying to optimize a single database for the needs of every use case.

Services make it easier to scale team size since developers only need to be familiar with certain services. Services allow the absolute size of the application in terms of the code base to scale in an easier way than if it were a monolith. A very large application has too much code for anyone to be familiar with, and the tests take longer to run. 

Properly designed services may be more agile than a monolith. Versioning the services can be important here and it may be necessary to maintain the ability to run multiple versions of a service simultaneously. As long as an update to the API of a service is purely additive, the service can remain at the same version.

## Robustness

This is similar to encapsulation in object-oriented design. In that context, encapsulation refers to being able to change the underlying implementation of a class without any part of the application which depends on that class breaking. A service encapsulates an entire section of an application.

## Interoperability

If a section of the application would benefit from being implemented with a language or technology other than Ruby and Rails, then the service may be implemented using that other technology.

Code reuse is another good reason to use services. If multiple applications have shared functionality, they could use a shared service for that functionality. Exposing a public API for an application with services may be as simple as exposing an already existing API to the public.

# Converting a monolith into services

A Rails application usually starts as a single code base with tests and a single database. There may be a server hosting the application server and web server and a different physical server for the database. Background processes which are tightly coupled to the application server will also be running. More complexity usually comes with the addition of Memcached and more servers to handle more HTTP requests behind a load balancer. Upgrading the hardware and determining where queries can be optimized by performance logging are common next steps when the database is unable to keep up with the number of requests.

The parts of the application which are very well defined should be the first considered to be extracted as services.

When breaking up parts of a monolith into services, associations between models may need to reach across from one service to another. It will need to be decided which services should own which models. Some considerations about this are the read and write/update frequency of different models and which joins occur the most frequently.

The first step may be to extract only models into services. Applications that have many views will benefit from having the views and controllers also broken into services. There are different forms that the final service-oriented design can take.

# Service and API design

Services generally do require more up-front design but will help to improve flexibility in the long run. Some of the hardest service-oriented design decisions are around how to partition an application into different services.

## Iteration speed

Services are best used for parts of the application with well defined requirements and a stable API. When these conditions are met, optimization of the service should generally not be disruptive. Typically, the project will start out as a Rails monolith, and as certain parts become more stable they can be extracted into services. Parts of the application that are being frequently changed may generally be kept within the standard framework of Rails.

## Logical function

The Amazon Simple Storage Service (S3) is a good example of a service that extracts a single logical function.

## Read/write frequency

Some data may need to be read very frequently while other data may need to be written to very frequently. Since there can be tradeoffs when trying to optimize both of these cases at the same time, dividing functionality into services that deal only with one or the other can allow these cases to be optimized separately.

## Join frequency

Joins are expensive, and joins that reach across the boundaries of services are even more so but may be a necessary tradeoff.

## Versioning services

A common way of versioning services is to include the version number in the URL. A more RESTful approach may be use the `Accept` HTTP header (a header which is usually used to indicate what content type, expressed as a MIME type, that the requester is able to understand) with a custom MIME type value that indicates the version, but some caching servers may not pay attention to this which could lead to unpredictable behavior. 

Internally facing APIs should support multiple versions of a service only while all of the client libraries are being updated. Externally facing APIs may need to support multiple versions for a long time.

## API design

URIs should by as conventional as possible, and the Rails conventions are a good starting point. Response status codes should also be conventional and the book describes many common ones. It is also a good idea to use the response headers around HTTP caching. Following standard conventions makes it easier to develop shared client libraries across all services.

Joins should occur at the highest level in the service call stack to avoid redundant calls to multiple services. Some of the services may not need all of the join data. Caching at the level of the application server is preferable since the services should only have to cache data that they are responsible for. Another considerations is the number of sequential service calls necessary to perform a nested join.

APIs should generally start out relatively atomic and working for general cases. More advanced, specific functionality that is needed can be implemented in a later stage of development for very frequent client use cases. This should not be added too aggressively because it increases the complexity of caching and error handling.

This may involve multiple-GET calls or calls that return multiple models. Multi-get refers to retrieving data for multiple IDs at once and may be the response to a GET or POST request. A GET request would probably have a query string with the list of ids. The issue with that is the limitation on the URL length. Web browser URL limits are generally the shortest but may not matter if the service is only responding to requests from other services. Nginx and Apache have longer URL length limits but these still may not be long enough. A POST request may include the list of IDs as a JSON array in the request body or the params hash format expected by Sinatra and Rails applications. The response may be a JSON array of objects or a JSON hash where the IDs are keys and the values are the requested records.

# Final API design

There is a lot of flexibility around designing the API endpoints and a lot of it has to do with aesthetics. Some considerations include representing data in the URL vs the body of the request and what HTTP method to use. Keeping the interface RESTful, as well as keeping API endpoints and data descriptive and human readable, are worthy goals.

# Running requests in parallel

The requests in a service-oriented approach generally need to be run in parallel because waiting for a response is a blocking I/O operation. The two approaches for doing so discussed here are running the requests asynchronously on in multiple threads.

## Asynchronous

The asynchronous approach uses the reactor design pattern to allow the program to continue to execute while waiting for data. Common handler code is called when each request is done. Typhoeus, a library created by the book's author, works this way. The `Typhoeus::Hydra` class queues the requests. The `run` method is a blocking call that runs all of the queued requests in parallel. The handler code for each request is a block argument to the `on_complete` method of the request, which yields the response object to the block. This block argument can add more requests to the `hydra` which will run in parallel after that request completes.

## Multiple threads

The multi-threaded approach puts each of the blocking I/O calls into its own thread which allows program execution to continue in the primary thread. There book discusses the different implementations of threading between Ruby 1.8, 1.9, JRuby, and Rubinius which can affect performance. A couple fairly simple examples of how to run parallel requests with multiple threads are given.

One way is to make a new thread for each request and push the responses into a queue, which is thread safe. `Thread#join` pauses execution of the main thread while a thread finishes, so iterating over the threads and calling this method on them will prevent execution from continuing until all of the threads have completed.

A thread pool could also be used. This uses a queue for the URLs and responses. Whenever a URL is pushed into the URL queue, a thread pops it off and runs the request, and when that's done it pushes the response to the response queue. The number of threads in the thread pool is the number of requests that can be run in parallel.

## Performance logging, error conditions, and testing

It is a good idea for the client to record statistics about the response times and how many requests are successful.

Some error conditions can be anticipated and handled, but other will need to be logged and inspected later. Some error conditions may need to just be handled with a retry.

When testing the client, service responses can be mocked but will be very coupled to the service API. If the API changes, the client may be broken despite the tests passing. A full integration test that actually calls the service may be a good idea but raises the question of how the development environment should connect to services for testing.

# Developing client libraries for services

The obvious way to deploy and install client libraries is by using RubyGems. There are a few different options to manage a private gem.

In general the client libraries should not have to make the requests themselves. Instead, they should create request objects that are given to some kind of manager which actually sends the HTTP messages. It is also a good idea to use certain conventions across the libraries so that the common logic can be extracted to a module and included into every client library. Another consideration is making sure the client libraries do not have to manage the requests themselves; they should share a manager that allows all of the different clients to queue requests at the same time. It is also a good idea to keep client libraries with their service to integration test them without having to do so over the network.

## Parsing JSON

JSON essentially consists of an array of values or an object of keys and values, where the object keys are strings and the array/object values can be strings, numbers, arrays, or objects. There are different Ruby libraries for parsing JSON such as the JSON gem and yajl (yet another JSON library). The latter may offer better performance than the standard JSON gem. It is a good idea to encapsulate the parsed JSON data in a class.

# Some terminology

- Latency: the amount of time a request takes (milliseconds)
- Throughput: the amount of requests a service processes over time (requests/second)
- Vertical scaling: upgrading the servers, such as increasing their memory
- Horizontal scaling: adding more servers

# Load balancing

Load balancing in this context is distributing the workload of a service over multiple processes and/or servers. 

There are different algorithms a load balancer may use to distribute the requests to services:
- The simplest algorithm just randomly chooses a service to handle each request.
  - This may not work that well because of randomness. 
- The Round Robin algorithm iterates through the services in a specific order.
  - This might be good enough if all of the requests take approximately the same amount of computation to handle.
  - Consider what happens when a single-threaded Ruby process handling a request which takes a long time to process is asked to handle a request which should take a short time. 
- The least connections algorithm keeps track of how many requests each service is handling and sends the next request to the service with the least. 
- A URI-based load balancing algorithm would send certain types of requests to specific services.
  - This increases the cache-hit ratio.

Load bouncers are primarily classified as hardware for software. Software load balancers are less expensive and much more common. They may be part of a larger piece of sofware such as a web or application server or they may be their own separate piece of software.

Unicorn and Phusion Passenger are larger pieces of Ruby server software that include load balancing. Both maintain a pool of worker processes and will only ask a worker to handle a request if it is not already handling one, since they are single-threaded. This is an example of a least connections algorithm.

HAProxy is a free and open source TCP and HTTP load balancer that is easy to configure and includes a web interface for debugging and monitoring performance. If the services were being run with an application server such as Unicorn or Phusion Passenger, HAProxy could be configured to balance the traffic across the servers. It could also be configured to balance traffic to individual processes if an application service that does not implement a worker pool was being used.

# Caching

Caching is storing the result of a computation so that later when it is needed, the computation will not have to be repeated. An application with high load demands should take advantage of both internal and external caching. Internal caching uses the memory of the Ruby process. External caching takes advantage of HTTP headers. 

## Memcached

This type of internal cache is essentially a key-value store. Adding things to the cache is easy, but invalidating keys that are no longer valid can be a more difficult issue. Simply expiring a key after a certain amount of time is a simple approach that may be good enough for some purposes. When that is insufficient, a manual strategy of expiring keys when things happen which would change their value may be used. The difficulty is determining every possible event that could invalidate a key's value. The least recently used eviction algorithm takes advantage of Memcached expiring the least recently used keys to make room for newer keys.

## HTTP

There are two types of HTTP based caches that can intercept a request: proxy caches and gateway caches/reverse proxy caches. Proxy caches are not relevant for web services. 

The `Cache-Control` header can be added to a response by the service to cause the gateway cache to not ask the service for a new response for that request until a certain amount of time has passed. The value of this header is the number of seconds to wait before asking for the same data.

The `Last-Modified` and `ETag` headers can be used for validation caching. Either of these headers will still cause the gateway cache to send a request to the service, but the service may respond with a 304 Not Modified response.

Rack::Cache implements a gateway proxy as Rack middleware and supports both time expiration and validation caching. There are other options that offer more configuration and possibly better performance but may be significantly harder to install.

## XML

Sometimes you need to integrate with an applicaton that gives data as XML. REXML and Nokogiri were two good options at the time the book was written. XPath is a language for addressing elements in an XML document and both REXML and Nokogiri have support for it. Nokogiri also has support for addressing elements using CSS3 selectors and is faster than REXML because it is backed by C libraries but this also makes it more complex to install.

It's a good idea to maintain a class for each logical grouping of data that you are parsing. Attribute readers and keeping the logic of parsing the XML in a single public method help to make it easy to understand what data the class holds and where the parsing happens. It's also a good practice to pass a Ruby object to the constructor rather than an unparsed XML string.

## SOAP (Simple Object Access Protocol)

This is a specification for implementing a web service with XML. A service using this specification exposes its interface through a Web Services Description Language (WSDL) file, which itself is an XML file. Inspecting this is the easiest way to explore a SOAP service's interface.

# Security

The three main things to make sure you have are authentication, authorisation, and encryption. Authentication is making sure the user is who they say they are and that the message received from them has not been tampered with. Authorization is about what the user is allowed, or authorized to do. Encryption is making sure that an intercepted message cannot be understood. Just having one thing in place for each of these three security aspects is not sufficient, but some things contribute to multiple of these aspects anyway.

## HTTP authentication

HTTP authentication is as simple as adding an Authorization header to the message by the client and instructing the server to bounce requests based on the header. Since the username and password are cleartext in the header, this needs to be done over HTTPS.

Signing requests with a signature is one way to prevent man-in-the-middle attacks. HMAC (a hash-based message authentication code) is one of the easiest ways to do this; the server and client have a shared key which is used by the client and server to create the signature, which allows the server to verify that the signature it gets using the key is the same as what it received from the client.

An issue with this is it does not prevent replay attacks where a listener could intercept a request and then send it later so it can inspect the respones. To prevent this, a time should be included in the request so that the server can make sure it is close to the time it receives the request.

Another issue with this is a shared secret must be provided to the client which introduces the possibility of it being intercepted.

The RSA algorithm and using public/private key pairs avoids this. The client creates a pair of keys and sends one to the server (the public key). The client encrypts its messages to the server with its private key and then the server is able to decrypt them using the public key.

The client can also verify that the server is who they say they are using the server's SSL certificate.

## Authorization

A firewall can restrict access to only a set of known IP addresses, and also restrict what ports they can connect to. Role-based access control assigns users to roles and their roles determine what they are allowed to access.

## Encryption

With an SSL certificate, all communication with the service will be encrypted.

# Messaging

Asynchronous messaging can also be used for services to communicate with each other. This usually involves queues.

RabbitMQ is an open-source implementation of the AMQP standard. This is an application layer protocol for software sending and receiving messages between distributed systems. Two client libraries for interacting with AMQP/RabbitMQ are the AMQP Client and Bunny.

The following discussion about queues, exchanges and bindings, and durability focuses on these ideas in AMQP/RabbitMQ.

## Queues

The client can send a message to the server to create a queue in an idempotent way. Messages are added to the queue and workers take the messages off the queue. 

## Exchanges and Bindings

An exchange is a kind of message router which receives messages and then routes them to queues. Producer refers to a process which sends messages to exchanges.

### Direct Exchanges

A direct exchange sends messages to queues based on a direct match between the routing key of the message and the routing keys of the bindings which are related to the queues. Queues can have multiple bindings.

### Fanout Exchanges

A fanout exchange sends messages to a set of queues which are bound to it and does not look at the routing keys.

### Topic Exchanges

A topic exchange can match messages to queues using wildcards in the bindings, with a somewhat different syntax compared to regular expressions.

## Durability

Durability refers to the ability to survive server restarts or crashes. In this context we are thinking about if the exchanges and queues have durability. Persistence refers to whether the messages will remain on the disk after server restarts or crashes. With RabbitMQ, durability can be set on the exchanges and queues and persistence can be set on the messages.

## The Cap Theorem

This theorem states that only two of consistency, availability, and partition tolerance can be strictly maintained in a distributed system.

Consistency refers to data consistency across replicated systems. Availability is the system's ability to serve requests. Partition tolerance is the ability to tolerate failures in network connectivity.

If the requirement for consistency is weakened to eventual consistency then all three can be maintained. Designing for eventual consistency takes some effort on the part of the application programmer.

# Web Hooks and External Services

{% include book_attribution.html
  book_title = "Service-Oriented Design with Ruby and Rails"
  book_author = "Paul Dix"
  book_publisher = "Addison-Wesley Professional"
  book_isbn = "978-0321659361"
  book_link = "https://www.amazon.com/Service-Oriented-Design-Rails-Addison-Wesley-Professional/dp/0321659368"
%}