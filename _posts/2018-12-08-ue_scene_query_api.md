---
layout: post
title: Unreal场景查询API
categories: [general]
tags: [unreal]
---

UE提供了[多种场景查询的API](https://docs.unrealengine.com/5.0/en-US/API/Runtime/Engine/Engine/UWorld/), 可以从两个维度来归类:

## 物理引擎的维度

| Type      | Kind    |
| --------- | ------- |
| LineTrace | Async   |
|           | Single  |
|           | Test    |
|           | Multi   |
| Sweep     | Async   |
|           | Single  |
|           | Test    |
|           | Multi   |
| Overlap   | Async   |
|           | AnyTest |
|           | Multi   |

对应着物理引擎提供的几种查询方式, [PhysX的文档](https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/GeometryQueries.html#geometryqueries)介绍的比较详细, 就不摘抄了.

## GamePlay的维度

| Kind         |
| ------------ |
| ByChannel    |
| ByObjectType |

在GamePlay上, 通常有两种用法:
1. 针对多种类型Actor进行查询, 比如子弹射击, 可能射在各类Actor上(如:房子, 树, 载具, 人等), 这个时候通常使用`ByChannel`的方式, 按照标签进行分类.
1. 针对特定类型的Actor进行查询, 如:拾取道具, 这个时候通常用`ByObjectType`.