---
layout: post
title: "Why LinkedIn won't let me link my project to a .lol domain name"
date: 2024-09-04 00:00:00 -0500
categories: blogging
permalink: /linkedinwontletmelinklarderdotlol
emoji: 🤔
mathjax: false
---

Recently I bought the domain name larder.lol for $1.80 and I set up my project web app on that domain.

Today I wanted to link to larder.lol from a project on my LinkedIn page. I found that when I add the link larder.lol as a media to the project, LinkedIn changes the link to kylerego.net automatically. I tried multiple times and this happened every time.

![Entering larder.lol as the link](assets\larder-domain-mishap\entering-larder-lol.png)

Clicking "Add" in the above results in this (the thumbnail is the picture on kylerego.net):

![After clicking add, it shows an image and title from kylerego.net](assets\larder-domain-mishap\after-clicking-add.png)

# Why does that happen?

It's because both websites are running on the same VM that has one IP address--both domain names are pointed to the same IP address. With Apache named virtual hosts, the ServerName directive is used to route requests to the correct virtual host based on the domain name in the request and both virtual hosts are using port 443.

At first I thought that LinkedIn must be doing some check with the DNS records, where I enter larder.lol, LinkedIn finds that larder.lol points to the same IP address as kylerego.net, and changes the URL of the project to kylerego.net, but that seems like a strange thing to do intentionally. I guess however LinkedIn gets the thumbnail and title of the page causes this to happen, I don't know the exact mechanism but it makes sense that it can happen knowing the setup of the relevant websites here. 

Unfortunately, this unexpected experience is not a good sign to keep using .lol domain names, although I am not completely sure how relevant that detail is.
