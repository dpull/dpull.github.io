---
layout: post
title: UE4 Dedicated Server 为何不产生core文件
categories: [general]
tags: []
---

当 UE4 Dedicated Server crash时, 会被本进程捕获到, 输出堆栈到日志中, 但不会产生core文件, 造成有些crash问题不好查.

为什么不产生core文件呢? 通过以下代码可知, `UE_BUILD_SHIPPING`模式下是默认捕获崩溃的, 所以没有产生core(且没有办法通过命令行配置, 需改代码开启)

{% highlight cpp %}
#if UE_BUILD_DEBUG
		if( true && !GAlwaysReportCrash )
#else
		if( FPlatformMisc::IsDebuggerPresent() && !GAlwaysReportCrash )
#endif
		{
			// Don't use exception handling when a debugger is attached to exactly trap the crash. This does NOT check
			// whether we are the first instance or not!
			ErrorLevel = RealMain( *GSavedCommandLine );
		}
		else
		{
			FPlatformMisc::SetCrashHandler(CommonLinuxCrashHandler);
			GIsGuarded = 1;
			// Run the guarded code.
			ErrorLevel = RealMain( *GSavedCommandLine );
			GIsGuarded = 0;
		}
{% endhighlight %}			