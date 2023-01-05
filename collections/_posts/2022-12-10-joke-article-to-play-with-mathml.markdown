---
layout: post
title:  "Joke article to play with MathML"
date:   2022-12-10 14:00:00 -0500
categories: math joke
permalink: /joke-article-to-play-with-mathml
emoji: 👻
short: true
mathjax: true
---
One semester in college I took a course on complex variables. It was pretty easy but there was one homework problem that was tricky enough that I still remember it. The problem was to calculate the Taylor series of the following function:

$$ f(z) = \frac {1} {1 + cos(z)} $$

I forget what the usual ways of calculating these series are, but I do remember not being able to solve this problem with them. 

I may have been thinking about this [Numberphile video](https://youtu.be/w-I6XTVZXww), where they demonstrate the sum of all natural numbers is -1/12 (a hilarious and obviously true result). The argument they use to show this gave me an idea. So I cracked open my Schaum's outline and looked up the Taylor expansion of our familiar friend cosine:

$$ cos(z) = 1 - \frac {z^2} {2!} + \frac {z^4} {4!} - \frac {z^6} {6!} + ... $$

I knew the series I was trying to calculate was of the form:

$$ f(z) = a_0 + a_1z^1 + a_2z^2 + ... $$

I plugged and chugged and a little bit of algebra later probably had this equation:

$$ (2 - \frac {z^2} {2!} + \frac {z^4} {4!} - \frac {z^6} {6!} + ...)( a_0 + a_1z^1 + a_2z^2 + ... ) = 1 $$

It was obvious that all that was left to do was to collect like terms and work out the $$ a_i $$, and after that I had the answer:

$$ f(z) = \frac {1} {2} + \frac {z^2} {8} + \frac {z^4} {48} + O(z^6) $$

The purpose of this was just to get the blog set up to use MathML (I ended up using [version 2 of MathJax](https://docs.mathjax.org/en/v2.7-latest/configuration.html)) in case I want to put some equations in a post in the future.
