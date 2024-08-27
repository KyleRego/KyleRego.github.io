---
layout: post
title: "Try using a different port"
date: 2024-08-01 00:00:00 -0500
categories: blogging
permalink: /try-using-a-different-port
emoji: 🤔
mathjax: false
---

While writing this post, a few times I considered a reader might say it does not show the best security practices, and I don't necessarily disagree with that. In this case, access to the relevant ports was only allowed for my IP address. Also, the environment is a personal VM without anything important.

# The real blog post here

I set up a static site with Apache recently on a VM. The VM already had Apache running a public site (a Rails app) and a second one on a different port number. I wanted to add a static website (a generic `index.html`) to that setup, mainly to familiarize myself with it again, since I hadn't looked at in a while and I am doing some necessary CI/CD work.

I didn't find it too hard to make sense of the Apache configuration, make some changes, and see the HTML by curling it from the VM to itself as localhost, but for the life of me, I could not see the HTML with my web browser. 

- I was able to curl HTML from localhost on the server but I couldn't see the site with my web browser (`curl -k https://localhost:445`).
- I could see the port was being listened to with `ss -lnt` and I also had a look at `sudo tcpdump -i any port <port_number>` with a working port and the not working one.
- I ruled out `ufw` being the issue (`ufw status`).
- I double checked the network security group settings for the VM on the Azure portal too many times and I restarted the VM a couple times too.
- I used the troubleshooting tool on the Azure portal (probably somewhere in network settings) but the tests it performed against the VM/port number did not reveal any problems.
- I switched the port number with one of the working ones and saw my static test HTML at the working port number. Still, I had no idea what the actual issue was.

At last I decided to try a different port number, and I could finally see my static test HTML. I wish I had tried that much sooner than when I did.

I also did some research into the port number I was trying to use. It is considered a "well-known port" and having it open on a Windows machine is a serious vulnerability for a ton of malware. 

I guess the lesson here is to be careful when choosing port numbers to use if you have to choose them, it might be worth it to buy a digital certificate that comes with a lot of subdomains to avoid having to use ports, and it wouldn't be a bad idea to avoid running production websites at port numbers other than the standard ones.