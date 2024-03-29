---
layout: post
title: 使用异步任务系统进行多线程优化
categories: [general]
tags: [c++]
---

随着CPU主频提升缓慢，核心数越来越多，充分利用多核来提升程序性能成为了必不可少的手段。

项目中现有多线程的做法是以模块为单位的，即某个需要多线程的模块，会开启一个或多个后台线程去执行任务。

![](../resources/images/2017-09-09-async_task_module_thread.svg)

这种方式存在三个问题：

1. 模块都要维护自己的多线程逻辑，增加了程序的开发成本，容易引入问题。常见的问题有：
	* 没有使用信号量，采用Sleep轮询的方式检查是否有任务要做。
	* 锁粒度有问题，比如说把一些分配内存，初始化对象等操作放在锁内。
1. 模块间的后台线程没有优先级，无法保证对实时性要求高的任务能及时分配到CPU资源。
1. 不方便根据程序需要动态的调整某个模块的线程数。

针对这些问题，设计了异步任务系统，特点如下：

1. 简单易用，仅需要实现两个函数就可以提供后台线程运行和工作线程回调。
1. 任务执行器内所有的任务使用统一的优先级排序，可以在逻辑上对CPU的使用进行控制。
1. 任务执行器内开启多个后台线程，对于高优先级的任务并发执行。

![](../resources/images/2017-09-09-async_task_async_task_system.svg)

## 异步任务系统有三个逻辑概念：
1. 任务（Task）

	![](../resources/images/2017-09-09-async_task_task.svg)

	参考[Android异步任务](https://developer.android.com/reference/android/os/AsyncTask.html)，提供了两个重载函数：DoInBackground， OnPostExecute：
	* `void DoInBackground()` 在后台线程执行。
	* `void OnPostExecute(int bIsCancel)` 当任务执行完成或者被取消后，在工作线程回调。
	
	通过这两个接口可以避免在DoInBackground中加锁，提升CPU利用率。任务在添加到执行器后，可以调整优先级或取消任务。

1. 任务分组（TaskGroup）

	* 任务分组**包含多个任务**。
	* 常用的做法是按照模块创建任务分组，通过任务分组可以遍历未执行的任务，用于批量调整任务优先级或取消任务。
	* 在模块退出时，从任务执行器中删除任务分组，可保证资源释放顺序。

1. 任务执行器（TaskExecutor）

	* 任务执行器**包含多个任务分组**。
	* 在实际应用中，根据任务对响应时间的差异，分为了快速任务执行器和高并发任务执行器，对于对响应时间敏感，单个任务执行时间较长的任务，也提供了接口创建自己的任务执行器。
		* 快速任务执行器用于对响应时间敏感，但单个任务执行时间较短的任务。（如：捏脸数据计算）
		* 高并发任务执行器用于对响应时间不敏感的任务。（如：模型加载，地形加载）

## 异步任务系统接口介绍：

**`AsyncTaskGroup* CreateGroup(int nExecutorIndex, const char* pszName);`**

创建任务分组，nExecutorIndex为任务执行器的索引，该接口不会阻塞工作线程。

**`int DestoryGroup(AsyncTaskGroup* pGroup);`**

删除任务分组，未执行的任务将会被取消，该接口会阻塞调用线程。

**`int AwaitGroup(AsyncTaskGroup* pGroup);`**

等待任务分组中所有任务执行完成，该接口会阻塞调用线程。

**`int TraversalGroup(AsyncTaskGroup* pGroup, const std::function<int(AsyncTask*)>& fnCallback);`**

在后台线程中遍历未执行的任务，可以调用`ChangeTaskPriority`和`CancelTask`来调整任务优先级或取消任务，该接口不会阻塞工作线程。

**`int AddTask(AsyncTask* pTask, int nPriority, AsyncTaskGroup* pGroup);`**

添加一个任务，该接口不会阻塞工作线程。

**`int AddTask(AsyncTask* const* ppTaskArray, int nArrayLength, int nPriority, AsyncTaskGroup* pGroup);`**

添加多个任务，该接口不会阻塞工作线程。

**`int CancelTask(AsyncTask* pTask);`**

取消任务，不会阻塞，该接口可以在工作线程调用，也可以在后台线程调用。

**`int RemoveTask(AsyncTask* pTask); `**

移除任务，该接口会阻塞工作线程。

**`int AwaitTask(AsyncTask* pTask);`**

等待任务完成，该接口会阻塞工作线程。

**`int ChangeTaskPriority(AsyncTask* pTask, int nPriority);`**

修改任务优先级，该接口不会阻塞工作线程，可以在工作线程调用，也可以在后台线程调用。

**示例**

{% highlight c++ %}
TEST(AsyncTaskInterface, TestExecutorDestoryGroup)
{
	int nTaskCount = 256;
	std::atomic<int> nCallbackCount(0);
	auto pGroup = AsyncTaskInterface::CreateGroup(AsyncTaskExecutor_HighConcurrency, "Test");
	auto fn = [nTaskCount, &nCallbackCount, pGroup]() {
		int nCount = 0;
		for (int i = 0; i < nTaskCount; i++)
		{
			auto pTask = CommonAsyncTask::Create([]() {
				std::this_thread::sleep_for(std::chrono::microseconds(2));
			}, [&nCallbackCount](int) {
				nCallbackCount++;
			});
			AsyncTaskInterface::AddTask(pTask, 0, pGroup);
		}

		while (true)
		{
			std::this_thread::sleep_for(std::chrono::microseconds(1));
			nCount += AsyncTaskInterface::FetchResult();
			if (nCount > 0)
				break;
		}
	};
	std::thread Thread1(fn), Thread2(fn);
	Thread1.join();
	Thread2.join();

	AsyncTaskInterface::DestoryGroup(pGroup);
	
	ASSERT_EQ(nTaskCount * 2, nCallbackCount.load());
}
{% endhighlight %}

## 实际应用对比
对于预加载列表模块：

* 代码量：由143行减少到101行。
* 执行时间：由平均4637.8毫秒降低到2746.8毫秒。（受限于HDD的读取速度）
* 更多模块数据等待测试开发反馈

## 和std::future比较
std::future 提供了在后台执行任务的功能，但没有提供线程数、优先级控制及取消任务功能。

## 如何更高效的使用异步任务系统
减少任务并发时锁冲突，可使用Intel VTune Amplifier的Locks and Waits Analysis分析，按照Spin Time排序，解决热点。