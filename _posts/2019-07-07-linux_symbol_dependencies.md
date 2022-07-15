---
layout: post
title: linux 动态库依赖问题定位和解决
categories: [general]
tags: []
---

近两天解决了动态库依赖的问题, 都是之前用过的工具, 记录下来, 备忘.

## 找不到符号问题

通过`nm`命令去查看是否加入了全局符号表

nm xxx
nm -D xxx.so

大`T`标识说明加入了全局符号表

### 对于默认隐藏符号的工程

`#define XXX_API __attribute__((visibility("default")))`

## 找不到so问题

使用`ldd`查看
