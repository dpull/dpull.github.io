---
layout: post
title: golang http.client 问题总结
categories: [general]
tags: [golang, socket]
---

某个微服务采用了协程和http.Client来请求其他服务。但是很快就提示文件句柄不足，错误信息为`dial tcp [ip]:[port]: socket: too many open files`。
通过查看http.Client的实现，本文将介绍http.Client的最佳实践。

## 文件句柄不足

有两个办法解决: 
1. 设置`http.Transport.MaxConnsPerHost`。当连接数超过`MaxConnsPerHost`时，其他协程就会挂起，等待句柄数足够。这种方法可以限制每个主机的最大连接数，从而避免文件句柄不足的问题。
1. 不再在每个协程中发起http.Client请求，而是将http.Client请求放入channel中，用几个协程来消费这些请求。这种方法可以避免同时打开太多的文件句柄，从而提高系统的稳定性。

方案1比方案2简单, 逻辑好理解, 但需要的系统资源可能不可控. 所以推荐方案2

## 设置 http.Client.Timeout 超时

`http.Client.Timeout`用于指定此客户端发出的请求的时间限制，包括连接时间、任何重定向和读取响应正文。计时器在Get、Head、Post或Do返回后继续运行，并将中断Response.Body的读取。Timeout为0表示没有超时限制。

默认的http.DefaultClient中Timeout为0，说明没有超时限制，因此需要设置超时。

* 方案1未设置超时，会造成协程数不可控。
* 方案2未设置超时，会导致消费者协程阻塞。

## 设置 http.Transport.MaxIdleConnsPerHost

`http.Transport.MaxIdleConnsPerHost`用于控制最大空闲（保持活动）连接以保持每个主机。如果为非零值，则使用该值；如果为零，则使用DefaultMaxIdleConnsPerHost（默认值为2）。

由于tcp的connect函数耗时较久，减少创建新连接可以提升性能。
* 针对方案1，可以根据数据量放大MaxConnsPerHost的值，以提高并发性能。
* 针对方案2，可以修改消费协程的数目。
