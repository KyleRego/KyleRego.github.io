---
layout: post
title: "Setting up Anki Books for development on WSL2 Ubuntu"
date: 2024-12-14 9:25:00 -0500
categories: programming
permalink: /setting-up-development-ankibooks
emoji: 😇
mathjax: false
---

I set up my Ruby on Rails app for development on a fresh installation of WSL2 Ubuntu 24.04 on Windows 11 today (to make it easier for me to work on it when I want to; if I had a bigger desk I would use my Ubuntu laptop) and noted the steps for future reference.

First clone the repository from GitHub (you will need `git` installed and public SSH key added in GitHub settings).

{% highlight bash %}
git clone git@github.com:eggrain/anki_books.git
cd anki_books
code .
{% endhighlight %}

`code .` will install Visual Studio Code for Linux and open the current working directory.

This needs to be installed (dependency for Rails Active Storage):

`sudo apt-get install libvips libvips-tools`

This installs `rbenv` (a Ruby version manager):

`curl -fsSL https://rbenv.org/install.sh | bash`

After installing `rbenv`, reload the shell.

Installing Ruby requires `gcc` and some other packages:

{% highlight bash %}
sudo apt-get update
sudo apt install gcc
sudo apt install build-essential
sudo apt-get install libz-dev
sudo apt install libffi-dev
sudo apt-get install libreadline-dev
sudo apt install libyaml-dev
{% endhighlight %}

Use `rbenv` to install Ruby, set the Ruby version, and confirm it was installed:

{% highlight bash %}
rbenv install 3.2.1
rbenv global 3.2.1
ruby --version
{% endhighlight %}

If other system packages are missing, `rbenv install 3.2.1` may fail and in the output there is usually a path to a crash log which you can `cat` (`cat file_path`) to see why it failed.

Install PostgreSQL:

{% highlight bash %}
sudo apt install postgresql
sudo apt-get install libpq-dev
{% endhighlight %}

Go back to the Anki Books directory (e.g. `cd github/anki_books`) and run

`bundle install`

to install the Gemfile gems.

For the development connection to the database, there needs to be a Postgres role with the same name as the shell user with the `CREATE DB` attribute, this is one way to add that:

{% highlight bash %}
sudo su
su postgres
createuser your_username
psql
alter role your_username createdb
{% endhighlight %}

In the `psql` shell, `\du` is useful to ensure the role is setup.

Create and setup the database (inside `anki_books` directory):

{% highlight bash %}
bin/rails db:create
bin/rails db:setup
{% endhighlight %}

To run the app (inside `anki_books` directory):

`bin/dev`

Then visit it at `localhost:3000` and it should have this, showing you the development user credentials:

![Anki Books homepage with initial seed data](assets/screenshots/fresh-ankibooks-homepage.png)

To run the tests (both the RSpec tests and Cucumber/Selenium/Capybara feature tests):

`bin/test`

To install Google Chrome (required for the Selenium tests) on WSL2 Ubuntu:

{% highlight bash %}
sudo apt update && sudo apt -y upgrade && sudo apt -y autoremove
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt -y install ./google-chrome-stable_current_amd64.deb
{% endhighlight %}
