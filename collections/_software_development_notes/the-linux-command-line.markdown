---
layout: post
title: "The Linux Command Line"
categories: linux
permalink: /the-linux-command-line
emoji: 🤨
mathjax: false
---

A *shell* is a program that passes commands from the user to the operating system. Typically the user interacts with the shell using a *terminal emulator*. Almost all Linux distributions include a shell called *Bash*.

The Bash shell prompt is `username@machinename` followed by (and separated by `:`) the current working directory followed by `$` (or `#` if superuser) e.g. `regoky@LAPTOP:~/projects$`.

TODO - Reorganize these notes by dispersing the long list of commands

# Commands

There are several different types of commands. They can be compiled binaries, programs written in scripting languages such as Ruby, *shell builtins* which are programs built into the shell itself, shell scripts which are incorporated into the environment, or aliases.

The up key can be used to see previous commands. By default, usually the last 1000 commands are remembered. The command history list is kept in `bash_history` in the home directory and can be viewed at any time with `history | less`.

The tab key can be used to take advantage of *completion* which saves you the trouble of having to type the rest of what the shell can infer you were going to.

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
  - The short options can be strung together preceded by a single dash (for example `ls -lah`).
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
        - If the file is a file (`-`), directory (`d`), symbolic link (`l`), a character special file (`c`), or block special file (`d`)
        - 9 characters describing the access rights of the file owner, the file's group owner, and the world
          - E.g. `-rwx------` is a file where the owner has read, write, and execution access and nobody else has any access
          - E.g. `-rwxr-xr--` is a file where the owner has full access, but the group cannot edit it, and the world can only read it
        - The number of hard links
        - The file's owner's username
        - The file's group's name
        - The file size in bytes
        - The date and time it was last time modified
        - The name of the file
        - If it's a symlink, an arrow and a second filename
- `cd`
  - Changes the current working directory
  - Can take relative or absolute path names as arguments
  - With no arguments, changes the current working directory to the home directory
  - `.` refers to the current working directory
    - `./` can be omitted by default
      - For example, `cd ./directory_name` and `cd directory_name` do the same thing
  - `..` refers to the parent directory
- `file <filename>`
  - Outputs information about the type of the file
- `less <filename>`
  - This is an example of a pager
  - Allows viewing the file contents and scrolling up and down
  - `q` to exit
- `mkdir <directory_name>`
  - Creates a new directory
- `cp <filename1> <filename2>`
  - Copies a file or directory
  - `-r` is necessary to recursively copy the contents of a directory
- `mv <filename1> <filename2>`
  - Moves or renames a file
- `rm`
  - Deletes files and directories
  - `-r` is necessary to recursively delete the contents of a directory
  - Should be used carefully
- `ln`
  - Creates hard or symbolic links
- `type`
  - Displays a command's type
- `which`
  - Displays an executable's location
- `help`
  - Displays helpful information for shell builtins
  - Many commands also support the `--help` option
- `man`
  - Display a command's manual page
  - Most Linux systems will use `less` to display the manual
- `apropos`
  - Display appropriate commands from the man pages based on a search term
- `whatis`
  - Displays one-line summary of a command's man page
- `info`
  - An alernative to `man` that displays a hypertext man page
- `alias`
  - With no arguments, displays all of the alias commands that are available in the environment.
  - With an argument, creates a new command which is an alias, however it does not persist after the shell session.
  - E.g. `alias bw="cd; cd blog/website"`

# Linux files

Filenames in Linux are case-sensitive. Punctuation characters in Linux filenames should be limited to periods, dashes, and underscores (filenames should not have spaces in Linux). There is also no concept of file extensions in Linux.

Filenames that begin with a dot are hidden. To see them, use `ls` with the `-a` option. 

# The Linux filesystem

Linux distributions generally follow the [Linux Filesystem Hierarchy Standard](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard) but there are differences between distributions.

Linux organizes files in a hierarchical tree-like directory structure which starts with the root directory (`/`).

In contrast to Windows which has a separate file system tree for every storage device, Linux has only one regardless of the number of storage devices. Storage devices are "mounted" at specific places by the system administrator.

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
- `/etc/group`
  - Defines the groups
- `/etc/passwd`
  - Defines users' login names, uid, gid, home directories, login shells
