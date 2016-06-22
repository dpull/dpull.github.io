---
layout: post
title: Unity NGUI DrawCall优化
categories: [general]
tags: []
---

这一段时间主要做优化工作，主要针对CPU，GPU，内存。

GPU的优化主要是降低DrawCall。

对于降低NGUI DrawCall的方式有两种：

1. 打包图集
1. 调整渲染顺序

打包图集这件事情早就做了，现在存在的问题是分类的不够好的问题，这个等游戏一个版本完成后，再设计个工具专门做这个。目前解决的是调整渲染顺序。

## 问题及解决思路 ##
A，C 共用材质1， B使用材质2，Depth顺序为ABC，这时候需要三个DrawCall，如果AB，BC不全部重叠，可以将Depth顺序调整为ACB（或CAB或BAC等等），可以将DrawCall降低为两个。

## 实现 ##
规则不复杂，但貌似并没有现成的插件解决这个问题。

此外UI动画对其检查影响很大，第一个版本可以考虑做成一个非自动化的模式，只是修改当前UI，需要策划调整后，决定是否保存入库。

趁着制定新版本计划的空隙，写了一个[简单版本](https://github.com/dpull/UIBatchSorting)。





