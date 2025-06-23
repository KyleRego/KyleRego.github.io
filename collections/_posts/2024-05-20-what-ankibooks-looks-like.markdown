---
layout: post
title: "What Anki Books looks like"
date: 2024-05-20 00:00:00 -0500
categories: blogging
permalink: /what-anki-books-looks-like-1
emoji: 🫡
mathjax: false
---

I'm sure nobody has noticed this but I was trying to write a blog post  every day. I wrote a draft of one today and didn't really like it and this is the plan B idea I came up with I guess. This post will just be to show what .NET Anki Books looks like which is a good thing to do anyway since otherwise nobody can see what it is yet.

![Ruby on Rails Anki Books book overview page](assets/screenshots/ankibooks-5-20-2024-1.png)

![Anki Books Screensot 1](assets/screenshots/ankibooks-5-20-2024-2.png)

- The first screenshot is using "Split screen" in Microsoft Edge and the website on the right is some random Microsoft documentation.
- The articles tree is side by side with the article, a great improvement over the Rails version's user experience of navigation.
    - Related to a simpler model of the tree being only articles instead of articles and books. Books will be in Anki Books too and will be composed as a number of articles.
- Decks are horizontal rows in the article rather than each article having one vertical wall of flashcards on the right side like in Rails Anki Books.
- More icons are being used and more buttons are styled to look like buttons.

![Card reviewer](assets/screenshots/ankibooks-5-20-2024-3.png)

- This is the card reviewer; it is reused when looking at the cards in the deck. There is a page for studying all due cards scheduled to be due with the Wikipedia's description of SM2 so it is a true spaced repetition flashcards program.

## SuperMemo 2 Algorithm

This implementation has many "magic numbers" (literals that would be better as variables).

{% highlight c# %}
    public void UpdateSelfAfterRepetition(Grade grade, int successStreak)
    {
        if (grade == Grade.Good)
        {
            if (successStreak == 0)
            {
                InterRepetitionInterval = 1;
            }
            else if (successStreak == 1)
            {
                InterRepetitionInterval = 6;
            }
            else
            {
                InterRepetitionInterval = (int)Math.Round(InterRepetitionInterval * EasinessFactor);
            }
        }
        else
        {
            InterRepetitionInterval = 1;
        }

        DueAt = new DateTimeOffset(DateTime.Now).ToUnixTimeSeconds() + InterRepetitionInterval * 86400;

        // If there were 6 grades, q could be 0 to 5 (see SM2 algorithm)
        // Since Anki Books uses 2 grades, take them to represent 1 and 4
        int q = grade == Grade.Bad ? 1 : 4;

        EasinessFactor += 0.1F - (5 - q) * (0.08F + (5 - q) * 0.02F);

        if (EasinessFactor < 1.3)
        {
            EasinessFactor = 1.3F;
        }
    }
{% endhighlight %}

With the current object-oriented design of the algorithm, the success streak is computed from the repetitions in the database, so resetting or increasing the success streak is not part of the algorithm here. Tracking it as a property of the card is not a bad idea so that may change.
