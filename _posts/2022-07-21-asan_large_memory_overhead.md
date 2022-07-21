---
layout: post
title: asan占用内存过大问题优化
categories: [general]
tags: []
---

基于`gcc4.8.5`

注意: `gcc4.8.5`提供了很老版本的asan, 和现有的文档中的选项有区别

## 问题

后台开启asan后, 内存持续增长, 耗尽物理内存

## 问题定位

asan为了检测`use-after-free`错误, 会区别于正常内存另外开辟一个隔离区(`quarantine cache list`), 用户每次释放内存, asan都会将释放的内存放置其中并且不对此区域的内存进行复用, 用户对隔离区内容的访问都会被检测为`use-after-free-error`.

因为服务器禁用了swap, 所以物理内存降低.

## 解决方案

1. 局部开启asan:只给C++代码较重的服务开启asan(如果可执行文件非asan, 动态库是asan的, 需要`LD_PRELOAD=./libasan.so.0`)
1. 设置`ASAN_OPTIONS`中的`quarantine_size`选项(注意:高版本是`quarantine_size_mb`), 限制隔离区大小
1. 我们用的选项为 `ASAN_OPTIONS=help=disable_core=0:unmap_shadow_on_exit=1:abort_on_error=1:quarantine_size=167772168:log_path=./log/asan.log`(注意:高版本的选项和这个不同)
    * 开启core是为了和现有的监控系统结合起来, 以及比较方便的定位问题
    * 开启log是因为程序后台运行, 无法查看stderr, core中只有堆栈, 没有为什么crash掉, 两者结合会更容定位问题

## 附录
* 安装asan
{% highlight bash %}
yum install libasan -y
yum install libasan-static -y (如果选择静态链接asan, -static-libasan)
{% endhighlight %}

* 开启asan
{% highlight cmake %}
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -fno-omit-frame-pointer -fsanitize=address")
set(CMAKE_LINKER_FLAGS_DEBUG "${CMAKE_LINKER_FLAGS_DEBUG} -fno-omit-frame-pointer -fsanitize=address")
{% endhighlight %}