---
layout: post
title: linux 动态库依赖问题定位和解决
categories: [general]
tags: [linux]
---

近两天解决了动态库依赖的问题, 都是之前用过的工具, 记录下来, 备忘.

## 找不到so问题

使用`ldd`查看依赖的so有没有缺失的

## 找不到符号问题

通过`nm`命令去查看符号信息

{% highlight bash %}
nm xxx
nm -D xxx.so
{% endhighlight %}

重点关注`T`和`U`两种类型:

* 大`T`标识说明哪些要加入全局符号表
* 大`U`标识说明该符号在当前文件中是未定义的, 需要从全局符号表中查找
