---
layout: post
title: 简单的客户端Socket封装
categories: [general, dotnet]
tags: [csharp, socket]
---

上个项目虽然用Unity开发，但是客户端的网络库却是以前项目用C写的一套，新项目不想客户端使用lua了，主要原因是：

1. 开发速度慢
1. 不易调试

所以C模块的存在也就没有必要了，花了一天时间，用C#的Socket重写了一遍。

（Unity版本 4.6.7，操作系统 MacOSX）

[`.Net源码`] 的 Socket

[`Unity Mono源码`]  的 Socket

## 使用非阻塞(non-blocking)的Socket，而非异步操作(asynchronous operation) ##

.Net Socket，其异步操作接口的实现使用了线程池和完成端口。

Mono Socket，其异步操作接口实现使用了线程池。

对比两种Sokcet封装，我比较喜欢非阻塞的，首先利用了系统的异步特性，而非应用层拿多线程模拟的，其次是对C API的简单封装，
封装越简单，代码越稳定。

## Mono的 Socket.Connected 实现有问题 ##

当发现这个问题时，首先我看的是.Net Socket，因为当时Mono代码还在下载中。

MS .Net实现
    
```C#
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

```C#
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
```

对比以上代码可以得出，Mono版本没有针对非阻塞的Socket执行Poll进行再次判断，.Net的Poll只是对select的简单封装，
于是尝试直接执行 Poll(0, SelectMode.SelectWrite) 来判断Connect是否成功，结果发现Poll(0, SelectMode.SelectWrite)
在非阻塞Socket无法Connect的时候依旧返回true， 于是查看
[`Mono Socket的Poll函数`](https://github.com/Unity-Technologies/mono/blob/unity-staging/mcs/class/System/System.Net.Sockets/Socket.cs)

```C#
public bool Poll (int time_us, SelectMode mode)
{
	if (disposed && closed)
		throw new ObjectDisposedException (GetType ().ToString ());

	if (mode != SelectMode.SelectRead &&
	    mode != SelectMode.SelectWrite &&
	    mode != SelectMode.SelectError)
		throw new NotSupportedException ("'mode' parameter is not valid.");

	int error;
	bool result = Poll_internal (socket, mode, time_us, out error);
	if (error != 0)
		throw new SocketException (error);

	if (mode == SelectMode.SelectWrite && result && !connected) {
		/* Update the connected state; for
		 * non-blocking Connect()s this is
		 * when we can find out that the
		 * connect succeeded.
		 */
		if ((int)GetSocketOption (SocketOptionLevel.Socket, SocketOptionName.Error) == 0) {
			connected = true;
		}
	}
	
	return result;
}
```

对比.Net版本，Mono版本有几个不同点:

1. Mono版本是在Poll函数中更新了connected的状态，也就是说，如果想查询非阻塞的Socket是否connected，
.Net版本执行 Socket.Connected 即可，Mono版本每次执行前，要先执行 Socket.Poll(...)
1. Poll函数返回值的含义不同，当用于判断非阻塞Socket是否Connect成功时，.Net Poll返回true时，即代表Connect成功，但Mono版本需要再判断GetSocketOption(...)
1. Poll的实现不同，.Net的Poll只是对select的简单封装，但是Mono的实现是poll或者select

```C#
#ifdef HAVE_POLL
int
mono_poll (mono_pollfd *ufds, unsigned int nfds, int timeout)
{
	return poll (ufds, nfds, timeout);
}
#else

int
mono_poll (mono_pollfd *ufds, unsigned int nfds, int timeout) 
```

这里应当是 [`Unity的Mono`](https://github.com/Unity-Technologies/mono/blob/unity-4.6-staging/mono/utils/mono-poll.c) 出现了bug，对照 [`Mono官方最新版`](https://github.com/mono/mono/blob/88d2b9da2a87b4e5c82abaea4e5110188d49601d/mono/utils/mono-poll.c)

```C#
#if defined(HAVE_POLL) && !defined(__APPLE__)
int
mono_poll (mono_pollfd *ufds, unsigned int nfds, int timeout)
{
	return poll (ufds, nfds, timeout);
}
#else

int
mono_poll (mono_pollfd *ufds, unsigned int nfds, int timeout)
```


### 2016.03.01补充 ###
因为Dns.GetHostEntry解析太慢，改用了 `public void Connect (string host, int port)` 接口，发现还是慢，不过这次慢在了 `Poll (-1, SelectMode.SelectWrite)`, 也就是说，对于非阻塞的Socket在Connect时，阻塞等待了。详细代码如下：

	public void Connect (IPAddress[] addresses, int port)
	{
		// .....
			
			if (!blocking) {
				Poll (-1, SelectMode.SelectWrite);
				error = (int)GetSocketOption (SocketOptionLevel.Socket, SocketOptionName.Error);
				if (error == 0) {
					connected = true;
					seed_endpoint = iep;
					return;
				}
			}
		}
		// .....
	}

	public void Connect (string host, int port)
	{
		IPAddress [] addresses = Dns.GetHostAddresses (host);
		Connect (addresses, port);
	}


再尝试以前使用的接口 `public void Connect (IPAddress address, int port)` 它是非阻塞的，其代码如下，但我没有找到 `public void Connect (IPEndPoint)` 的实现。

	public void Connect (IPAddress address, int port)
	{
		Connect (new IPEndPoint (address, port));
	}

由此可以推断出为什么存在 Socket.Connected 的实现问题。


## 发送队列 ##
以前Send其实是阻塞的，Send失败了，循环继续Send，这次增加了发送队列，虽然可能效率上降低了，但也算用对了吧。
以前的问题记录：[`当send错误码为EAGAIN时`]

## 功能性扩展 ##
Socket存在断开但是应用层需要一段时间才能到的问题，以前都是放在逻辑层发Ping包来解决这个问题，想想还是放在这个类中扩展了吧。

[`.Net源码`]: http://referencesource.microsoft.com
[`Unity Mono源码`]: https://github.com/Unity-Technologies/mono
[`当send错误码为EAGAIN时`]: ../epoll_socket/

