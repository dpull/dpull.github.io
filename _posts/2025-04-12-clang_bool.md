---
layout: post
title: C++使用bool时一定要初始化
categories: [general]
tags: [c++]
---

{% highlight c %}
#include <stdlib.h> 
#include <stdio.h> 

__attribute__((noinline)) int getValue(bool b) {
    int size = 0;
    if (b)
        size += 2;
    return size;
}

union {
    unsigned char c;
    bool b;
} volatile u;

int main() {
    u.c = 6;
    int sz = getValue(u.b);
    printf("%d\n", sz);
    return 0;
}
{% endhighlight %}

c++标准只规定了bool有两个取值: true和false, 即1和0. 
编译器为了减少if判断，会将
{% highlight c %}
    if (b)
        size += 2;
{% endhighlight %}
优化为`size+=b*2`, 
当b未赋值，或者没有明确赋值，就会出现以上问题