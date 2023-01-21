---
layout: post
title: The Linux Command Line
categories: linux
permalink: /the-linux-command-line
emoji: 🤨
mathjax: false
---

**This note is a work in progress (*clearly*). This book is really excellent though.**

**TODO** - Clean up this whole note.

The shell is a program that takes keyboard commands and passes them to the operating system to carry out

almost all Linux distributions come with a shell called bash

when we are using a graphical user interface, we need a program called a terminal emulator to interact with the shell

shell prompt - username@machinename followed by current working directory followed by $ or # if current terminal session has superuser privileges

by pressing the up arrow we can see previous commands, this is called the command history and most Linux distros remember the last 1000 commands by default

commands:
- date
  - shows the current date
- cal
  - displays a calendar of the current month
- df
  - shows current amount of free space on the disk drives
- free
  - shows the total amount of free memory
- exit
  - ends the terminal session and closes the terminal emulator window

the files are organized in a hierarchical tree-like directory structure

The first directory is called the root directory

Windows has a separate file system tree for every storage device

Linux has only one despite the number of storage devices

Storage devices are "mounted" at specific places by the system administrator

The current working directory is the one we are currently in

The parent directory is the one that contains the current working directory

- pwd
  - display what the current working directory is

When we first log in we are put in the home directory, each user has their own home directory 

- ls
  - list the files and directories contained within of the current working directory

- cd
  - change current directory
  - can take relative or absolute pathname as the argument
  - using cd with no argument takes you to your home directory

Absolute pathnames start with the root directory

Relative pathnames start from the current working directory

. refers to the current working directory

.. refers to the parent directory

However when doing cd ./directory_name the ./ can be implied and you may just type cd directory_name

In linux
- filenames that begin with a dot are hidden
- to see them with ls, do ls -a
- filenames and commands in linux are case sensitive
- punctuation characters in filenames should be limited to periods, underscores, and dashes
- do not put spaces in filenames
- there is no concept of file extensions and files can be named anything.

ls directory_name does a ls of that directory

it can take a list of directories if you want to see the contents of more than one, it shows them separately

the -l option can be added to change it to the long format version

commands are followed by options and then arguments

command -options arguments

options consist of single character preceded by dash

many also support long options which are preceded by two dashes

many commands allow multiple short options to be strung together preceded by a single dash, for example ls -lah

- ls -t 
  - this will sort the files by last time modified

- ls -a
  - show all including hidden stuff

- ls -A
  - same as -a except skips . and ..

- ls -F
  - show directories starting with /

- ls -S
  - sort by file size

- ls -r
  - show in reverse order

- ls -h
  - used with long format, show file size in human readable format

- ls -l
  - first thing is the access rights
  - first part of that is - or d which indicates normal file or directory
  - next 3 characters are access rights for the file's owner
  - 3 characters after that area access rights for the file's group
  - 3 characters after that are the access rights for everyone else
  - after that is file's number of hard links
  - after that is the username of the file's owner
  - after that is the name of the files group, the group that owns the file
  - then the file size in bytes
  - then date/time of last modification
  - finally the name of the file

- file filename
  - this command outputs information about the type of a file

- less filename
  - allows us to view contents of a file and scroll up and down
  - press q to exit
  - this is an example of a pager

Linux Filesystem Hierarchy Standard - this is a specification that most Linux distributions conform to pretty closely
- /
  - root directory
- /bin
  - binaries/programs that must be there for the system to run
- /boot
  - the linux kernel, initial RAM disk image, and boot loader
- /dev
  - device nodes
- /etc
  - system wide config files
  - /etc/crontab
    - defines when jobs will run
  - /etc/fstab
    - table of storage devices and mount points
- /home
  - where home dir are
- /lib
  - shared libraries
- /media
  - mount points for usb drives and stuff like that which are mounted automatically when inserted
- /mnt 
  - mount points for removable devices that have been mounted manually 
  - **TODO** - Is this where the Windows file system is mounted in WSL2?
- /opt
  - optional stuff like commercial products you might install
- /proc
  - virtual file system maintained by the kernel
- /root
  - home directory for the root user
- /sbin
  - system binaries, generally stuff reserved for the root user
- /tmp
  - storage of temporary transient files
  - some configs cause this to be emptied when system is booted
- /var
  - data that is likely to change
  - /var/log
    - log files

when using ls -l, if the first character is l then it is a special type of file called a symbolic link, or soft link or symlink

it is a file but the purpose of it is to point to a file elsewhere

{% include book_attribution.html
book_title = "The Linux Command Line"
book_author = "William Shotts"
book_publisher = "No Starch Press"
book_isbn = "978-1593279523"
book_link = "https://www.amazon.com/Linux-Command-Line-2nd-Introduction/dp/1593279523/ref=pd_lpo_1?pd_rd_w=eL39R&content-id=amzn1.sym.116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_p=116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_r=19H682R4ZHTTHEDGZREZ&pd_rd_wg=dj0A0&pd_rd_r=8097b80d-6697-4717-83e6-ae25375e8ce9&pd_rd_i=1593279523&psc=1"
%}