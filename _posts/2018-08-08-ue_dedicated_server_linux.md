---
layout: post
title: Unreal Dedicated Server Linux 环境配置(UE DS)
categories: [general]
tags: [unreal]
---

## 禁用root用户检查
DS默认禁止root用户启动, 但在K8S中, 默认需要root启动, 所以需要禁用掉root用户检查.

{% highlight cpp %}
// UnrealEngine/Engine/Source/Runtime/Core/Private/Unix/UnixPlatformMemory.cpp
#define UE4_DO_ROOT_PRIVILEGE_CHECK 0
{% endhighlight %}			

## 强制产生Core文件

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

## 动态加载 GDBPrinters.py

UE提供了[GDBPrinters.py](https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Extras/GDBPrinters/UE4Printers.py) 用以显示UE4的自定义容器, 
但常见的教程都是修改`.gdbinit`文件, 但在生产服务器上, 修改配置文件会影响其他人, 可用动态加载的方法

{% highlight python %}
(gdb) python
    import sys
    sys.path.append('/data/home/user00/')
    from UE4Printers import register_ue4_printers
    register_ue4_printers(None)
    print("ok")
end
{% endhighlight %}			