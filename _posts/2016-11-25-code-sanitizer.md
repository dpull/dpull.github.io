---
layout: post
title: 使用Clang/GCC的Sanitizer提升程序质量(asan)
categories: [general]
tags: []
---

在Clang的[Controlling Code Generation](http://clang.llvm.org/docs/UsersManual.html#controlling-code-generation) 或 GCC的[Program Instrumentation Options](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html)中提供了一系列的参数，可以帮程序解决一些常见的内存问题。

本文使用Clang。

## AddressSanitizer

内存错误是C／C++的最常见的问题，可能导致程序诡异崩溃，十分难查。内存错误检查[AddressSanitizer](http://clang.llvm.org/docs/AddressSanitizer.html)可用来查找如内存溢出，内存重叠等问题，会带来2倍的速度消耗。

**开启方法：**

* `XCode` `Edit Scheme`->`Run`->`Diagnostics`->勾选`Address Sanitizer`
* `clang -fsanitize=address test.c`

**示例：**

* AddressSanitizer: stack-buffer-overflow

{% highlight c %}
long long n = 0;
if (*(long long*)&n == *(long long*)"hr");
{% endhighlight %}

* AddressSanitizer: heap-buffer-overflow

{% highlight c %}
    char *ptr = (char *)malloc(5);
    if (ptr[-1] == '\0');
    if (ptr[12] == '\0');
{% endhighlight %}


* AddressSanitizer: heap-use-after-free

{% highlight c %}
class Test
{
public:
    int Release()
    {
        if (--m_nRef == 0)
            delete this;
        return m_nRef;
    }
    int m_nRef = 1;
};

auto p = new Test;
p->Release();
{% endhighlight %}


* AddressSanitizer: strncpy-param-overlap: memory ranges

{% highlight c %}
char sz[64];
sz[0] = '\0';
strncpy(sz, sz, sizeof(sz));
{% endhighlight %}

* AddressSanitizer: memory leak（仅支持linux）

{% highlight bash %}
$ cat memory-leak.c
#include <stdlib.h>
void *p;
int main() {
  p = malloc(7);
  p = 0; // The memory is leaked here.
  return 0;
}
% clang -fsanitize=address -g memory-leak.c ; ASAN_OPTIONS=detect_leaks=1 ./a.out
==23646==ERROR: LeakSanitizer: detected memory leaks
Direct leak of 7 byte(s) in 1 object(s) allocated from:
    #0 0x4af01b in __interceptor_malloc /projects/compiler-rt/lib/asan/asan_malloc_linux.cc:52:3
    #1 0x4da26a in main memory-leak.c:4:7
    #2 0x7f076fd9cec4 in __libc_start_main libc-start.c:287
SUMMARY: AddressSanitizer: 7 byte(s) leaked in 1 allocation(s).
{% endhighlight %}

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

**开启方法：**

* `XCode` 在`Other Warning Flags`（其他也可）添加： `-fsanitize=undefined-trap -fsanitize-undefined-trap-on-error`
* `clang -fsanitize=undefined-trap -fsanitize-undefined-trap-on-error undefined.c`

## 未完待续




