---
layout: post
title: "Note on clicking checkbox in Bootstrap button group (.NET Selenium WebDriver)"
date: 2024-12-06 08:25:00 -0500
categories: programming boostrap selenium
permalink: /finding-checkbox-bootstrap-button-group
emoji: 😇
mathjax: false
---

In my React app I have a Bootstrap button group with checkbox inputs inside:

{% highlight html %}{% raw %}
<div class="btn-group" role="group">
    <input type="checkbox" class="btn-check" id="is-food-toggle" autocomplete="off" title="Food">
    <label class="btn btn-outline-primary" for="is-food-toggle">Food</label>
    <input type="checkbox" class="btn-check" id="is-ingredient-toggle" autocomplete="off" title="Ingredient">
    <label class="btn btn-outline-primary" for="is-ingredient-toggle">Ingredient</label>
</div>
{% endraw %}{% endhighlight %}

When trying to automate clicking the `#is-food-toggle` button in a Selenium WebDriver test:

{% highlight c# %}
[Test]
public void TestFoodCanBeCreated()
{
    driver.LoginTestUser();

    IWebElement newItemLink = driver.FindElement(By.LinkText("New item"));
    newItemLink.Click();

    IWebElement isFoodToggle = driver.FindElement(By.Id("is-food-toggle"));
    isFoodToggle.Click();
}
{% endhighlight %}

I encountered this error:

OpenQA.Selenium.ElementClickInterceptedException : element click intercepted: Element {% highlight html %}{% raw %}<input type="checkbox" class="btn-check" id="is-food-toggle" autocomplete="off" title="Food">{% endraw %}{% endhighlight %} is not clickable at point (1272, 183). Other element would receive the click: {% highlight html %}{% raw %}<label class="btn btn-outline-primary" for="is-ingredient-toggle">...</label>{% endraw %}{% endhighlight %}

Looking at the elements with the HTML inspector, this error message makes sense:

![Label for the Food button viewed with the HTML inspector](assets/screenshots/is-food-label.png)

![Food input checkbox viewed with the HTML inspector](assets/screenshots/is-food-input.png)

Checking the example in the Bootstrap docs, there is a similar thing happening:

![Bootstrap checkbox button group example](assets/screenshots/bootstrap-checkbox-btn-group.png)

So as a workaround I tried selecting the label with a CSS selector and clicking it instead of the input:

{% highlight c# %}
[Test]
public void TestFoodCanBeCreated()
{
    driver.LoginTestUser();

    IWebElement newItemLink = driver.FindElement(By.LinkText("New item"));
    newItemLink.Click();

    IWebElement isFoodToggle = driver.FindElement(By.CssSelector("[for='is-food-toggle']"));
    isFoodToggle.Click();
}
{% endhighlight %}

and this does address the issue allowing me to continue with writing the test. I try to avoid using CSS selectors targeting elements by attribute values, but I don't really mind this case since it is using the `for` attribute of the input's label which is tied to the input's id.
