---
layout: post
title: SQLite
categories: programming SQL SQLite
permalink: /sqlite
emoji: 😸
mathjax: false
---

SQLite provides a relational database management system (RDBMS) that has a dynamic type system and does not use a client/server architecture. The database (the definition of the database schema as well as the data) is itself just a single file, which conveniently is cross-platform. It is also possible to use a SQLite database as an in-memory object/data structure.

# sqlite3

This is a command line tool for interacting with a SQLite database. It is like the `mysql` and `pgsql` applications.

{% highlight console %}
 $ sqlite3 collection.anki21
{% endhighlight %}

The `collection.anki21` file is a SQLite database. I exported some old cards from Anki that I had tagged "sql" and then unzipped the resulting `*.apkg` file to get this to use as an example.

This shell shows the `sqlite>` prompt to which you can give dot-commands or SQL commands. `.exit` or `.quit` will exit the sqlite3 interface. `.headers on` and `.mode column` make the output easier to read. `.schema` will output the DDL SQL statements (like `CREATE TABLE`) used to define the database schema. `.dump` dumps all the SQL needed to recreate both the schema and the data. `.read filename` can be used to execute a list of dot-commands and SQL statements from a file. To see a list of all the dot-commands, use `.help`.

## Example

{% highlight console %}
 $ sqlite3 collection.anki21
SQLite version 3.37.2 2022-01-06 13:25:41
Enter ".help" for usage hints.
sqlite> .headers on
sqlite> .mode column
sqlite> select id, tags, sfld from notes;
id             tags   sfld

-------------  -----  --------------------------------------------------------------------------------------------------------------------------------------
1648325779377   sql   When using the decimal data type in PostgreSQL, what happens if a precision and scale are not specified?

1648913496242   sql   What would be the table column definition for a column called 'initial_price' that cannot be null and holds dollar amounts up to 1000?
1649004161370   sql   When using the decimal data type in PostgreSQL, the first argument is called the

1649004176326   sql   When using the decimal data type in PostgreSQL, the second argument is the

1649435545603   sql   Why not index every column in a table?

1649436618774   sql   What would be the SQL statement to SELECT the next value of a sequence 'colors_id_seq'?
{% endhighlight %}

# System Catalogs

These are data structures which keep system state data. In SQLite, they start with the prefix `sqlite_`. The most important one is the `sqlite_master` table, which has five columns: `type`, `name`, `tbl_name`, `rootpage`, and `sql`. `name` and `tbl_name` will have the same value for tables. The `sql` column usually holds the original SQL statement used to create the object, but it will reflect any modifications such as `ALTER TABLE` commands applied to a table after the original `CREATE TABLE`.

{% include book_attribution.html
  book_title = "Using SQLite"
  book_author = "Jay A. Kreibich"
  book_publisher = "O'Reilly Media"
  book_isbn = "978-0596521189"
  book_link = "https://www.amazon.com/Using-SQLite-Small-Reliable-Choose/dp/0596521189"
%}