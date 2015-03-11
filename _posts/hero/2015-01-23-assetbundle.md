---
layout: post
title: Hero开发笔记-客户端资源更新
categories: [general]
tags: []
---
## 基于AssetBundle的客户端资源 ##

传统使用AssetBundle的方法通常是将工程内的每个可更新的“最小单位”打包，由游戏处理相关的依赖。
如何定义“最小单位”，要根据项目的实际情况决定，
有的项目每个文件是一个AssetBundle，一个模型要依赖多个AssetBundle，有的项目一个模型就是一个AssetBundle，有的项目所有模型是一个AssetBundle。

### 第一版 ###
将 场景打包，NPC打包，UI打包，配置文件脚本打包，然后替换相关的包即可实现更新
这样的坏处是:

1. 更新包大
1. 处理依赖复杂
1. 压缩的AssetBundle不能太大，解压速度慢。

### 第二版 ###
针对更新包大的问题，开发了一个对AssetBundle包差异比较合并工具（仅支持非压缩的AssetBundle），可以将老包通过比较小的更新量变为新包，
打包策略为 场景打包，Resource打包，然后将其压缩后，放StreamingAsset
这样的坏处是：

1. 因为手游的StreamingAsset是只读的，所以需要压缩存储，然后解压到支持读写的persistentDataPath，存在解压速度慢的问题（80Mzip压缩包，解压后180M，小米2需要90秒，iPhone5需要50秒，换成lzma算法也不快）
1. 占用磁盘空间

占用磁盘空间我认为可接受，但解压速度慢不可接受。

### 第三版 ###
第二版是一个完整更新策略，支持全部资源的更新，可以减少需求只支持Resource资源的更新，
打包策略：默认不打assetbundle包，只是将修改过的文件和其依赖打成assetbundle，利用assetbundle差异比较合并工具进行差异更新。
这样的坏处是：

资源冗余，如果是UI资源变更，可能会引发大量资源打包。
进而可以再优化一下，比如将Resource按依赖打成小包，但我不想接受assetbundle解压带来的性能损失和处理依赖的复杂，当然如果这一版更新包实在大，只好按照这个思路做第四版了。

### 第四版 ###
第三版提出了第四版的思路，但真正的第四版并不是并非如此。
按照第三版的打包思路，Resource已被打入客户端，更新包会只打包Resource变更的资源，但因为依赖问题，导致了体积大，大部分依赖的资源如：UI图素，字体，音效都不会变，这些资源是可以在客户端的资源包中找到的，也就是说，如果没有依赖其他资源的资源且没有变更，我们可以从客户端的资源中把它拷贝出来，为何依赖其他资源的不可以呢？因为是两种打包过程，会导致资源的FileID和PathID不同，比如说GameObject资源依赖Component资源，依赖的FileID和PathID都变了，做这种更新不值得。有一个例外：Font资源，它依赖了Material，但因为其文件大，需要做特殊处理。

    Id           | Type        | Remark
    ---  		 | --- 		   | --- 	
    128          | Font        | 依赖Material，考虑局部替换
	83           | AudioClip   | 理论支持
	49           | TextAsset   | 支持
	48           | Shader      | 理论支持
	43           | Mesh        | 理论支持
	28           | Texture2D   | 理论支持

明天的工作就从为何部分AudioClip会产生差异做起。

## OneBuild插件开发 ##
经过一周的摸索及开发，unity assetbundle的差异合并工具 `AssetBundleParser` 已经开发完成了，计划基于 `AssetBundleParser` 开发 unity资源更新插件： `OneBuild` 。

### AssetBundleParser ###

[点击浏览代码](https://bitbucket.org/beings/assetbundleparser)。

`AssetBundleParser` 是 Unity assetbundle文件的差异比较及合并工具。

`AssetBundleParser` 的代码并不健壮，如果拿错误格式的文件传入会造成程序崩溃，原因有二：

1. assetbundle的格式是非公开的，保持代码简单，可以方便和 `disunity` 对照代码查找问题，正确格式解析有问题可以快速暴露。
1. 文件的正确性可以通过验证md5等方式来保证， 没必要太增加代码复杂度. 合并差异前，会检查文件diff文件，旧assetbundle文件的md5是否一致，合并后也会检查新assetbundle文件的md5是否一致

目前只支持非压缩的 `assetbundle` 的包，因为Lzma压缩速度很慢，差异合并后再压缩整个过程就太久了，所以做包时需要增加：`BuildOptions.UncompressedAssetBundle` 或 `BuildAssetBundleOptions.UncompressedAssetBundle`。

目前只支持移动端，因为TypeTree相关的数据在移动端上没有，故而也并没有解析。对于非移动端可以考虑加上 `BuildAssetBundleOptions.DisableWriteTypeTree` ，这对我当前的项目支持是足够的， 在下一个版本可能会加上这个支持。
