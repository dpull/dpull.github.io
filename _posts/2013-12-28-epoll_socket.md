---
layout: post
title: 网络库相关
categories: [general]
tags: [socket, epoll]
---

随着虚拟主机和移动互联网的兴起，原本端游的服务端网络库需要运行在更为复杂的环境中了。

为此我对其中一些代码进行完善，下面是针对各个接口的总结。

## TCP的socket是什么？

TCP的socket是状态机。

它通过三次握手建立连接；
在关闭时，发送`SYN`分节进行终止，操作系统会保持套接字`time_wait`状态，以实现可靠的实现TCP全双工终止和允许老的重复分节在网络中消逝。

## `connect()` 函数

因为TCP的socket是状态机，如果`connect()`失败后要`close()`，不能再次`connect()`。 
*与此相反，UDP的socket是没有状态的，它的`connect()`可以多次调用，然后调用`write()`或`read()`操作，效果和`sendto()`和`recvfrom()`相同，但减少了参数传递。*

## `listen()` 函数

调用`listen()`后该socket， 会有两条队列：未完成三次握手队列，完成三次握手队列。两个队列总和的最大值和参数backlog有关。 *不要把backlog定义为0，因为不同的实现对此有不同的解释。*

## `accept()` 函数

堵塞的`accept()`，在polling模型中会出现安全隐患。
当一个连接连上随即断开，可能会出现`select()`时显示可读，但是`accept()`时堵塞，由此将线程堵塞住。
为解决这个问题，可以将监听的socket设置为非堵塞。

`accept()`返回`-1`时，如果`errno`为 `EAGAIN, EINTR, EMFILE, ECONNABORTED` 可继续使用该socket。

但针对`EMFILE`需要特殊处理下，该错误表示file descriptor已耗尽。
当出现这个错误时，如果监听套接字使用`EPOLLLT`将一直提醒fd可读事件，
使用`EPOLLET`，程序再也不会收到新事件。

有几种方案，可以减少或者修复该问题：

1. 设置系统连接数，可以调用函数`setrlimit(2)`或者执行命令`ulimit(1)`。该方案减少问题发生。
1. 关闭listening fd。
	例如：[memcached](https://github.com/memcached/memcached/blob/dbb7a8af90054bf4ef51f5814ef7ceb17d83d974/memcached.c)中执行`listen(next->sfd, 0)`禁用了新连接。该方案需要有新的策略去重新允许新连接。另外该做法和`listen()` 函数的斜体注释部分有冲突。
1. 准备一个空闲的文件描述符，遇到这种情况，
	先关闭这个空闲文件，获得一个文件描述符名额；
	再accept()拿到新socket连接描述符，然后立即close它，这样优雅地断开了客户端连接；
	最后重新打开一个空闲文件，把“坑”占住，以备再次出现这种情况。

## socket 设置接收缓冲区

当设置TCP套接字接收缓冲区大小时，函数调用的顺序很重要。这是因为TCP的窗口规模选项是在建立连接时用SYN分节与对端互换得到的。

* 对于客户端，这意味着SO_RECVBUF选项必须在调用`connect()`之前设置；
* 对于服务器，这意味着该选项必须在调用`listen()`之前给监听套接字设置。

给已连接套接字设置该选项对于可能存在的窗口规模选项没有任何影响，
因为`accept()`直到TCP的三路握手完成才会创建并返回已连接套接字。
这就是必须给监听套接字设置本选项的原因。（套接字缓冲区的大小总是由新创建的已连接套接字从监听套接字继承而来）

## socket 超时检查

TCP 提供了`keep-alive`选项, 但该选项s默认是两小时无任一方向的数据交换，才发送超时检查，并没有接口将该时间调短。

当进程关闭socket或者进程退出时，操作系统会往对方发送`FIN`分节，但是

* 如果操作系统崩溃或硬件故障导致机器重启，没有机会发送`FIN`分节；
* 并发连接数很高时，操作系统或进程如果重启，可能没有即会断开全部连接。换句话说，`FIN`分节可能出现丢包，但这时没机会重试；
* 网络故障

等情况时，需要用户层自己做socket超时检查。

## socket 杂项

1. `SIGPIPE`：如果管道的读进程已终止时写管道，则产生此信号。当类型为`SOCK_STREAM`的套接字已不在连接时，进程写该套接字也产生此信号。`SIGPIPE`的默认行为时终止进程，对于游戏服务器需要在进程开始时，忽略该信号。
1. `TCP_NODELAY`选项，开启本选型将禁止TCP的Nagle算法，Nagle算法的目的在于减少广域网上小分组的数目，禁用该算法可避免连续发包出现延迟，这对编写低延迟网络服务很重要。
1. select返回各个socket就绪条件小结（图6-7）（待补充）
1. shutdown 和 so_linger各种情况总结（图7-12）（待补充）

## epoll相关

`epoll`相对于`poll`，减少了对文件的polling操作。

* `poll`是对传入的所有文件进行polling，
* `epoll`是对`rdllist`中的文件进行polling。`rdllist`由内核在I/O event时回调。如果调用`epoll_wait()`时参数timeout不为0，会调用`wait queue`，检查是否有I/O event。

对当前`rdllist`进行polling时，如果当前fd有事件且是`EPOLLLT`模式，则会把该fd插入下一次的`rdllist`，
因为这个差异，在`EPOLLLT`模式下，对`EPOLLOUT`事件，在`send`完成后，要及时的修改fd关联的事件。

