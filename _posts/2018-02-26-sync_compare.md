---
layout: post
title: 同步机制的性能对比
categories: [general]
tags: [summary]
---

C++11起增加了`std::atomic`、`std::mutex`、`std::shared_mutex(C++17)`等同步机制，
本文的目的在于测试同步机制消耗。

因为不同机器，不同系统，不同版本的编译器都会不同，本文仅在mac下测试。

## 测试代码:

{% highlight c %}
auto run_count = atoll(argv[1]); // 防止编译器优化, input=1024*1024*1024
auto step = atoi(argv[2]); // 防止编译器优化, input=2
timer.start();
for (int i = 0; i < run_count; ++i) 
    volatile_int += step;
timer.stop("volatile_timer");
... // 对volatile_int 进行输出，目的防止编译器优化
{% endhighlight %}

volatile_int 的类型分别是 int, volatile int, std::atomic<int>, std::mutex, std::shared_mutex的lock和lock_shared。

## 测试环境：

* 测试机: MacPro
* 操作系统:macosx 10.13.3 
* Xcode:9.2
* C++标准 C++17
* 编译器 clang

## 测试结果:

Type\Seconds                |-O0       |-O1       |-O2       |-O3
int                         |2.14884   |5.1e-08   |6.3e-08   |5.2e-08
volatile int                |2.273     |1.89698   |1.82805   |1.81114
atomic int                  |10.8789   |6.65559   |6.64927   |6.63348
mutex int                   |24.1458   |23.8576   |23.8675   |23.7508
shared_mutex lock           |63.414    |61.3186   |61.5168   |61.5864
shared_mutex lock_shared    |51.2651   |49.3427   |49.6779   |49.663


## 对比数据

在《Windows核心编程（第五版）》8.5节，有类似的测试（图8-2）

线程\微秒    | volatile读取 | volatile写入 | Interlocked递增 |关键段 |SRWLock共享模式 |SRWLock独占模式 | 互斥量
1           | 8           | 8            | 35             | 66   | 66            | 67           | 1060
2           | 8           | 76           | 153            | 268  | 134           | 148          | 11082
4           | 9           | 145          | 361            | 768  | 244           | 307          | 23785





