---
layout: post
title: 简单的客户端Socket封装
categories: [general, dotnet]
tags: [csharp, socket]
---

上个项目虽然用Unity开发，但是客户端的网络库却是以前项目用C写的一套，新项目不想客户端使用lua了，主要原因是：

1. 开发速度慢
1. 不易调试

所以C模块的存在也就没有必要了，花了一天时间，用C#的Socket重写了一遍。（Unity版本 4.6.7）

## 使用非阻塞的Socket，而非异步模型 ##

	简单看了一下.Net Socket的源码 [`NETFrameworkSource`] ，其异步接口使用了完成端口和线程池，我没看mono源码，不知道mono是如何跨平台实现的，
	这就增加了而非阻塞的Socket是标准的接口，各平台很类似，只是C#层的简单封装。


## Mono的 Socket.Connected 实现有问题 ##
非阻塞的Sokcet需要用Poll(0, SelectMode.SelectWrite)来判断Connect是否成功，Mono版本未实现该功能。

MS .Net实现

    {% highlight C# %}
    public bool Connected {
        get {
            GlobalLog.Print("Socket#" + ValidationHelper.HashString(this) + "::Connected() m_IsConnected:"+m_IsConnected);

            if (m_NonBlockingConnectInProgress && Poll(0, SelectMode.SelectWrite))
            {
                // update the state if we've become connected after a non-blocking connect
                m_IsConnected = true;
                m_RightEndPoint = m_NonBlockingConnectRightEndPoint;
                m_NonBlockingConnectInProgress = false;
            }

            return m_IsConnected;
        }
    }
    {% endhighlight %}

Mono 实现

    {% highlight C# %}
	public bool Connected
	{
		get
		{
			return this.connected;
		}
		internal set
		{
			this.connected = value;
		}
	}
    {% endhighlight %}	

## IL2CPP 错误码问题 ##
	未完待续

## 代码地址 ##
    未完待续


[`NETFrameworkSource`]: http://referencesource.microsoft.com

