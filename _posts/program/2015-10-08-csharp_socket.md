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

简单看了一下.Net Socket的源码 [`NETFrameworkSource`] ，其异步接口的实现使用了完成端口和线程池，
我没看Mono源码，不知道其是如何跨平台实现的，也应当使用了线程池吧，
我希望的封装是对C API的简单封装，这样出了问题也好查。

## Mono的 Socket.Connected 实现有问题 ##
非阻塞的Sokcet需要用Poll(0, SelectMode.SelectWrite)来判断Connect是否成功，Mono版本未实现该功能。

MS .Net实现
    
    ```
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
    ```

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

## 发送队列 ##
以前Send其实是阻塞的，Send失败了，循环继续Send，这次增加了发送队列，虽然可能效率上降低了，但也算用对了吧。
以前的问题记录：当send错误码为EAGAIN时 [`EpollSocket`]

## 功能性扩展 ##
Socket存在断开但是应用层需要一段时间才能到的问题，以前都是放在逻辑层发Ping包来解决这个问题，想想还是放在这个类中扩展了吧。


## 代码地址 ##
    未完待续


[`NETFrameworkSource`]: http://referencesource.microsoft.com
[`EpollSocket`]: ../epoll_socket/

