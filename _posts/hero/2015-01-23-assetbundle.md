---
layout: post
title: Hero开发笔记-客户端资源更新
categories: [general]
tags: []
---
## 基于AssetBundle的客户端资源 ##

传统使用 `AssetBundle` 的方法通常是将工程内的每个可更新的“最小单位”打包，由游戏处理相关的依赖。
如何定义“最小单位”，要根据项目的实际情况决定，
有的项目每个文件是一个 `AssetBundle` ，一个模型要依赖多个 `AssetBundle` ，有的项目一个模型就是一个 `AssetBundle` ，有的项目所有模型是一个 `AssetBundle` 。

### 第一版 ###
将 场景打包，NPC打包，UI打包，配置文件脚本打包，然后替换相关的包即可实现更新
这样的坏处是:

1. 更新包大
1. 处理依赖复杂
1. 压缩的 `AssetBundle` 不能太大，解压速度慢。

### 第二版 ###
针对更新包大的问题，开发了一个对 `AssetBundle` 包差异比较合并工具[`AssetBundleParser`]，可以将老包通过比较小的更新量变为新包，
打包策略为 场景打包，Resource打包，然后将其压缩后，放StreamingAsset
这样的坏处是：

1. 因为手游的StreamingAsset是只读的，所以需要压缩存储，然后解压到支持读写的persistentDataPath，存在解压速度慢的问题（80Mzip压缩包，解压后180M，小米2需要90秒，iPhone5需要50秒，换成lzma算法也不快）
1. 占用磁盘空间

占用磁盘空间我认为可接受，但解压速度慢不可接受。

### 第三版 ###
第二版是一个完整更新策略，支持全部资源的更新，可以减少需求只支持Resource资源的更新，
打包策略：默认不打 `AssetBundle` 包，只是将修改过的文件和其依赖打成 `AssetBundle` ，利用 [`AssetBundleParser`] 进行差异更新。
这样的坏处是：

资源冗余，如果是UI资源变更，可能会引发大量资源打包。
进而可以再优化一下，比如将Resource按依赖打成小包，但我不想接受 `AssetBundle` 解压带来的性能损失和处理依赖的复杂，当然如果这一版更新包实在大，只好按照这个思路做第四版了。

### 第四版 ###
第三版提出了第四版的思路，但真正的第四版并不是并非如此。
按照第三版的打包思路，Resource已被打入客户端，更新包会只打包Resource变更的资源，但因为依赖问题，导致了体积大。
大部分依赖的资源通常是不变的，如：UI图素，字体，音效，这些资源是可以在客户端的资源包中找到的。
也就是说，如果`没有依赖其他资源的资源`没有变更，我们可以从客户端的资源中把它拷贝出来。
为何`依赖其他资源的资源`不支持呢？因为是两种打包过程，会导致资源的FileID和PathID不同，比如说GameObject资源依赖Component资源，依赖的FileID和PathID都变了，需要对其做特殊处理，未必值得，例如Font资源，它依赖了Material，但因为数据文件大，需要做特殊处理。

    Id           | Type        | Remark
    ---  		 | --- 		   | --- 	
    128          | Font        | Font1,  sniglet
	83           | AudioClip   | 支持
	49           | TextAsset   | 支持
	48           | Shader      | DissolveToon-Basic 
	43           | Mesh        | Sb007body 
	28           | Texture2D   | 支持

这项工作就告一段落了，因为手头上有优先级更高的事情，过一段再折腾吧。
目前存在差异的四个可优化文件：
字体2个文件，需单独处理资源件引用，
Shader只剩一个文件，待细查，
Mesh只剩一个文件，待细查。



[`AssetBundleParser`]: https://bitbucket.org/beings/assetbundleparser