---
layout: post
title: Unity NGUI
categories: [general, hero]
tags: []
---

## 渲染 ##
UIWidget会将自身添加到离自己最近含有UIPanel的父节点，
UIPanel会根据UIWidget.depth进行排序后创建UIDrawCall，临近depth相同材质、shader的UIWidget会使用同一个UIDrawCall。

不同UIPanel之间根据UIPanel.depth进行排序显示。

## 消息响应 ##
鼠标点击或触摸按照raycastDepth排序，其计算公式为UIPanel的depth*1000+UIWidget的depth，若当前物体没有UIWidget，则寻找其子物体的最小depth

## 分辨率适配 ##
### 3d ui ###
我们主要使用3d ui，发现3d ui和2d ui对uiroot几种适配方式的响应不同，去论坛问了一下，回复：
> UIRoot constrained / flexible size is meant for 2D UIs, not 3D. 3D UIs have perspective, which adds a 3rd dimension to it. Moving the camera forward or back will change how big your UI is. That's how you should be doing zoom with 3D UIs (or just by changing its field of view). Don't do anything with UIRoot. In fact 3D UIs don't even need a UIRoot.

### 2d ui ###
*我们现在换回2d ui了， 主要是为了分辨率适配好做点，先说结论，暂时采用了960*640，两个fit都勾选。

写了一个[编辑器扩展](https://github.com/dpull/unity3d-tools/blob/master/UIAdapterEditor.cs)，来研究这个数值的选择。*

又全部换回了3d ui

### NGUI糊的问题 ###
texture type设置为advanced，去掉generate mip maps的勾。
其他的显示不清晰的模型图，也可以去掉这个勾选变得清晰。


## 显示3d模型 ##
因为ngui的渲染是单独的，所以如果想把3d模型放入ui是不能直接放进去的，可以使用RenderTexture加摄像机来搞定这个事情

## 小米遥控器 ##
小米遥控器的中键是KeyCode(10)，缺少这个枚举。

## 粒子系统 ##
unity自带的粒子系统和NGUI的渲染优先级默认相同，需要用UIPanel调整render q来解决遮挡问题，十分复杂，参考cocos2d的代码，实现了一套简单的粒子系统[粒子系统](https://github.com/dpull/NGUIParticleSystem)，够用就好。



##辅助##
Ray Camera.ScreenPointToRay(Vector3 position);
Description
Returns a ray going from camera through a screen point.

Resulting ray is in world space, starting on the near plane of the camera and going through position's (x,y) pixel coordinates on the screen (position.z is ignored).

Screenspace is defined in pixels. The bottom-left of the screen is (0,0); the right-top is (pixelWidth,pixelHeight).

### EventType.World_3D ###
Physics.Raycast

### EventType.UI_3D ###
Physics.RaycastAll
寻找UIWidget或者继承自UIRect的GameObject，按照raycastDepth排序

### EventType.World_2D 和 EventType.UI_2D ###
尚未搞懂为何算和vector3.back的平面的交点，实际中没用到，示例代码中也没有这种，有空再研究。




