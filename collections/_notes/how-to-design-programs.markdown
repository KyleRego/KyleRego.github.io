---
layout: post
title:  "How to Design Programs (review)"
categories: lisp programming [book reviews] [computer science]
permalink: /how-to-design-programs
emoji: 😮
---

When I was teaching myself programming, I found [teachyourselfcs.com](https://teachyourselfcs.com), which recommended some books for teaching yourself programming. The one I read was [How to Design Programs](https://htdp.org/).

I think the main idea of this textbook is the structure of the data informs the structure of the program, and so designing or understanding the data type is fundamental to program design.

As an example to demonstrate this point, consider a function that counts how many times a symbol appears in an S-expression (exercise 320). The data type is recursive by definition:

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

In the Lisp used in this textbook, the `;` starts a comment and `'()` is the empty list. `cons` constructs a list where the first argument becomes the list's first element and the second argument, a list, becomes the rest of the list's elements. These are accessed by the `first` and `rest` functions.

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

The recursive logic of the function is essentially identical to the recursive structure of the data type. I thought that was really interesting, but to some this may be obvious.

My review on this book: it's a buy (actually it's free and you can read it at [htdp.org](https://htdp.org/))!

{% include attribution-book.html
  book_title = "How to Design Programs, Second Edition"
  book_author = "Matthias Felleisen, Robert Bruce Findler, Matthew Flatt, Shriram Krishnamurthi"
  book_publisher = "MIT Press"
  book_isbn = "9780262534802"
  book_link = "https://htdp.org/"
%}