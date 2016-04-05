---
layout: post
title: Skynet笔记
categories: [general]
tags: []
---

公司立了个新项目，让我设计下服务器端，趁机尝试一下skynet。

## 为何要尝试skynet ##
我们目前使用的是单线程，多进程的服务器拓扑结构，其中存在一些问题：

1. GameServer的单线程模型性能瓶颈不好优化，例如领土战类的大量玩家聚集单张地图的PVP活动，把一些功能拆分出去，成本较高。
1. 服务器只有一个控制主循环的功能，给程序员太大空间，为了防止随意性的代码，又制定了很多固定的写法，新人的学习成本较高。
1. 跨进程模块逻辑状态复杂，容易出问题，如：登陆，跨服逻辑状态复杂，维护成本高。
 
skynet存在以下优点：

1. 利用多核优势，和异步交互方式，是解决我们现有性能瓶颈问题的一个思路。
1. skynet有至少两款产品在使用，而且有一款千万流水的产品，其稳定性和性能是有保证的。
1. 采用代码糖将一些异步操作封装为同步操作，可以降低新人的学习成本。

使用skynet存在以下问题：

1. 遇到诡异问题时的解决成本比原有设计要高。
1. 项目间互相帮忙的问题，好在入门成本不高。

选择skynet的理由：

1. 新项目全部由新人组成。没有我们原有项目的开发经验，都是学习，学一个比较容易入门的比较好。（但是精通的成本要高。）
1. 我只是新项目的顾问，我的首要职责是现有项目的主程序，对于新项目，我不参与功能开发，只评审设计方案和培养新人。从这点而言，采用原有方案让新人写一个考虑周全的登陆、跨服逻辑又不太靠谱。

总而言之，使用skynet是突破我们固有思路的一个尝试，好处多于坏处。

# 运维相关 #
## 示例工程没有在后台运营，是要自己扩充守护进程功能么？还是写个程序使用popen ##
使用nohup

## 如何正确的关闭，以便通知各个模块进行存盘？ ##
参考[如何安全的退出 skynet](http://blog.codingnow.com/2013/08/exit_skynet.html) 

## 示例工程使用了stdin操控服务器，运维中呢？ ##
参考debug console 把 stdin 改成 listen 一个 port

# skynet 常用函数 #
## address是什么？ ##
address 可以理解为handle的变量名，有几种格式：

- `:name`, name是handle的16进制，一般用于会重复存在的service，如:agent
- `.name`, name是本进程唯一的，集群内可以有多个。
- `name`， name是集群内唯一的，（后注册的会覆盖前面注册的）。

## `skynet.launch` ##
开启服务，如果要开启lua服务，可以写为`skynet.launch(snlua, lua模块`

## `skynet.newservice` ##
开启lua服务，并在服务退出或出错时，通知创建者。
即等同于：`skynet.launch(snlua, lua模块` + 退出回调功能。

## `skynet.uniqueservice` ##
创建唯一的skynet.newservice， 如果第一个参数为ture，即为创建集群内唯一的服务，
否则是本进程唯一的lua服务

## `skynet.call` ##
## `skynet.blockcall` ##
## `skynet.ret` ##
和`skynet.call`配合使用。
需要注意的是：

1. 只能调用一次，调用两次会出现很难懂的错误日志；
1. 和`skynet.call`不同的是，`skynet.ret`不支持自动打包；

云风说这两个都是为了兼容老项目而无法改进其封装的形式。

## `skynet.exit` 和 `skynet.kill` ##
直接调用exit或者kill都是关闭掉snlua服务，`snax.kill`的做法是向指定服务发送命令，然后该服务调用服务内的函数后执行`skynet.exit`，可用类似的方式设计服务器关闭流程。
 
## `skynet.fork` ##
## `skynet.timeout` ##

## `mcgroup` ##