- `/etc/profile`
  - A global configuration file for the environment that applies to all users
- `/etc/shadow`
  - Information about the users' passwords
- `/home`
  - Location of the home directories
- `/lib`
  - Shared libraries
- `/media`
  - Mount points for USB drives and other things which are mounted automatically when inserted
- `/mnt` 
  - Mount points for removable devices that have been mounted manually 
- `/mct/c`
  - This is where WSL mounts the Windows `C:` drive
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
- `/usr/share/doc`
  - Documentation files
- `/var`
  - Data that is likely to change
- `/var/log`
  - Log files

# I/O redirection

Programs typically send the data they are designed to produce and output to the *standard output* and they send status and error messages to the *standard error*. `stdout` and `stderr` are special files linked to the screen and not saved to the disk. Many programs take input from the *standard input* (`stdin`) which is instead linked to the keyboard.

To redirect standard output to a specific file, use the `>` operator followed by the filename to redirect output too following the command. This will always rewrite the destination file. To append to the destination file, use the `>>` operator instead.

To redirect standard error, use `2>`. The 2 is the file descriptor that the shell refers to the standard error internally (it also refers to the standard input as 0 and the standard output as 1).

Both the standout output and standard error can be redirect to the same file at the same time with `ls > output.txt 2>&1` (and `ls &> output.txt` in recent Bash versions) showing how to do so. The redirection of standard error must occur after the redirection of standard output.

The system includes a special file, `dev/null`, to redirect output to when you want to silence the output. This file accepts the output and does nothing with it (it is a bit bucket).

The pipe operator `|` allows piping the standard output of one command into the standard input of another command. A useful command to pipe the standard output from a different command into is `less` e.g. `ls | less`. Several commands combined in a pipeline are sometimes referred to as *filters* and common commands used in this way include `sort` and `uniq`.

- `cat <filename>`
  - This sends the contents of a file to the standard output.
- `wc <filename>`
  - Displays the number of lines, words, and bytes in files.
- `grep <pattern> <filename>`
  - Displays the lines in the file which match the pattern
  - With the `v` option:
    - Displays the lines that do not match the pattern instead
- `tee <filename>`
  - Receives standard input and copies it to a file as well as the standard output.
  - This is useful for capturing the standard output at an intermediate point in a pipeline.

# Expansion

`echo *s` shows *pathname expansion* of the pattern into matching filenames.

`echo ~` shows *tilde expansion* of `~` into the home directory.

Other types of shell expansions include:
  - *arithmetic expansion* e.g. `echo $(($((4 / 2)) + $((3 * 2))))`
  - *brace expansion* e.g. `echo 1-{a,b,c}` which outputs `1-a 1-b 1-c`
  - *parameter expansion* e.g. `echo $USER`
  - *command substitution* e.g. `echo $(ls)`

