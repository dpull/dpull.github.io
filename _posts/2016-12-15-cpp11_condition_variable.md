---
layout: post
title: std::condition_variable 简单验证小结
categories: [general]
tags: []
---

使用`std::condition_variable`做类似信号量的功能，想到了几个问题：

1. `std::condition_variable::wait` 的pred函数是否是加锁的？
1. `std::condition_variable::wait` 的pred函数在哪个线程执行？
1. `std::condition_variable::wait` 的pred函数如果直接返回true是否等同于不用这个参数？
1. 如果在锁内调用`std::condition_variable::notify_all`是立即 `std::condition_variable::wait` 响应还是等`std::condition_variable::notify_all`所在线程的锁结束了，再响应？
1. 如果锁内多次调用 `std::condition_variable::notify_all`，`std::condition_variable::wait`会响应几次？

把 [cppreference的Example](http://en.cppreference.com/w/cpp/thread/condition_variable/notify_all) 简单改了一下，在`Xcode Version 8.1 (8B62)`进行了验证，结论如下：（测试代码再本文最下面。）

1. `std::condition_variable::wait` 的pred函数是加锁的。
1. `std::condition_variable::wait` 的pred函数wait`的线程执行。
1. `std::condition_variable::wait` 的pred函数如果直接返回true，该线程并不会`wait`，所以不等同于无此参数。
1. 如果在锁内调用`std::condition_variable::notify_all`要等其所在线程的锁结束了，再响应`std::condition_variable::wait` 的pred函数。
1. 没有想到办法测试`std::condition_variable::notify_all`多次调用，但多次调用`std::condition_variable::notify_one`后，可以被多个线程响应到。


{% highlight c++ %}
#include <iostream>
#include <condition_variable>
#include <thread>
#include <chrono>

std::condition_variable cv;
std::mutex cv_m; // This mutex is used for three purposes:
// 1) to synchronize accesses to i
// 2) to synchronize accesses to std::cerr
// 3) for the condition variable cv
volatile int i = 0;

void waits_signals(int index)
{
    std::unique_lock<std::mutex> lk(cv_m);
    
    std::cerr << index << "\t[waits_signals][waiting]:" << i << "\t" << std::this_thread::get_id() << std::endl;
    
    cv.wait(lk, [index]{
        std::cerr << index << "\t[waits_signals][wait-start]:" << i << "\t" << std::this_thread::get_id() << std::endl;
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::cerr << index << "\t[waits_signals][wait-end]:" << i << "\t" << std::this_thread::get_id() << std::endl;
        return i == 1;
    });
    
    i = 3;
    std::cerr << index << "\t[waits_signals][signal-before]:" << i << "\t" << std::this_thread::get_id() << std::endl;
    cv.notify_all();
    
    i = 4;
    std::cerr << index << "\t[waits_signals][signal-end]:" << i << "\t" << std::this_thread::get_id() << std::endl;
}

void signals_waits(int index)
{
    std::this_thread::sleep_for(std::chrono::seconds(5));
    
    {
        std::unique_lock<std::mutex> lk(cv_m);
        i = 1;
        
        std::cerr << index << "\tsignals_waits][signal-before]:" << i << "\t" << std::this_thread::get_id() << std::endl;
        cv.notify_all();
        // cv.notify_one();
        // cv.notify_one();
        
        //i = 2;
        std::cerr << index << "\tsignals_waits][signal-end]:" << i << "\t" << std::this_thread::get_id() << std::endl;

        std::cerr << index << "\tsignals_waits][waiting]:" << i << "\t" << std::this_thread::get_id() << std::endl;
        cv.wait(lk, [index]{
            std::cerr << index << "\tsignals_waits][wait]:" << i << "\t" << std::this_thread::get_id() << std::endl;
            return i == 3;
        });
    }
}

int main()
{
    std::thread t1(signals_waits, 1), t2(waits_signals, 2), t3(waits_signals, 3), t4(waits_signals, 4);
    t1.join();
    t2.join();
    t3.join();
    t4.join();
}
{% endhighlight %}


