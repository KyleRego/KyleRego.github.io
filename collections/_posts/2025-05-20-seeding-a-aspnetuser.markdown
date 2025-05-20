---
layout: post
title: "How to seed an ASP.NET Core Identity user"
date: 2025-05-20 12:35:00 -0800
categories: ["programming", "c#"]
permalink: /how-to-seed-an-asp-net-core-identity-user
emoji: 🖤
mathjax: false
---

On a few occasions I have developed small projects where I used ASP.NET Core Identity with only a single user, seeded into a local database manually, so that only I would be able to log in. Usually I am able to succeed after debugging some issues with the initial user data that I put in the database.

The SQL to seed the user manually is like

{% highlight sql %}
INSERT INTO AspNetUsers (
  Id,
  UserName,
  NormalizedUserName,
  Email,
  NormalizedEmail,
  EmailConfirmed,
  PasswordHash,
  SecurityStamp,
  ConcurrencyStamp,
  PhoneNumberConfirmed,
  TwoFactorEnabled,
  LockoutEnabled,
  AccessFailedCount
) VALUES (
  '<USER-ID-GUID>',
  '<USERNAME>',
  '<USERNAME_UPPERCASE>',
  '<EMAIL>',
  '<EMAIL_UPPERCASE>',
  1,
  '<YOUR_HASHED_PASSWORD>',
  '<SECURITY_STAMP-GUID>',
  '<CONCURRENCY_STAMP-GUID>',
  0,
  0,
  0,
  0
);
{% endhighlight %}

I would ensure `Id`, `SecurityStamp`, and `ConcurrencyStamp` are GUIDs like A1B2C3D4-E5F6-47A8-9BCD-EF0123456789.

This is how I have been generating the hashed password (using ASP.NET Core Identity to do it).

{% highlight c# %}
PasswordHasher<IdentityUser> passwordHasher = new();

IdentityUser testUser = new()
{
    Email = "test@example.com"
};

string hash = passwordHasher.HashPassword(testUser, input);
{% endhighlight %}

`UserName`/`NormalizedUserName` and `Email`/`NormalizedEmail` should match with the normalized being uppercase.

The last issue I had doing this today was due to my username and email not being the same. With the scaffolded ASP.NET Core Identity razor page, the code behind handling the POST request to login uses:

{% highlight c# %}
var result = await _signInManager.PasswordSignInAsync(Input.Email, Input.Password, Input.RememberMe, lockoutOnFailure: false);
{% endhighlight %}

This is the source for that:

{% highlight c# %}
public virtual async Task<SignInResult> PasswordSignInAsync(string userName, string password,
        bool isPersistent, bool lockoutOnFailure)
{
    var user = await UserManager.FindByNameAsync(userName);
    if (user == null)
    {
        return SignInResult.Failed;
    }

    return await PasswordSignInAsync(user, password, isPersistent, lockoutOnFailure);
}
{% endhighlight %}

So with the default scaffolded page, the email input is used as the username, so in my case updating the username columns to match the email columns was the last thing needed to set up a seeded user.