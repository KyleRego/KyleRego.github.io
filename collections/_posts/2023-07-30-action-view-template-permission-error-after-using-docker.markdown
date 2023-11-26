---
layout: post
title: "Action View permissions error after using Docker"
date: 2023-07-30 06:00:00 -0500
categories: programming ruby
permalink: /action_view_permissions_error_after_using_docker
emoji: 🤨
mathjax: false
---

I had an unexpected error today when starting my Rails app after experimenting running it inside Docker containers yesterday. The problem was due to the system user inside the Docker container being root and the project directory being mounted inside the container through a volume in `docker-compose.yml` which allowed some cache files and directories owned by root to get added to `tmp` in the project working directory outside the container. This caused an error when starting the Rails server during rendering a template when it wanted to use cached assets that were owned by root. This was the error:

```
ActionView::Template::Error (Permission denied @ apply2files - path/anki_books/tmp/cache/assets/sprockets/v4.0.0/md/abcdf_gibberish.cache):
```

Using `ls -lA` with various paths in `tmp` I could see many files owned by root including the one causing the error.

The error was reproducible with `bin/rails assets:precompile`. It was resolved using `bin/rails tmp:cache:clear` even though this command did not remove the implicated files. I didn't like having files owned by root in `tmp` so I deleted `tmp` (`sudo rm -rf tmp`) and restored the tracked files (`git restore tmp`). 

To prevent it happening again, I added a second volume to the Docker Compose service:

```docker
version: '3'

services:

  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/usr/src/app
      - exclude_tmp:/usr/src/app/tmp
    ...

...

volumes:
  exclude_tmp:
  ...
```

I think this is just using a named volume to effectively exclude the `tmp` directory from being mounted in the first volume. Using `docker exec -it <container_name> bash` to get a Bash shell inside the container, `ls -lA tmp` displayed the usual files in `tmp` owned by root. Exiting the container and inspecting the same files, none were owned by root. This is good enough for me right now, but I am just exploring Docker and not sure this is a great solution.

## 11/26/2023 update

A couple of weeks ago I reinstalled Docker Desktop to check that my app could still correctly run in Docker containers, and I did some refactoring. One thing I realized is  the `.dockerignore` file can be used to make certain files be ignored and not copied into the filesystem of the image. So a much better solution than creating a named volume would be that. This ended up being my `.dockerignore`:

```
.git
.gitignore

log/*
tmp/*
```