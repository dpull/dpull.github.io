---
layout: post
title: Unreal多线程模型
categories: [general]
tags: [unreal, thread]
---
## 多线程实现

`FRunnable` 是可被多线程处理对象的基类，其声明如下：

{% highlight cpp %}
class CORE_API FRunnable
{
public:
	virtual bool Init();
	virtual uint32 Run() = 0;
	virtual void Stop();
	virtual void Exit();
	virtual class FSingleThreadRunnable* GetSingleThreadInterface();
};

class CORE_API FSingleThreadRunnable
{
public:
	virtual void Tick() = 0;
};
{% endhighlight %}

`FRunnableThread` 是对多线程的封装。在创建时，会传入继承于 `FRunnable` 类型的对象。它有三种实现：

1. `FRunnableThread::ThreadType.Real`

如果启用了多线程，就会调用 `FPlatformProcess::CreateRunnableThread` 根据不同的操作系统创建真实线程。在后台线程中，首先调用 `FRunnable::Init`，成功后调用 `FRunnable::Run`，最后调用 `FRunnable::Exit`。

1. `FRunnableThread::ThreadType.Fake`

如果禁用了多线程，会创建 `FFakeThread` 对象。在创建时，它会调用 `FRunnable::GetSingleThreadInterface` 获取单线程执行的接口。成功后调用 `FRunnable::Init`。在每帧 `FThreadManager::Tick()` 时，会调用 `FFakeThread::Tick()`，然后调用 `FSingleThreadRunnable::Tick`。

注意：当启用多线程时，不会在 `FThreadManager::Tick()` 时调用 `FFakeThread::Tick()`。

1. `FRunnableThread::ThreadType.Forkable`

`FForkableThread` 是 `FRunnableThread::ThreadType.Fake` 和 `FRunnableThread::ThreadType.Real` 的组合，默认是 `FFakeThread` 逻辑。当调用 `FForkableThread::OnPostFork()` 后创建真实线程，执行 `FRunnableThread::ThreadType.Real` 逻辑。

- 使用 `FRunnableThread::Create` 函数，会根据 `FPlatformProcess::SupportsMultithreading()` 判断创建 `FRunnableThread::ThreadType.Real` 或 `FRunnableThread::ThreadType.Fake`。
- 使用 `FForkProcessHelper::CreateForkableThread`，当 `FPlatformProcess::SupportsMultithreading()` 返回 `false` 时，会根据 `FForkProcessHelper::SupportsMultithreadingPostFork()` 判断创建 `FRunnableThread::ThreadType.Fake` 或 `FRunnableThread::ThreadType.Forkable`（备注：在 `OnPostFork` 后，不会创建 `FRunnableThread::ThreadType.Forkable`，而会创建 `FRunnableThread::ThreadType.Real`）。

## 多线程总结

如果 `FRunnable` 实现了 `FSingleThreadRunnable`，可以支持多线程和单线程两种模型同时运行。目前支持该类型模型的模块有：

- FAsyncWriter
- FHttpThread
- FMessageBus
- FMessageBus
- FReserveScheduler
- FOnlineSubsystemNull