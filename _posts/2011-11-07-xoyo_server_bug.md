---
layout: post
title: 《逍遥江湖》ZoneCenter宕机问题
categories: [general]
tags: []
---

这一段再折腾跨服流程的一些潜规则的需求，顺便解决了一个跨进程跨服的bug，现象有四个:

1. 跨服后客户端玩家血量不正确
1. 跨服后客户端镜头不正确
1. 玩家下线后，服务端会宕掉，表现是重复释放。随后Center宕掉，表现是玩家数据出错
1. 该玩家数据出错，所在地图ID变成了-1(无效ID)

首先我怀疑是跨服流程出错了,因为早些时候有个问题是一跨服Server就宕机,后来发现是跨服的数据有问题,所以我也认为现在这个表现应当是数据有问题。

因为现在是仿照剑三的跨服流程重写的,但是地图管理相关的代码是剑世的老代码,对比老的跨服流程,发现新流程客户端跨服清理的函数没有执行。

解决过程和问题描述：

1. 昨天首先怀疑客户端主角不正确,是不是Player对应的NPC模型不正确,通过log发现这些都是正确的,偶然间看log发现两个问题,Server出现了Delete map copy的提示,当时玩家还没下线,但是地图却被Server删除了,这也许就是Server宕掉的原因,通过log,查出是Center处理跨服的时候得bug,修正后发现玩家下线后Server、Center不宕机,玩家数据也不会出错了。
（简而言之：ZoneCenter地图中跨服玩家计数有问题, 导致了跨服地图发现没有玩家就通知Server删除地图,造成了玩家下线的时候重复释放,导致Server宕机，因为ZoneCenter上地图已经释放，所以玩家数据中的地图ID不正确，导致Center宕机）

1. 客户端执行GetMaxHP()失败，剑三的跨服流程我还算熟悉，剑世的客户端一点都不熟悉，好多函数还直接写在头文件中，加断点很卡，只好先把相关的函数移到cpp中，又发现修改这个成员变量的地方有多处，只好使用数据断点，定位到是客户端血量同步的bug。

1. 客户端主角不对（镜头不对）这个最不熟悉了，搜索镜头关键字，发现了一个注释，找到了镜头设置的代码，加断点调试，看到数据不正确的位置，然后想通为什么数据错了。