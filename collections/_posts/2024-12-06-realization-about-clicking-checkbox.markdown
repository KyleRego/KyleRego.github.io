---
layout: post
title: "Realization about clicking checkbox (Selenium WebDriver)"
date: 2024-12-06 9:25:00 -0500
categories: programming boostrap selenium
permalink: /realization-about-clicking-checkbox
emoji: 😇
mathjax: false
---

I had a realization later when thinking about my previous post. In that post, I showed a workaround for clicking a checkbox styled by targeting its label by its ID (the checkbox's ID). The workaround involved clicking the label instead of the checkbox, but using a CSS selector for the `for` attribute.

I was thinking about that later and figured it probably would have been quicker to fix by just adding an ID to the label and then selecting that by ID. I also wondered if I made a mistake by clicking the checkbox instead of the label, and I was remembering that clicking on a label toggles the checkbox.

Just goes to show how programming is I guess, I will say this could be considered an example of the "design it twice principle" (Ousterhout).