Double quotes cause most special characters to lose their special meaning but do not suppress `\``, `$`, or `\`. Single quotes will suppress all expansions.

## The escape character and control codes

The *escape character* `\` can be used to suppress individual special characters. This character is also part of the notation of the *control codes*, which are the first 32 characters in ASCII. The control codes include `\t` (09) which represents a tab, `\n` (10 or 0A) which represents a newline, and `\r` (13 or 0D) which represents a carriage return.

# The Unix security model

A user may own certain files and directories. A user can also belong to a group which can be granted access to files and directories by the owners of those files and directories. The owners can also specify the permissions that everybody else (the *world*) has to their files and directories.

The `id` command will output some information about your identity and groups.

Access rights are defined in terms of read access, write access, and execution access for the file's owner, the file's group owner, and the world.

The first 10 characters of the output of the `ls -l` command are called the *file attributes*.

The `chmod` command is used to change the permissions of a file or directory. This can only be done by the file's owner or the superuser. It can take the permissions as an octal number:

| Octal | Binary | Permissions |
| ----- | ------ |----------- |
| 0 | 000 | - - - |
| 1 | 001 | - - x |
| 2 | 010 | - w - |
| 3 | 011 | - w x |
| 4 | 100 | r - - |
| 5 | 101 | r - x |
| 6 | 110 | r w - |
| 7 | 111 | r w x |

The binary representation shows why these are called permission bits. For example, `chmod 755 a.txt` sets the file attributes of `a.txt` as `-rwxr-xr-x`. There is also an alternative symbolic notation.

The `su` command is used to start a shell as a different user. `sudo` allows an ordinary user to execute commands as a different user. Using `sudo` requires the user's password, not the superuser's. To start a shell as the superuser using `su -`, the superuser's password must be entered.

The `chown` command is used to change the owner and group owner of a file or directory and requires superuser privileges to use.

The `passwd` command is used to set or change your password. With superuser privileges, you can also set the password of other users.

# Processes

When the system starts, it starts a few processes and a program called `init` that runs a series of `init scripts` located in `/etc`. Many of these are `daemon programs` which run in the background and have no user interface. Processes are assigned `process IDs` (PIDS) with `init` always have the PID 1.

In general, when processes launch other processes they are called `parent processes` and the processes they launch are `child processes`. 

The `ps` command shows the processes related to the current terminal session. The `x` option (with no leading dash) will show more processes not limited to the current terminal session. A handy set of options is `aux` (no leading dash again) which shows the user each process belongs to.

The `top` command shows the system process ordered by activity and continuously updated. This program accepts `h` to show help and `q` to exit. In Windows, the Task Manager serves the same function as `top` but consumes more computational resources and is slower.

To launch a program such that it is immediately placed in the background, use `<program> &`. A process in the background can be seen with the `ps` command and its jobspec (job number) can be seen from the `jobs` command. To bring the process into the foreground, use `fg %<jobspec>`.

The `kill` command is used to terminate a process. `kill <PID>` sends the `TERM` signal to the process identified by the PID argument. Other signals that can be sent to processes are `INT` (Ctrl + C) and `TSTP` (Ctrl + Z). Use `kill -l` to see all the signals used by the system (there are a lot).

Other commands related to monitoring the processes are `pstree`, `vmstat`, `xload`, and `tload`. `pstree` will show which processes are parents of others. Commands related to shutting down the system are `halt`, `poweroff`, `reboot`, and `shutdown`.

# The environment

The shell stores `environment variables`, `shell variables`, `aliases`, and `shell functions` in the environment.

The `set` builtin in Bash will output the environment variables, shell variables, and shell functions. The `printenv` command will output only the environment variables. Neither displays the aliases, but these can be seen using the `alias` command.

When the user logs in, the environment is established from configuration files including files in the user's home directory that allow the user to customize their default environment, e.g. `~/.bash_profile`. `PATH` is an important environment variable to know; it contains the list of directories that is searched to find, for example, the binary of a command when the command is used. 

Poking around my own system, I can see the following is part of my `~/.profile` (the Ubuntu equivalent of `.bash_profile`):
  
{% highlight bash %}{% raw %}
# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi
{% endraw %}{% endhighlight %}

This is using parameter expansion to add to the PATH variable the `$HOME/bin` directory (a place for the user to put their own scripts).

Unless you are the system administator, only make changes to these things in the home directory. Environmental variables should be defined in `.profile` or `.bash_profile` and everything else should be defined in `.bashrc`. Everything else includes customizing the shell prompt.

`export PATH` informs the shell to make `PATH` available to the shell's child processes.

# Package management

A package file is a compressed file collection that constitutes a software package.  The two major families of Linux packaging systems are the Debian family (`.deb`) and the Red Hat family (`.rpm`). 

# The locale

The `locale` is a concept introduced by the POSIX standards which allows selecting the correct character set for a particular location. Use the `locale` command to see the locale settings.

{% include attribution-book.html
book_title = "The Linux Command Line"
book_author = "William Shotts"
book_publisher = "No Starch Press"
book_isbn = "978-1593279523"
book_link = "https://www.amazon.com/Linux-Command-Line-2nd-Introduction/dp/1593279523/ref=pd_lpo_1?pd_rd_w=eL39R&content-id=amzn1.sym.116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_p=116f529c-aa4d-4763-b2b6-4d614ec7dc00&pf_rd_r=19H682R4ZHTTHEDGZREZ&pd_rd_wg=dj0A0&pd_rd_r=8097b80d-6697-4717-83e6-ae25375e8ce9&pd_rd_i=1593279523&psc=1"
%}