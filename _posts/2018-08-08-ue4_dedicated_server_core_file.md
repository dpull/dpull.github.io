---
layout: post
title: UE4 Dedicated Server 为何不产生core文件(DS)
categories: [general]
tags: [unreal]
---

当UE4 Dedicated Server crash时, 会被本进程捕获到输出堆栈到日志中, 但没有产生core文件, 但有的时候又会产生core文件.

为什么这么随机呢? 通过以下代码可知, `UE_BUILD_SHIPPING`模式下是不开启的, 可以通过参数`-core`强制打开.

{% highlight cpp %}
// core dump policy:
// - Shipping disables it by default (unless -core is passed)
// - The rest set it to infinity unless -nocore is passed
// (in all scenarios user wish as expressed with -core or -nocore takes priority)
// Note that we used to have Test disable cores by default too. This has been changed around UE 4.15.
bool bDisableCore = (UE_BUILD_SHIPPING != 0);
if (FParse::Param(*GSavedCommandLine, TEXT("nocore")))
{
    bDisableCore = true;
}
if (FParse::Param(*GSavedCommandLine, TEXT("core")))
{
    bDisableCore = false;
}
{% endhighlight %}			