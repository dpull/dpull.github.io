---
layout: post
title: 读书笔记《.NET设计规范：约定、惯用法与模式》
categories: [general, note]
tags: []
---

2009年3月11日，我购买了《.NET设计规范：约定、惯用法与模式》，通读后，颇有收获。从2015年6月，我们游戏内测了，程序压力没这么大了，开始搞组内培训，我建议用了这本书。

按照以往培训的方式，组织大家共同学习此书，我也发现了一些以前没有注意到的部分。


## 命名规范 ##

1. 命名空间要使用PascalCasting大小写风格
1. 要给用于事件处理掉委托添加"EventHandler"后缀
1. 要给用于事件处理之外的那些委托添加"Callback"后缀
1. 不要给委托添加Delegate后缀。

## 异常 ##

1. 不要抛出System.Exception或System.SystemException异常

**未完待续。。。。。。。**