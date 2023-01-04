---
layout: post
title:  "How to Design Programs"
date:   2022-11-14 10:30:00 -0500
categories: lisp programming [book reviews] [computer science]
permalink: /how-to-design-programs
emoji: 😮
short: true
book_review: true
book_title: How to Design Programs, Second Edition
book_author: Matthias Felleisen, Robert Bruce Findler, Matthew Flatt, Shriram Krishnamurthi
book_publisher: MIT Press
book_isbn: 9780262534802
book_link: https://htdp.org/
---
When I was at the beginning of teaching myself programming, I found [teachyourselfcs.com](https://teachyourselfcs.com) which recommended two books for learning programming. I ended up reading the second one, [How to Design Programs, Second Edition](https://htdp.org/) and committed [my solutions to most of the book's exercises](https://github.com/KyleRego/htdp-solutions) to a GitHub repository.

The teaching language used is a Lisp which evolves over the course of the book, starting as Beginning Student Language and progressing to Advanced Student Language. It is a nice language with a library for drawing shapes and images to the screen which makes making simple games quite approachable. Completing the book's exercises will have you making a snake game, a (very) simple version of Tetris, and a space invaders game.

One of main takeaways for me was the idea that the data structure informs the structure of the program. Therefore designing or understanding the data structure you are using is an important step in program design. 

As an example to demonstrate this point, exercise 139 asks you to write a function to sum a list of positive numbers. The definition of the data structure is recursive:

{% highlight racket %}
; A List-of-amounts is one of: 
; – '()
; – (cons PositiveNumber List-of-amounts)
{% endhighlight %}

The `;` starts a comment and `'()` is the empty list. This data structure, the list of amounts, is either an empty list, or one positive number and a list of amounts. `cons` constructs a list where the first argument becomes the list's first element and the second argument, a list, becomes the rest of the list's elements. These are accessed by the `first` and `rest` functions. Here is my solution (the book encourages writing function signatures and unit testing):

{% highlight racket %}
; List-of-amounts -> Number
; computes the sum of the amounts in a List-of-amounts
(check-expect (sum '()) 0)
(check-expect (sum (cons 5 '())) 5)
(check-expect (sum (cons 2 (cons 2 '()))) 4)
(define (sum aloa)
  (cond
    [(empty? aloa) 0]
    [else (+ (first aloa) (sum (rest aloa)))]))
{% endhighlight %}

The definition of the list here has two cases: an empty list or a single number and a list. The function completely mirrors these two cases and since the data structure is recursive, the function uses recursion to handle it. To me that is kind of a cool idea, especially coming from an introduction to programming.

A later problem in the book (exercise 320) is to write a function to count how many times a symbol appears in an S-expression:

{% highlight racket %}
; An S-expr is one of:
; - Number
; - String
; - Symbol
; - [List-of S-expr]

; S-expr Symbol -> Number
; counts all occurrences of sy in sexp
(check-expect (count 'world 'hello) 0)
(check-expect (count '(world hello) 'hello) 1)
(check-expect (count '(((world) hello) hello) 'hello) 2)

(define (count sexp sy)
  (local (; [List-of S-expr] Symbol -> Number
          ; counts all occurrences of sy in sexp
          (define (count-sl sexp sy)
            (cond
              [(empty? sexp) 0]
              [else
                (+ (count (first sexp) sy)
                   (count-sl (rest sexp) sy))])))
  (cond
    [(number? sexp) 0 ]
    [(string? sexp) 0 ]
    [(symbol? sexp) (if (equal? sexp sy) 1 0) ]
    [else (count-sl sexp sy) ])))
{% endhighlight %}

This pretty much shows the same idea with a somewhat more interesting type of data.

While I haven't done much more Lisp programming than the exercises in this book, I think that reading this as a beginner was very worthwhile for me. I have thought about the lesson above regarding the importance of understanding the data structure in program design many times. 

My review on this book: it's a buy (actually it's free and you can read it at [htdp.org](https://htdp.org/))!