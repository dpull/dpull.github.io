---
layout: post
title: 通过`PhysX API`理解`Chaos API` 
categories: [general]
tags: []
---

`PhysX` 是`NVIDIA`开源的物理引擎, 一直被各个游戏引擎使用. 
`Chaos`是`UnrealEngine`在4.26版本起公开的物理引擎, 在UE5中已经成了默认物理引擎.

`PhysX`提供完整的[开发文档](https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/Index.html), 
`Chaos`开发文档缺乏, 通过看`UnrealEngine`的代码, 对标以前对`PhysX`的理解, 来学习`Chaos API`的使用.

<!-- 
[示例代码]() 
-->

## 基础概念

 ****           | **Physx**             | **Chaos**                                                      | **备注**                        
:---------------:|:---------------------:|:--------------------------------------------------------------:|:-----------------------------:
 可视化调试器   | PVD                   | CVD                                                            | CVD(ChaosVisualDebugger)不知如何用 
 物理场景       | PxScene               | FPhysicsSolver                                                 |                               
 刚体对象       | PxRigidActor          | FSingleParticlePhysicsProxy                                    |                               
 物理模拟函数   | PxScene::simulate     | FPhysicsSolverBase::AdvanceAndDispatch_External                |                               
 物理结果函数   | PxScene::fetchResults | FPhysicsSolverBase::PullPhysicsStateForEachDirtyProxy_External |                               


