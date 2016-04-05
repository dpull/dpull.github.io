---
layout: post
title: Skynet交流
categories: [general, hero]
tags: []
---

参加了云风组织的Skynet线下交流，记录了一下几点。

- agent启动后进行一次GC
	- lua 的 GC只关注自身占用了多大内存，然后在合适的时候进行GC，agent再启动时通常会产生一些临时数据，主动GC，会节约很多内存。
	
- GC有一些东西是回收不掉的
	- table是不缩小的，如某个table有20万条数据，将其所有的value设置为nil，table并不会缩小，只有将其设置为nil或一个新的table，才会减少其占用内存的大小。


