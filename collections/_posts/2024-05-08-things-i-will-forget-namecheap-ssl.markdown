---
layout: post
title: "Namecheap TLS certificate gotchas"
date: 2024-05-08 00:00:00 -0500
categories: blogging
permalink: /namecheap-tls-certificate-gotchas
emoji: 🫡
mathjax: false
---

I reissued the TLS certification for my website today (ankibooks.io) which is the third time I've done this TLS stuff with namecheap. There are two gotchas that wasted some of my time figuring out the first two times I was doing this, today I avoided the problems but figured I'd note these things for future reference.

## Generating the CSR code

```
openssl req -new -newkey rsa:2048 -nodes -keyout example.com.key -out example.com.csr
```

From [Generating CSR on Apache + OpenSSL/ModSSL/Nginx + Heroku](https://www.namecheap.com/support/knowledgebase/article.aspx/9446/2290/generating-csr-on-apache-opensslmodsslnginx-heroku/)
> Challenge Password and Optional Company Name - please do not use challenge password and leave Optional Company Name field empty too. These values are now obsolete and may cause issues with getting the SSL certificate.

If you do not leave those empty, then the Namecheap form that you paste the CSR into will not accept it as valid. The error message given does not point you to the problem if filling out the above fields was the reason.

## Adding the CName record

The gotcha with this is that the value you enter into the Host field of the CName record (at least if you are adding it through the Namecheap Advanced DNS area of your domain) must not have the .example.com included at the end of it, but that is how Namecheap gives it to you (including the .example.com at the end), and I think Namecheap may just be appending it to the value you enter.