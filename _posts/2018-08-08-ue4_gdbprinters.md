---
layout: post
title: 如何动态加载 UE4 GDBPrinters.py
categories: [general]
tags: [Unreal]
---

UE4提供了[GDBPrinters.py](https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Extras/GDBPrinters/UE4Printers.py) 用以显示UE4的自定义容器, 
但常见的教程都是修改`.gdbinit`文件, 但在生产服务器上, 修改配置文件会影响其他人, 本文提供了动态加载的方法


{% highlight python %}
    (gdb) python
    import sys
    sys.path.append('/data/home/user00/')
    from UE4Printers import register_ue4_printers
    register_ue4_printers(None)
    print("ok")
    end
{% endhighlight %}			