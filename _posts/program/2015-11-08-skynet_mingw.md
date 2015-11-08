---
layout: post
title: Skynet Windows版本
categories: [general, hero]
tags: []
---

我们项目策划的工作机是windows，他们有修改配置表后自测的需求，我们以前的做法是通过一个批处理启动linux版本，其内部做了这几件事情：

1. ssh到linux虚拟机（我们会给每个策划分配一台自己的linux虚拟机）
1. 共享产品库目录给虚拟机
1. 虚拟机启动skynet的linux版本

但是这个方案有几个不爽的地方：

1. 要修改客户端连接的服务端IP
1. 不好看输出的错误日志
1. 每次新员工入职 甚至 策划重装了系统，都要找程序重新配置

为了解决这些不爽，我决定弄个 windows版的skynet，它主要目的是服务于策划，或者不想用macosx的程序。
（测试是必须用linux的，因为测试环境要同于真实环境）

现在github有好几个skynet的windows版，我本不想自造轮子，但是有两个原因让我痛下决心：

1. 维护不及时或停止维护
1. 改动量太大，造成合并时可能出问题（而且这是某个库真实存在的）

如何才能对skynet改动不大，我认为这需要使用mingw，而且需要用一些黑科技改变编译时的代码。

1. GCC的-include命令，可以强制所有文件都include某个头文件，其主要解决了缺少函数或者函数行为不一致。
1. DllMain函数进行默认调用，解决windows网络需要执行WSAStartup进行初始化。

我花了一个周末的时间，来实现了整个想法，有一个纠结的方案是：用select模拟了epoll，
本来想用iocp重写socket_server，但总感觉这样不符合尽量不改变skynet的初衷，
而且仅仅是给内部人使用，本来就不存在性能问题，所以最终决定不实现iocp版本了。

工程地址：[https://github.com/dpull/skynet-mingw](https://github.com/dpull/skynet-mingw) 
