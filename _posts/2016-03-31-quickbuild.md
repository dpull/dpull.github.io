---
layout: post
title: 使用QuickBuild取代计划任务
categories: [general]
tags: []
---

[QuickBuild](http://www.pmease.com/) 是一款持续集成工具，提供了对版本控制工具，编译工具，命令行很好的支持，本来我用计划任务做一些日常性工作，突发奇想如果用`QuickBuild`做会更简单，尝试一下，果真如此。

## 配置QuickBuild

`QuickBuild`的免费版本，支持创建16个配置，对于我的日常工作来说，完全满足，
因为是拿来取代计划任务，所以直接用它的Server就可以，不需要安装客户端。
注意从官网下载后，不要执行安装，而是直接运行`./server.sh console`，因为安装要求用户是root，会造成一些权限问题。

其他的配置参考 [QuickBuild安装说明](http://pureivan.blog.51cto.com/2035414/1607215)。

## 我的常用任务

### 定期更新skynet_mingw库
(skynet_mingw)[https://github.com/dpull/skynet-mingw] 是我维护的一个开源项目，它有一个日常需求就是更新`submoudle`到最新。

### 更新工作的产品库
我们的客户端采用`Unity`开发，虽然使用了`CacheServer`，但是`Unity`导入资源依旧是一件费时的事情，尤其是我机器上有三个资源类型的客户端（桌面版，iOS版本，Android版本）。

{% highlight shell %}
svn up
/Applications/Unity/Unity.app/Contents/MacOS/Unity -quit -batchmode -executeMethod X.AutoBuilder.SwitchActiveBuildTarget -logFile batchmode.txt
cat batchmode.txt
{% endhighlight %}

### 更新工作机
mac很烦的是经常生成`.XXXX`文件，但是又没法子配置不产生，系统提供了`dot_clean`来清理，于是一段时间自动调用一次。

### 未完待续
。。。



