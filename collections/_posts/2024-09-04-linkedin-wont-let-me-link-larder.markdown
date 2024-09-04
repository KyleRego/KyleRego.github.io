---
layout: post
title: "LinkedIn won't let me link my project to my .lol domain"
date: 2024-09-04 00:00:00 -0500
categories: blogging
permalink: /linkedinwontletmelinklarderdotlol
emoji: 🤔
mathjax: false
---

For my new free software project Larder (mainly a practice project but it could be useful to people) I bought the domain name larder.lol for $1.80 plus a less than $6 TLS certificate. Pretty much immediately after buying this domain name and looking at it, I thought maybe it was a mistake, but I wasn't going to buy another domain name that soon.

So today I wanted to link to larder.lol in a project on my LinkedIn page, however when I enter it, even if I enter it as https://larder.lol:443, LinkedIn will change the link to kylerego.net.

# Why does that happen?

It's because both websites are running on the same IP address (my $16/month Azure VM, it's in the burstable series) and both are listening to the same port, 443. With Apache named virtual hosts, the ServerName directive (at least this is how it is on Ubuntu) is used to route to the correct one. So I guess LinkedIn must be doing something that results in me not being able to link to my dot lol website domain name, which I would guess must involve some check with the DNS records.

Unfortunately, this experience shows how using .lol domain names might not be the best strategy, even if they are cheap and somewhat whimsical.
