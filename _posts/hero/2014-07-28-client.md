---
layout: post
title: Hero开发笔记-客户端规划
categories: [general, hero]
tags: []
---

## UI ##
使用插件NGUI制作UI，每个UIPanel都是一个prefab，提供一个UI跳转的组件给UE，这样基本的UI间的跳转就不需要程序参与了，UI跳转组件提供的几个接口如下：

* `Switch` 关闭掉所有已打开的panel，然后打开一个panel。比如从主页界面，跳转到好友界面。
* `Open` 打开一个panel。比如弹出一个Messagebox。
* `CloseAndOpen` 关闭掉当前panel，然后打开一个panel。比如关闭掉一个Messagebox，弹出另外一个Messagebox。 
*  `Close` 关闭掉当前panel。比如关闭掉一个Messagebox。
*  `LoadLevel` 进入某张场景。

将UIRoot通过脚本自动创建到游戏中用于挂接UIPanel，并设置为:`DontDestroyOnLoad`。UIRoot下有两个摄像机，分别是2D UI摄像机和3D UI摄像机。

### prefab中子prefab的问题 ###
举个例子：
按钮是一个prefab，按钮所在的界面也是一个prefab，此时按钮的prefab就会融入界面的prefab中，再修改按钮的prefab，界面中的按钮不会相应的变化了。

可用插件：[Prefab Evolution](https://www.assetstore.unity3d.com/en/#!/content/17557)解决这个问题。

## 场景 ##
每个场景都是一个Scene, 美术做完场景后，由UE添加一些3D UI到场景，这样场景中的物件就可以点选了。

### 光照贴图的场景预览移动端资源爆掉的问题 ###
4.5.2f1 使用Switch Platform查看资源，发现ios和android的光照贴图的场景在windows编辑器查看会爆掉，
在mac编辑器和手机上并不会有这个问题，使用4.3老工程文件发现也是正常的，对比工程配置，唯一的区别在于是否使用dx11，去掉这个选项后，预览正常。


## 角色动作 ##
角色动作用了animator

## 角色动作位移出摄像机不播放的问题 ##
有一些展示性的动作，如一个模型上天入地的入场，这个并非程序控制的位移，而是模型动画中的位移，当模型飞出摄像机时，后续动作就不播放了，几经尝试，是因为Animator的Culling Mode默认是Based On Renders的缘故，改为Always Animate就好了。