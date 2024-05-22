---
layout: post
title: "Unit testing model validation in ASP.NET Core"
date: 2024-05-22 00:00:00 -0500
categories: blogging
permalink: /unit-testing-model-validation-in-asp-net-core
emoji: 🤔
mathjax: false
---

This post shows an example of unit testing an ASP.NET Core model validation property. `[RegularExpression]` enforces the property matches the regex:

{% highlight c# %}{% raw %}
public class ClozeNote : Card
{
    [Required]
    [RegularExpression($".*{clozeMarkersRegex}.*", ErrorMessage = "Text must have at least one {{{{c1::cloze test}}}}.")]
    public string Text { get; set; } = "";

    private const string clozeMarkersRegex = "{{c\\d::(.*?)}}";
    ...
}
{% endraw %}{% endhighlight %}

Using the attribute is straightforward but the APIs I ran into to write my unit tests were somewhat more confusing. This is what I settled on doing:

{% highlight c# %}
[Fact]
public void TextIsInvalidWithoutClozeMarkers()
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

If the `MemberName` property is not set on the `ValidationContext`, `TryValidateProperty` will throw a `ArgumentNullException`.