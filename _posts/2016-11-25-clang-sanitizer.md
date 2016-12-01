---
layout: post
title: 使用Clang Sanitizer提升程序质量
categories: [general]
tags: []
---

在Clang的[Controlling Code Generation](http://clang.llvm.org/docs/UsersManual.html#controlling-code-generation) 中提供了一系列的参数，可以帮程序解决一些常见的内存问题

## AddressSanitizer

内存错误是C／C++的最常见的问题，可能导致程序诡异崩溃，十分难查。内存错误检查[AddressSanitizer](http://clang.llvm.org/docs/AddressSanitizer.html)可用来查找如内存溢出，内存重叠等问题，会带来2倍的速度消耗。

开启方法：

* `XCode` `Edit Scheme`->`Run`->`Diagnostics`->勾选`Address Sanitizer`
* `clang -fsanitize=address test.c`

### AddressSanitizer: stack-buffer-overflow

{% highlight c %}
int n = 0;
if (*(long long*)&n == *(long long*)"hr")
	;
{% endhighlight %}


### AddressSanitizer: strncpy-param-overlap: memory ranges

char sz[64];
sz[0] = '\0';
strncpy(sz, sz, sizeof(sz));

## UndefinedBehaviorSanitizer

对一些未定义行为的检查，如有符号整数溢出。可使用 [UndefinedBehaviorSanitizer](http://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)来检查。

{% highlight c %}
int num = 100;
for (int i = 0 ; i < 10; ++i)
{
	num *= num; // num在第三次循环的时候，产生上溢。
	printf("%d\n", num);
}
{% endhighlight %}  

开启方法：

* `XCode` 在`Other Warning Flags`（其他也可）添加： `-fsanitize=undefined-trap -fsanitize-undefined-trap-on-error`
* `clang -fsanitize=undefined-trap -fsanitize-undefined-trap-on-error undefined.c`




