---
layout: post
title: "Unit testing a validation attribute in ASP.NET Core"
date: 2024-05-22 00:00:00 -0500
categories: blogging
permalink: /unit-testing-a-validation-attribute-in-asp-net-core
emoji: 🤔
mathjax: false
---

This is the property and `[RegularExpression]` to unit test:

{% highlight c# %}{% raw %}
public class ClozeNote : Card
{
    [Required]
    [RegularExpression($".*{clozeMarkersRegex}.*", ErrorMessage = "Text must have at least one {{{{c1::cloze test}}}}.")]
    public string Text { get; set; } = "";

    private const string clozeMarkersRegex = "\{\{c\\d::(.*?)\}\}";
    ...
}
{% endraw %}{% endhighlight %}

This is what my unit tests ended up looking like:

{% highlight c# %}
[Fact]
public void ClozeValidIsFalseWithoutClozeMarkers()
{
    ClozeNote cn = new() { Text = "A sentence without cloze markers" };
    ValidationContext context = new(cn, null, null)
    {
        MemberName = "Text"
    };
    ICollection<ValidationResult> failedValidations = [];

    bool result = Validator.TryValidateProperty(cn.Text, context, failedValidations);

    Assert.False(result);
}
{% endhighlight %}

If the `MemberName` property is not set on the `ValidationContext`, `TryValidateProperty` will throw a `NullArgumentException`.