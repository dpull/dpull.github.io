---
layout: post
title: .NET Tcp/IP Socket使用二三事
categories: [general]
tags: [C#, Socket]
---

来公司后一直负责网络库部分,后来一个工具项目需要用.net写一个网络库，就动手写了一个，与公司网络库使用复杂的IOCP模型和epool相比，这个.net网络库采用了最简单的select模型。

## 为了增加效率，可以考虑采用无异常的函数 ##
在.net2.0中Socket.Send,Socket.Receive 有了无异常的函数，
减少不必要的异常，就等于增加效率。

{% highlight c# %}
Socket.Send(Byte[], Int32, Int32, SocketFlags, SocketError) 
Socket.Receive(Byte[], Int32, Int32, SocketFlags, SocketError) 
{% endhighlight %}

## Socket.Connected 不是当前的Socket状态 ##

> **MSDN：**
> 获取一个值，该值指示 Socket 是在上次 Send 还是 Receive 操作时连接到远程主机。 
>     
> **应当如何解决呢？**
> Connected 属性的值反映最近操作时的连接状态。如果您需要确定连接的当前状态，请进行非阻止、零字节的 Send 调用。 如果该调用成功返回或引发 WAEWOULDBLOCK 错误代码 (10035)，则该套接字仍然处于连接状态；否则，该套接字不再处于连接状态。 

## 要用Socket.Poll判断是否可以接收，不要用Socket.Available ##
虽然Socket.Available可以偷窥到当前Recv缓冲区字节数，而且Available是Poll速度的两倍，但是

> **MSDN：** 
> 如果远程主机使用 Shutdown 方法关闭了 Socket
> 连接，并且所有可用数据均已收到，则 Receive 方法将立即完成并返回零字节。

所以当网络断开的时候单纯使用Socket.Available判断是否recv到数据会存在不知道客户端已经断开Bug

**补充：**
不推荐使用Socket.Poll对Socket的列表遍历，应当使用Socket.Select（或者其他模型），Socket.Poll是对Socket.Select的封装，执行Socket.Poll耗时是非阻塞Socket.Recv的三倍。

## 非阻塞模式不能采用Receive的返回值表示是否断开 ##
**上条**说道：如果远程主机使用 Shutdown 方法关闭了 Socket
连接，并且所有可用数据均已收到，则 Receive
方法将立即完成并返回零字节。但这并不能阻塞模式说明Socket已经断开，
**这一条和C的recv函数不同，需要特别注意**
。需要判断out出来的SocketError，当不为SocketError.Success、SocketError.Interrupted和SocketError.WouldBlock时就可以认为网络已经断开。

## Send可能出现缓冲区满的情况 ##
判断out出来的SocketError，如果等于SocketError.WouldBlock，则是Send缓冲区已满，应断开该Socket，否则影响整体速度，而不应当again,
反过来说允许的错误码只有SocketError.Interrupted，此时可以重来一次。

## 主动断开Socket ##
**MSDN说道：** 如果当前使用的是面向连接的 Socket，则必须先调用 Shutdown
方法，然后才能关闭
Socket。这可以确保在已连接的套接字关闭之前，已发送和接收该套接字上的所有数据。

所以，网络库的Close函数可以封装为先调用
Shutdown(SocketShutdown.Both)，在调用Close()。

## Socket已经关闭(Close)但不能在另一端断开 ##
一端Scoket已经关闭了，但另一端短时间内仍可以发送数据！这个问题还没有找到解决办法的，但原因已知，
**在《Windows网络编程技术》一书(P139-P140)中说道：**
被动关闭的情况下，应用程序会从对方那里接收一个FIN包，并用一个ACK包做出响应。此时，应用程序的套接字会变成ClOSE\_WAIT状态。由于对方已关闭自己的套接字，所以不能再发送数据了。
**但应用程序却不同，它能一直发送数据，直到对方的套接字已关闭为止。**
