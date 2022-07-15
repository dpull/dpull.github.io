---
layout: post
title: 通过PhysX API理解Chaos API
categories: [general]
tags: []
---

`PhysX` 是`NVIDIA`开源的物理引擎, 一直被各个游戏引擎使用. 
`Chaos`是`UnrealEngine`在4.26版本起公开的物理引擎, 在UE5中已经成了默认物理引擎.

`PhysX`提供完整的[开发文档](https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/Index.html), 
`Chaos`开发文档缺乏, `UE`提供了统一的封装接口`PhysicsCore`, 可以对照接口来理解.

<!-- 
[示例代码]() 
-->

## 基础概念对照


 ****           | **Physx**             | **Chaos**                                                      | **备注**                        
:---------------:|:---------------------:|:--------------------------------------------------------------:|:-----------------------------:
 可视化调试器   | PVD                   | CVD                                                            | CVD 尚不可用
 物理场景       | PxScene               | FPhysicsSolver                                                 |                               
 刚体对象       | PxRigidActor          | FSingleParticlePhysicsProxy                                    |                               
 刚体形状       | PxShape               | Chaos::FPerShapeData                                           |                               
 物理模拟函数   | PxScene::simulate     | FPhysicsSolverBase::AdvanceAndDispatch_External                |                               
 物理结果函数   | PxScene::fetchResults | FPhysicsSolverBase::PullPhysicsStateForEachDirtyProxy_External |                               


## 最小流程

1. 新建物理场景
1. 创建刚体对象
1. 创建刚体形状到刚体对象
1. 将刚体对象添加到物理场景
1. 循环(物理模拟/物理结果)
