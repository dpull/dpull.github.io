---
layout: post
title: 使用C＋＋11实现lock free的知识点
categories: [general]
tags: []
---

C++11提供了两种CAS(Compare & Set)函数：

{% highlight c++ %}
template< class T >
bool atomic_compare_exchange_weak( std::atomic<T>* obj, 
                                   T* expected, T desired );
template< class T >
bool atomic_compare_exchange_weak( volatile std::atomic<T>* obj, 
                                   T* expected, T desired );
template< class T >
bool atomic_compare_exchange_strong( std::atomic<T>* obj,
                                     T* expected, T desired );
template< class T >
bool atomic_compare_exchange_strong( volatile std::atomic<T>* obj,
                                     T* expected, T desired );
{% endhighlight %}                                     
                               
## 实现原理

伪代码：

{% highlight c++ %}
if (*obj == *expected)
{
	*obj = desired;
	return true
}
else
{
	*expected ＝ *obj
	return false
}
{% endhighlight %}    

## `*_weak`和`*_strong`的区别

对于compare_exchange_weak()函数，当原始值与预期值一致时，存储也可能会不成功；在这个例子中变量的值不会发生改变，并且compare_exchange_weak()的返回是false。这可能发生在缺少独立“比较-交换”指令的机器上，当处理器不能保证这个操作能够自动的完成——可能是因为线程的操作将指令队列从中间关闭，并且另一个线程安排的指令将会被操作系统所替换(这里线程数多于处理器数量)。这被称为“伪失败”(spurious failure)，因为造成这种情况的原因是时间，而不是变量值。所以`atomic_compare_exchange_weak`一般用于循环，以实现更好的性能。

## std::memory_order介绍
待完善

## 模版类型限制：
虽然其接口支持模版，但并非支持所有大小的数据结构：

> atomics for width-based integrals (those defined in <cinttypes>).
Each of these is either an alias of one of the above atomics for fundamental integral types or of a full specialization of the atomic class template with an extended integral type.
> 
> Where N is one in 8, 16, 32, 64, or any other type width supported by the library.

目前主流的编译器一般支持1，2，4，8字节的长度，具体要查编译器文档，如：[5.45 Built-in functions for atomic memory access](https://gcc.gnu.org/onlinedocs/gcc-4.2.0/gcc/Atomic-Builtins.html):*GCC will allow any integral scalar or pointer type that is 1, 2, 4 or 8 bytes in length.*


## ABA问题：

1. 进程P1在共享变量中读到值为A
1. P1被抢占了，进程P2执行
1. P2把共享变量里的值从A改成了B，再改回到A，此时被P1抢占。
1. P1回来看到共享变量里的值没有被改变，于是继续执行。        

虽然P1以为变量值没有改变，继续执行了，但是这个会引发一些潜在的问题。ABA问题最容易发生在lock free 的算法中的，CAS首当其冲，因为CAS判断的是指针的地址。如果这个地址被重用了呢，问题就很大了。（地址被重用是很经常发生的，一个内存分配后释放了，再分配，很有可能还是原来的地址）

## 参考文档
1. [无锁队列的实现](http://coolshell.cn/articles/8239.html)  
                       