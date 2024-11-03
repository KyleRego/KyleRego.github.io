---
layout: post
title: "Note on finding element with Selenium WebDriver where two exist with the same ID (only one visible)"
date: 2024-11-03 08:25:00 -0500
categories: programming boostrap selenium
permalink: /finding-logout-button-in-bootstrap-nav
emoji: 😇
mathjax: false
---

In the React app that is part of my project, there is a Bootstrap navigation bar with a logout button. For small screen widths, the bar collapses, hiding the navigation items, and instead a hamburger button is displayed, which if clicked reveals the menu with the navigation items. When I added a logout button to the navigation bar, I ended up with having two logout buttons with the same DOM Id, where only one is visible at either side of the width breakpoint.

When I tried to use Selenium WebDriver to click that button, the test failed with an error like `element not interactable` which was understandable.

So rather than the test being:

{% highlight c# %}
public class LogoutTest : UITestBase
{
    [Test]
    public void TestUserCanLogout()
    {
        driver.LoginTestUser();

        IWebElement logoutBtn = driver.FindElement(By.Id("logout-btn"));
        logoutBtn.Click();

        AssertMessage("You are now logged out.");
    }
}
{% endhighlight %}

I used this approach:

{% highlight c# %}
public class LogoutTest : UITestBase
{
    [Test]
    public void TestUserCanLogout()
    {
        driver.LoginTestUser();

        try
        {
            IWebElement logoutBtn = driver.FindElement(By.CssSelector(".d-none.d-lg-block #logout-btn"));
            logoutBtn.Click();
        } catch
        {
            IWebElement logoutBtn = driver.FindElement(By.CssSelector(".d-lg-none #logout-btn"));
            logoutBtn.Click();  
        }

        AssertMessage("You are now logged out.");
    }
}
{% endhighlight %}

This simple workaround allows the test to succeed, for both small and wide screen sizes.

Although the browser inspector tools does not give any warning about there being two buttons with the same ID in the DOM (which is partially what lead me to decide that approach was OK when I was working on the navbar), encountering this issue today and now having this workaround does make me feel I should reconsider the design of the nav bar so that there is only one button in the DOM. Using a CSS selector/combinator to find an element is more likely to break if the HTML changes compared to using an ID selector in general, although I don't think that is a very big concern for this situation.
