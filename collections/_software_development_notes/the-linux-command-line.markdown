---
layout: post
title: The Linux Command Line
categories: linux
permalink: /the-linux-command-line
emoji: 🤨
mathjax: false
---

**This note is a work in progress and subject to change.**

A shell is a program that passes commands from the user to the operating system. Typically the user interacts with the shell using a terminal emulator. Almost all Linux distributions include a shell called Bash.

The Bash shell prompt is `username@machinename` following by the current working directory, followed by `$` (or `#` if superuser). The up key can be used to see previous commands and usually the last 1000 commands are remembered by default.

# Commands

- `date`
  - Shows the current date
- `cal`
  - Displays a calendar of the current month
- `df`
  - Shows current amount of free space on the disk drives
- `free`
  - Shows the total amount of free memory
- `exit`
  - Ends the terminal session and closes the terminal emulator window
- `pwd`
  - Displays the current working directory
- `ls`
  - Lists the files and directories in the current working directory
  - If a directory is given as an argument, the output is as if that argument was the current working directory
  - It can also take multiple directories as arguments at the same time
  - The options are described below
- `cd`
  - Changes the current working directory
  - Can take relative or absolute path names as arguments
  - With no arguments, changes the current working directory to the home directory
  - `.` refers to the current working directory (and `..` refers to the parent directory) but `./` can be omitted by default
    - For example, `cd ./directory_name` and `cd directory_name` do the same thing
- `file <filename>`
  - Outputs information about the type of the file
- `less <filename>`
  - This is an example of a pager
  - Allows viewing the file contents and scrolling up and down
  - `q` to exit

# Files

Linux organizes files in a hierarchical tree-like directory structure which starts with the root directory (`/`).

In contrast to Windows which has a separate file system tree for every storage device, Linux has only one regardless of the number of storage devices. Storage devices are "mounted" at specific places by the system administrator.

Punctuation characters in Linux filenames should be limited to periods, dashes, and underscores (no spaces). There is also no concept of file extensions in Linux. Filenames that begin with a dot are hidden. To see them, use `ls` with the `-a` option. Filenames in Linux are also case-sensitive. 

## ls options

The short options can be strung together preceded by a single dash (for example `ls -lah`).

- `-l`
  - Changes the output to the long format version
- `-t`
  - Sorts the files in the output by last time modified
- `-a`
  - Shows hidden files
- `-A`
  - Same as `-a` except skips `.` and `..`
- `-S`
  - Sorts the files in the output by file size
- `-r`
  - Reverses the order of files in the output
- `-h`
  - In combination with long format, shows file size in a more human-readable format
- `-l`
  - Changes the output to display all of the following in order:
    - If the file is a file (`-`), directory (`d`), or symbolic link (`l`)
    - The access rights
    - The number of hard links
    - The file's owner's username
    - The file's group's name
    - The file size in bytes
    - The date and time it was last time modified
    - The name of the file
    - If it's a symlink, an arrow and a second filename

## Linux Filesystem Hierarchy Standard

Most Linux distributions conform to this standard somewhat closely.

- `/`
  - The root directory
- `/bin`
  - Binaries and programs that are needed for the system to run
- `/boot`
  - The Linux kernel, initial RAM disk image, and boot loader
- `/dev`
  - Device nodes
- `/etc`
  - System wide configuration files
- `/etc/crontab`
  - Defines when the jobs will run
- `/etc/fstab`
  - Table of storage devices and mount points
- `/home`
  - Location of the home directories
- `/lib`
  - Shared libraries
- `/media`
  - Mount points for USB drives and other things which are mounted automatically when inserted
- `/mnt` 
  - Mount points for removable devices that have been mounted manually 
  - **TODO** - Is this where the Windows file system is mounted in WSL2?
- `/opt`
  - Optional things like commercial products
- `/proc`
  - Virtual file system maintained by the kernel
- `/root`
  - The home directory for the root user
- `/sbin`
  - System binaries and things generally reserved for the root user
- `/tmp`
  - Temporary transient files
- `/var`
  - Data that is likely to change
- `/var/log`
  - Log files

{% include book_attribution.html
book_title = "The Linux Command Line"
book_author = "William Shotts"
book_publisher = "No Starch Press"
book_isbn = "978-1593279523"
book_link = "https://www.amazon.com/Linux-Command-Line-2nd-Introduction/dp/1593279523/ref=pd_lpo_1?pd_rd_w=eL39R&content-id=amzn1.sym.116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_p=116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_r=19H682R4ZHTTHEDGZREZ&pd_rd_wg=dj0A0&pd_rd_r=8097b80d-6697-4717-83e6-ae25375e8ce9&pd_rd_i=1593279523&psc=1"
%}