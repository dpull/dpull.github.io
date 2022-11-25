---
layout: post
title: std::condition_variable 简单验证小结
categories: [general]
tags: [C/C++]
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


## 项目中出现过的问题
在实际应用中出现这样一个问题，代码如下：

{% highlight c++ %}
class ThreadAwait
{
public:
    void Wait()
    {
        std::unique_lock<decltype(m_Mutex)> lock(m_Mutex);
        m_ConditionVar.wait(lock, [this]() {return m_WaitFinish.load(); });
    }

    void Notify()
    {
        m_WaitFinish.store(true);
        m_ConditionVar.notify_all();
    }
private:
    std::atomic<bool> m_WaitFinish{false};
    std::mutex m_Mutex;
    std::condition_variable m_ConditionVar;
};
{% endhighlight %}

它使用`std::atomic`作为`std::condition_variable`的判断条件，在`Notify()`时去掉了锁，这个逻辑看似没有问题，但如果出现在 `验证问题[5]` 这种情形时，导致调用`Wait()`的线程无法恢复。