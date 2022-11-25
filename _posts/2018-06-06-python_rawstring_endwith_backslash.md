---
layout: post
title: 使用Python原义标识符遇到的小问题
categories: [general]
tags: [python]
---

常见编程语言中字符串存在转义字符, 造成写 正则表达式 或 Windows路径 等等含有转义字符的字符串时需要处理, 所以有的语言提供了原义标识符(verbatim string literal).

## 相同之处

[`Python`](https://docs.python.org/2.0/ref/strings.html)是以`r`开头的字符串声明作为其原义标识符:

{% highlight Python %}
# python
s1 = "c:\\documents\\files\\u0066.txt"
s2 = r"c:\documents\files\u0066.txt"
{% endhighlight %}

两个字符串的值是:

    c:\documents\files\u0066.txt
    c:\documents\files\u0066.txt

同样的输出, 在其他语言中写法:

{% highlight C++ %}
// C++11
auto s1 = "c:\\documents\\files\\u0066.txt";
auto s2 = R"(c:\documents\files\u0066.txt)";
{% endhighlight %}

{% highlight C# %}
// C#
var s1 = "c:\\documents\\files\\u0066.txt";
var s2 = @"c:\documents\files\u0066.txt";
{% endhighlight %}

{% highlight lua %}
-- lua
var s1 = "c:\\documents\\files\\u0066.txt";
var s2 = @"c:\documents\files\u0066.txt";
{% endhighlight %}

## 不同之处1

{% highlight Python %}
# python
s1 = "He said, \"This is the last \u0063hance\x0021\""
s2 = r"He said, ""This is the last \u0063hance\x0021"""
{% endhighlight %}

    He said, "This is the last chance21"
    He said, This is the last chance21


而其他语言中

{% highlight C++ %}
// C++11
auto s1 = "He said, \"This is the last \u0063hance\x0021\"";
auto s2 = R"(He said, ""This is the last \u0063hance\x0021"")";
{% endhighlight %}

{% highlight C# %}
// C#
var s1 = "He said, \"This is the last \u0063hance\x0021\"";
var s2 = @"He said, ""This is the last \u0063hance\x0021""";
{% endhighlight %}

{% highlight lua %}
-- lua
s1 = "He said, \"This is the last \u0063hance\x0021\""
s2 = [[He said, ""This is the last \u0063hance\x0021""]]
{% endhighlight %}

    He said, "This is the last u0063hancex0021"
    He said, ""This is the last \u0063hance\x0021""

## 不同之处2

{% highlight Python %}
# python
s1 = "c:\\documents\\"
s2 = r"c:\documents\"
{% endhighlight %}

    File "main.py", line 2
        s2 = r"c:\documents\"
                            ^
    SyntaxError: EOL while scanning string literal

而其他语言中

{% highlight C++ %}
// C++11
auto s1 = "c:\\documents\\";
auto s2 = R"(c:\documents\)";
{% endhighlight %}

{% highlight C# %}
// C#
var s1 = "c:\\documents\\";
var s2 = @"c:\documents\";
{% endhighlight %}

{% highlight lua %}
-- lua
s1 = "c:\\documents\\"
s2 = [[c:\documents\]]
{% endhighlight %}

    var s1 = "c:\\documents\\"
    var s2 = [[c:\documents\]]        

## 差异的原因 TODO