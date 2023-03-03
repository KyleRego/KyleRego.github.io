---
layout: post
title:  "How to Design Programs (review)"
categories: lisp programming [book reviews] [computer science]
permalink: /how-to-design-programs
emoji: 😮
---

When I was at the beginning of teaching myself programming, I found [teachyourselfcs.com](https://teachyourselfcs.com) which recommended some books for learning programming. The one I ended up reading was [How to Design Programs](https://htdp.org/).

By my own interpretation, the main idea of this textbook is that the structure of the data informs the structure of the program. Designing or understanding the structure of the data is therefore critical in program design.

As an example to demonstrate this point, exercise 320 from the book asks you write a function which counts how many times a symbol appears in an S-expression. The following definition of the S-expression data type is recursive:

{% highlight racket %}
; An S-expr is one of:
; - Number
; - String
; - Symbol
; - List-of S-expr

; A List-of S-expr is one of: 
; – '()
; – (cons S-expr List-of S-expr)
{% endhighlight %}

In the teaching Lisp used by this textbook, the `;` starts a comment and `'()` is the empty list. `cons` constructs a list where the first argument becomes the list's first element and the second argument, a list, becomes the rest of the list's elements. These are accessed by the `first` and `rest` functions.

Here is my solution (the book encourages writing function signatures and unit testing):

{% highlight racket %}
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

This function mirrors the data type definition in every aspect, which I think is kind of interesting.

My review on this book: it's a buy (actually it's free and you can read it at [htdp.org](https://htdp.org/))!

{% include attribution-book.html
  book_title = "How to Design Programs, Second Edition"
  book_author = "Matthias Felleisen, Robert Bruce Findler, Matthew Flatt, Shriram Krishnamurthi"
  book_publisher = "MIT Press"
  book_isbn = "9780262534802"
  book_link = "https://htdp.org/"
%}