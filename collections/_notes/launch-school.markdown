---
layout: post
title:  "Launch School"
categories: programming ruby javascript sql [launch school]
permalink: /launch-school
emoji: 🙂
mathjax: false
---

[Launch School](https://launchschool.com) is a website that teaches a course on web development fundamentals ([it is not a coding bootcamp](https://medium.com/launch-school/were-not-a-bootcamp-c33901412c38)). Instead of focusing on any particular frameworks, the focus is on topics that don't change as quickly. I took the Ruby version of the course, but there is a separate track for people interested in Node instead of Ruby. If you complete the course, there is also a capstone program which I didn't personally do, but it seems pretty serious.

The order of topics is roughly:
- the Ruby programming language
- object-oriented programming
- the Internet, the Internet protocol suite, HTTP, and TLS
- SQL with Postgres
- applications that interact with a database using [the `pg` gem](https://github.com/ged/ruby-pg)
- HTML and CSS
- the JavaScript programming language
- how to solve programming problems in general with JavaScript
- object-oriented programming (again but with JavaScript)
- the DOM and asynchronous programming

I didn't complete the very last part of the course since I got a software developer job before I finished.

Other topics which appear diffusely throughout the course are unit testing and regular expressions. At points you will also program an HTTP server in Bash, a framework using Rack, and several web applications using Sinatra. If your goal is to create web applications with Ruby on Rails, this course will not teach you that directly. However, once you have completed most of the back-end portion of this course, learning the basics of Rails will be very easy.

The course includes a lot of practice problems and exercises that I feel people studying tutorials and Udemy courses are missing. Some of them are classics (like sorting algorithms and linked lists) while others ask you to spot subtle logical errors in code snippets. A lot of the exercises lead you through creating command line games or other applications.

One thing to note is you need to pass assessments to progress to the next topic (and the lowest passing grade is like an A-). Each assessment is a live coding interview, a written assessment, or a project. At certain points in the course, you have to pass more than one of these to continue. While I never failed an assessment, they are generally not easy, and people do commonly fail them. Sometimes, I found myself as prepared as I possibly could be for an assessment with time to spare, which I used to learn about things like D3, React, and Rails.

For me, the Launch School course was a worthwhile investment. The topics covered are solid, the amount of practice is more than sufficent, and the assessments guarantee you will not pass without many of the necessary skills to work as a web developer. There are some topics I might suggest be added to the course such as design patterns and additional theory around the design of tests, such as when it is appropriate to use a double. While the course ensures you learn about and are using git at the very beginning, I think it would be good to also cover common branching strategies used by teams, squashing commits, and merging vs. rebasing. I can also understand why object-relational mapping is not included (the focus on fundamentals and keeping the course not too long) but I think that would be a good thing to possibly cover too, after all the raw SQL they make you write.

If you want to see what they're about for yourself, check out [Launch School's open book shelf](https://launchschool.com/books) which has some short and sweet (and free) books covering topics like the Linux command line, git, HTTP, and regular expressions.

My review on this course: it's a buy.