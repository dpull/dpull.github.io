---
layout: post
title: Unity游戏优化
categories: [general]
tags: []
---

优化的重点分为两部分，安装包大小优化以及性能优化。

## 安装包大小优化 ##

### 工具 ###
根据 [Reducing the File Size of the Build](http://docs.unity3d.com/Manual/ReducingFilesize.html) 写了一个插件，每次自动构建时将这部分数据给单独保存下来，类似的商业插件是 [Texture Overview Pro](https://kharma.unity3d.com/en/#!/content/10832)

### 修改方案 ###

压缩Texture，针对不同的Texture采用不同的压缩方式，压缩到一个美术最低可以接受的质量。

## 性能优化 ##

> 性能优化是游戏开发过程中一个永恒不变的话题，它是研发过程中的最后20%，但往往却要占据了80%的研发过程

### 优化方案 ###

1. CPU/GPU 优化
	1. GameObject缓存池
	1. 降低场景的面数
1. I/O 优化
	1. 资源异步加载
	1. Animator实例化优化
		* 问题：当Animator实例化时（GameObject.Instantiate），会加载相关的动画文件，此时是阻塞加载，会造成游戏卡顿
		* 核心点：要将AnimatorController及依赖预加载了，比如说`Resources.Load<RuntimeAnimatorController>(FileName)`后，再实例化Animator，就不会有卡顿了，但问题是，如果针对AnimatorController加载，改动量较大。
		* 解决思路：拿内存换效率，在场景加载进度条时，分析出当前场景可能动态载入的animator，实例化一次，然后销毁，使资源管理模块缓存相关的动画。
1. 内存优化
	1. NGUI UIGrid和UITable优化，只实例化可见部分
	1. 场景切换清理GC
	1. Texture，美术看效果，能接受的最高压缩
	1. 禁用高面数mesh的静态批处理（暂定为100面以上的就算高面数）
	1. 减少光照图（美术制作流程规划，尽量一个场景只用一张光照图）
1. Drawcall优化
	1. 减少不必要的NGUI UIPanel
	1. [NGUI UIPanel内调整depth顺序](../unity_ngui_drawcall_optimize)



### 建议指标 ###

来源于 Unite China：2015《The Matrix：全新的Unity移动游戏优化解决方案》

**CPU**

每帧耗时超过33ms的占比10%以下。

**内存**

内存主要因素：资源内存，代码堆内存，WebStream

* 总体内存控制在150MB以下。
* 堆内存控制在44MB以下（因为托管堆内存不会回收给系统）。建议：对代码GC Alloc进行严格的控制，避免不必要的堆内存分配
* 防止内存泄露：场景切换，内存回落正常
* Texture占用内存量，建议：峰值<50MB，警惕资源泄露：场景切换，内存需保持升降一致
* Mesh内存占用量，建议：峰值<20MB，警惕资源泄露：场景切换，内存需保持升降一致
* Animation Clip 内存占用量，建议：内存<15MB，警惕资源泄露：场景切换，内存需保持升降一致
* 平均每帧堆内存分配不能超过20B

**DrawCall 统计**

建议：

* 峰值<250
* 主体范围（5%-95%）应在（0，200）之内

**渲染Triangle数量** 

建议：< 100000/帧

**VBO 上传量**

建议：

* 峰值<5MB
* 频繁加载的资源使用缓存池

**Skinned Mesh数量**

建议：

* 峰值<50
* 对应 MeshSkinning.Update 和 Animator.Update

**Rigidbody数量**

建议：

* 峰值<50/帧
* 对应 Physics.Simulate


**碰撞体数量**

建议：

* 峰值<100/帧
* 对应 Physics.Simulate

**RenderTexture 使用情况** 

性能高，在GPU，建议：数量 < 10

