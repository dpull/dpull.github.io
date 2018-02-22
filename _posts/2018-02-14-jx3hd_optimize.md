---
layout: post
title: 剑三重制版CPU优化总结
categories: [general]
tags: []
---

最近这半年的工作内容是优化客户端性能，其中主要是进行CPU优化，趁着春节假期，把做过的事情沉淀一下。

CPU优化主要分成两个大块:

1. 充分利用多核
1. 提高渲染主线程的性能

优化工具:

[Intel Vtune Amplifier](https://software.intel.com/en-us/intel-vtune-amplifier-xe/)

## 充分利用多核

进行优化前，客户端的CPU利用率很低，仅1.2个核心，但线程数非常多，存在大量的Spin time。主要是因为：

1. 需要异步处理的模块通常开启了自己的模块的一个后台线程，造成了线程数远多于核心数。
1. 线程写法不规范，采用了Sleep轮询有没有新任务需要处理，和上一条结合起来，出现了频繁的线程切换。
1. 代码设计有问题，模块没有专门为多线程设计，直接采用加锁的手段改造原有的单线程，存在大量的锁冲突。

### 解决办法

开发异步任务系统，根据CPU核心数创建定量的线程数（核心数-2，但最少为2），减少频繁线程切换。
异步任务系统支持优先级，也支持运行时调整优先级，确保核心的准确利用。

异步任务系统的API简单，可以避免线程写法不规范。另外通过lamda表达式注册任务给异步任务系统，原有逻辑改动量很小。

### 带来问题
1. 机械硬盘多线程加载瓶颈
1. 多进程的操作系统，偶尔核心数不足

> 使用`Vtune`的`Locks and Waits`模式可以清晰的看出每个线程对CPU核心的利用情况，线程间的锁等待情况。 

## 提高渲染主线程的性能

> 通过`Vtune`的`Basic Hotspots`模式可以简单的看到热点

1. 把耗时较久的函数交给异步任务系统。
1. 减少每帧的查找操作
    这个主要是代码设计问题，每帧去map中查找数据，通过调整数据结构或缓存查找的结果进行优化。
1. 调整数据结构降低Cache miss
    Cache miss主要分为ICache miss和DCache miss，可以用Vtune的'Memory Consumption'模式可以清晰的看出各级Cache的命中情况，但这个模式仅在初期用了下，后期主要在`Basic Hotspots`模式下看汇编指令的耗时就能分析出来，比如mov指令非常耗，可能就是出现了DCache miss，这个时候可以通过调整数据结构，比如说链表转数组等等减少Cache miss。
1. 使用多核的内存分配器减少内存分配的卡顿
    VC自带的内存分配器和项目原有的内存分配器在多核下表现不好，我们评估了tcmalloc、jemalloc、tbbmalloc，再性能上差异不大，但是只有jemalloc支持内存返还给系统（其他的也可能有配置，但默认没有开启）所以选择了jemalloc。
1. 使用读写锁取代锁（使用shared_mutex取代mutex）
    std::shared_mutex是C++17提供的读写锁，它可以用[Windows的SRWLock简单模拟出来](https://github.com/dpull/msvc_compat/blob/master/include/shared_mutex.h)，使用读写锁可以大大加快一些不经常变化的全局数据的访问性能。

### 如何减少顿卡（完善中...）

顿卡的原因有哪些？
1. 当前线程挂起（磁盘IO，内存分配，线程间等待，调用显卡API）。
1. CPU核心数不足，造成挂起后难以恢复。

以上原因可以用`Vtune`的`Locks and Waits`模式清晰的看出来，但是`Vtune`主要是用来展示CPU利用率较高的函数，当线程挂起时，CPU利用率并不高，我的一个经验是利用`Vtune`的[Frame API](https://software.intel.com/en-us/vtune-amplifier-help-frame-api)把每帧列出来，针对耗时长点帧挨个看`Vtune`的采样点，知道当前帧卡顿时再做什么。

