---
layout: post
title: 使用Address Sanitizer解决越界等内存问题
categories: [general]
tags: []
---

## 内存越界

内存越界是C／C++的最常见的bug，可能导致程序诡异崩溃，十分难查。

{% highlight c %}
char *ptr = (char *)malloc(5);
ptr[12] = 0;
{% endhighlight %}  


这段代码只申请了5字节的数组，却写入数据到第13字节上。在这个地址上，可能发生数据损坏（比如在Apple平台上，malloc函数总是最少分配16个字节，即使你申请少于16字节的空间，因此这段代码在Apple平台上运行正常）。

**Address Sanitizer** 可用来解决这类问题，它通过编译器指令开启，无需修改现有的代码，但也会带来运行时2-5倍的cpu消耗。

开启方法：

* `XCode` `Edit Scheme`->`Run`->`Diagnostics`->勾选`Address Sanitizer`
* `clang -fsanitize=address test.c`

程序会在越界时立即宕掉。


## 有符号整数溢出

{% highlight c %}
int num = 100;
for (int i = 0 ; i < 10; ++i)
{
	num *= num;
	printf("%d\n", num);
}
{% endhighlight %}  

num在第三次循环的时候，产生上溢。有符号的整数溢出是C的未定义行为，会产生诡异的后果。可以使用 **Undefined Behavior Sanitizer** 查找这类问题

开启方法：

* `XCode` 在`Other Warning Flags`（其他也可）添加： `-fsanitize=undefined-trap -fsanitize-undefined-trap-on-error`
* `clang -fsanitize=undefined-trap -fsanitize-undefined-trap-on-error undefined.c`




