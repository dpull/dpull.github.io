---
layout: post
title: std::condition_variable 简单验证小结
categories: [general]
tags: []
---

## Condition Variable（条件变量）
condition variable用来唤醒一个或多个等待某特定条件（意指某些必须由他人提供或执行的东西）获得满足的线程。多个线程可以等待同一条件发生。一旦条件满足，线程就可以通知（notify）所有（或某个）等待者（线程）。

condition variable存在假醒问题（spurious wakeup），也就是某个condition variable的wait动作有可能在该condition variable尚未被notified时便返回。假醒无法被测定，以使用者的观点来看它们实质上是随机的。它通常发生于thread library无法可靠确定某个waiting thread不遗漏任何notification时。由于遗漏notification便代表condition variable无用，thread library宁愿在线程中唤醒它而不愿承受风险。因此发生wakeup不一定意味着线程所需要的条件已经满足了，仍需要代码去验证“条件实际已达成”。

`std::condition_variable` 需要和 `std::unique_lock<std::mutex>` 配合使用。

### std::lock_guard<>和 std::unique_lock<> 的区别：

`std::lock_guard<>` 使用RAII守则对mutex进行了简单的封装，在它的生命周期中，mutex都是锁住的。

`std::unique_lock<>` 提供了“何时”以及如何锁定或者解锁其mutex，因此其object可能（但也可能不）拥有一个被锁住的mutex。可以调用`owns_lock()`或`bool()`来查询mutex是否被锁住。


## 验证的问题

1. `std::condition_variable::wait` 的pred函数是否是加锁的？
1. `std::condition_variable::wait` 的pred函数在哪个线程执行？
1. `std::condition_variable::wait` 的pred函数如果直接返回true是否等同于不用这个参数？
1. 如果在锁内调用`std::condition_variable::notify_all`是立即 `std::condition_variable::wait` 响应还是等`std::condition_variable::notify_all`所在线程的锁结束了，再响应？
1. 如果在`std::condition_variable::wait` 的pred函数执行的时候，继续发起`std::condition_variable::notify_all`，会不会多次响应

把 [cppreference的Example](http://en.cppreference.com/w/cpp/thread/condition_variable/notify_all) 简单改了一下，在`Xcode Version 8.1 (8B62)`进行了验证，结论如下：

1. `std::condition_variable::wait` 的pred函数是加锁的。
1. `std::condition_variable::wait` 的pred函数wait`的线程执行。
1. `std::condition_variable::wait` 的pred函数如果直接返回true，该线程并不会`wait`，所以不等同于无此参数。
1. 如果在锁内调用`std::condition_variable::notify_all`要等其所在线程的锁结束了，再响应`std::condition_variable::wait` 的pred函数。
1. 不会多次响应。

测试代码：

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


