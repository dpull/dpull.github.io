---
layout: post
title: C++ 用户定义字面量 
categories: [general]
tags: [c++]
---

参考: https://zh.cppreference.com/w/cpp/language/user_literal

{% highlight c++ %}
long double operator ""_w(long double);
std::string operator ""_w(const char16_t*, size_t);
unsigned    operator ""_w(const char*);
 
int main()
{
    1.2_w;    // 调用 operator ""_w(1.2L)
    u"one"_w; // 调用 operator ""_w(u"one", 3)
    12_w;     // 调用 operator ""_w("12")
    "two"_w;  // 错误：没有适用的字面量运算符
}
{% endhighlight %}	
	
