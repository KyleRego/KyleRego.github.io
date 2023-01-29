---
layout: post
title:  "HtDP"
categories: lisp programming [book reviews] [computer science]
permalink: /how-to-design-programs
emoji: 😮
note_category: Computer science
---

When I was at the beginning of teaching myself programming, I found [teachyourselfcs.com](https://teachyourselfcs.com) which recommended some books for learning programming. I ended up reading one of them, [How to Design Programs](https://htdp.org/) and committed [my solutions to most of the book's exercises](https://github.com/KyleRego/htdp-solutions) to a GitHub repository.

By my own interpretation, the main idea of this textbook is that the structure of the data informs the structure of the program. Designing or understanding the structure of the data is critical in program design.

As an example to demonstrate this point, exercise 320 asks you write a function to count how many times a symbol appears in an S-expression. The following is the definition of this data type, which is recursive:

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

This function is recursive in a way that completely mirrors the recursiveness of the data type definition, and it kind of writes itself after the recursive structure of the data type is understood.

My review on this book: it's a buy (actually it's free and you can read it at [htdp.org](https://htdp.org/))!

{% include book_attribution.html
  book_title = "How to Design Programs, Second Edition"
  book_author = "Matthias Felleisen, Robert Bruce Findler, Matthew Flatt, Shriram Krishnamurthi"
  book_publisher = "MIT Press"
  book_isbn = "9780262534802"
  book_link = "https://htdp.org/"
%}