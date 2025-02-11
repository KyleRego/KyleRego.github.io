---
layout: post
title: "Couple scattered notes on web administration"
date: 2025-02-11 01:35:00 -0800
categories: linux
permalink: /scattered-notes-on-web-administration
emoji: 🕸️
mathjax: false
---

## SCP Syntax

Sometimes I waste time remembering the command to SCP a new TLS certificate to my server:

scp ./kylerego_net_new.zip -i "C:\path_to_pem_file\file.pem" username@hostname:directory

- scp: secure copy command
- ./kylerego_net_new.zip: local file being SCPed to the server
- -i "C:\path_to_pem_file\file.pem": private SSH key for authentication, in my case the Azure Portal provides this as a "pem file"
- username@hostname: your user account name on the remote machine and that machine's IP address or domain name
- directory: destination path on the server to put the file

If `ssl` is used for `directory` in the above the file will be put in `~/ssl` (directory `ssl` in the user's home directory `~`).

## Apache Ports

If using ports (in my case, opening ports in the Azure Portal network settings to my own IP address and then also editing the Apache virtual hosts configuration) remember to edit `ports.conf` as well, and check both the `<IfModule ssl_module>` and `<IfModule mod_gnutls.c>` blocks
