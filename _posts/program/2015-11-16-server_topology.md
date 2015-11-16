---
layout: post
title: 服务端拓扑结构调整
categories: [general, hero]
tags: []
---

新项目依旧使用skynet做服务端，但在拓扑结构上做一些调整。

这次改动的主要目标有三个：

1. 易于新同学理解。
1. 易于合服，跨服。
1. 易于扩展，解决性能瓶颈。

新的拓扑结构如图

	                              +-----------------------------------------------------------------------------------+
	                              |                                                                                   |
	                              |                              Db center                                            |
	                              |                                                                                   |
	                              |                                                                                   |
	                              |                                                                                   |
	+-----------------------------+                                                         +--->Player id            |
	|       Game server           |                                                         |                         |
	|                             |                                 +--->AutoIncreaseIndex+----->Auction id           |
	|                             |                                 |                       |                         |
	| +--------+                  |                                 |                       +--->Guild id             |
	| | skynet |     +--------+   |                                 |                                                 |
	| | master | <---+ server1|   |  +--------+                     |                                                 |
	| | /slave |     +--------+   |  |        |           +---------+           +---------------+                     |
	| +--------+     |  ...    <-----+   DB   +---------->+  redis1 |           |Set            |                     |
	|                +--------+   |  |        |           +------------->Players|Player:PlayerId|                     |
	|                | ser|erN|   |  +---+----+               ...   |           |PlayerData     |                     |
	|                +--------+   |      |                +---------+           +---------------+                     |
	|                             |      |                |  redisN |               HashSet(ServerId:Account)         |
	|                             |      v                +---------+          +--->Account                           |
	+--------+--------------------+  +---+-----+                    |          |    Players Freeze                    |
		 	 |                       | mongodb |                    +--->Server|                                      |
			 |                       +---+-----+                               |    HasetSet(ServerId:Mail)           |
			 |                           |                                     +--->PlayerId                          |
			 |               Player log<-+                                     |    MailData                          |
			 |                           |                                     |                                      |
			 |       Data query service<-+                                     |    HashSet(ServerId:Relationship)    |
			 |                           |                                     +--->PlayerId                          |
			 |       Player data backup<-+                                     |    RelationshipData                  |
			 |                                                                 |                                      |
			 |                                                                 |    HashSet(ServerId:PlayerCache)     |
			 |                                                                 +--->PlayerId                          |
			 |                                                                 |    PlayerCacheData                   |
			 |                                                                 |                                      |
			 |                                                                 |    HashSet(ServerId:Auction)         |
			 |                                                                 +--->AuctionItemId                     |
			 |                                                                 |    AuctionItemData                   |
			 |                                                                 |                                      |
			 |                                                                 |    HashSet(ServerId:Guild)           |
			 |                                                                 +--->GuildId                           |
			 |                                                                      GuildData                         |
	         |                                                                                                        |
	         +--------------------------------------------------------------------------------------------------------+

## 易于新同学理解
以前我们的服务器拓扑结构是虚拟玩家服，也就是一组服务器中，可能对应玩家的多个服。
新程序同学非常难理解这个问题，与非程序部门的同学交流有时也比较困难，
例如以前我们使用多进程，单线程的拓扑结构时，有的时候切换地图玩家要切换GameServer进程，程序同学把其成为跨服，和非程序同学直观理解的会不一样，
新人进来我们也会就这个问题培训多次，避免出各种问题。

为了避免这个问题，这次调整为一组服务器，对应一个玩家服。

## 易于合服，跨服
以前采用多服结构的原因是易于合服、跨服，单服结构如何解决这个问题呢？

对于合服，采用数据中心的方案，也就是多个服务器连相同的数据库。

对于跨服，采用skynet的cluster模式，将跨服地图开在独立的跨服进程。

## 易于扩展，解决性能瓶颈
新的拓扑结构可能存在两个性能问题

1. 服务器性能问题
1. 数据中心的性能问题

### 服务器性能问题
目前通过朋友公司已上线的手机MMOArpg项目数据来看，skynet单进程的负载为5000人左右（CPU:4核 2G主频以上，内存:32G），这满足我们单服的日常需求，对于临时压力，采用master/slave模式进行缓解。

### 数据中心的性能问题

数据中心采用了redis和mongodb两套数据库，
redis主要用于存储游戏数据，可以根据一定的规则，将不同服的数据存储在不同的redis中。
mongodb主要用于：存储玩家日志、执行搜索查询工作（如拍卖行搜索物品）、长期不在线玩家的落地（从redis中移除数据）。

