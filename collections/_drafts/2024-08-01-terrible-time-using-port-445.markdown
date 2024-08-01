---
layout: post
title: "Terrible time using port 445"
date: 2024-08-01 00:00:00 -0500
categories: blogging
permalink: /terrible-time-using-port-445
emoji: 🤔
mathjax: false
---

I spent a frustrating amount of time today and yesterday setting up an Apache virtual host for a static site (as a test) at a port number. I was already using virtual hosts on this VM to serve a couple different Ruby on Rails apps on different ports. But I could not for the life of me get the HTML of the one I was trying to add using port 445.

I realized that I could curl the HTML from the VM itself `curl -k https://localhost:445` (`-k` gets bypasses an issue with the SSL certificate not being for `localhost` I think). I could see the port was being listened to with `ss -lnt`, and with `sudo tcpdump -i any port <port_number>` it looked pretty clear that the VM was not receiving any traffic on the port (by comparing with sending requests to one of the sites/ports that was working). I ruled out `ufw` being the issue. I double checked the network security groups in the Azure portal and restarted the VM a few times, but that didn't seem to make a difference. I used the troubleshooting tool in Azure but it did not find any problem with reaching port 445 on the VM. I also tried disconnecting my phone from my Wifi and using the mobile network to reach the port instead, and that also didn't work, but the Internet also seemed slower when doing that which may have impacted the test.

Eventually I just tried using a different port number (I changed it in the virtual host and `ports.conf` Apache configuration and network security group setting), and with everything else the same, suddenly I could get the HTML from my web browser.

I guess the lesson here is to be careful when choosing port numbers to use. I didn't know this, but from some basic research, port 445 is considered a "well-known port" that if it is open on Windows machines is a vulnerability. I think this is probably the reason why at some place traffic at that port 