---
layout: post
title: Hero开发笔记-客户端资源更新
categories: [general]
tags: []
---
## 基于AssetBundle的客户端资源 ##

传统使用AssetBundle的方法通常是将工程内的每个可更新的“最小单位”打包，由游戏处理相关的依赖。
当然，如何定义“最小单位”，这个是根据项目需求而定，
比如说一个模型可以是一个“最小单位”，所有模型也可以是一个“最小单位”。

### 第一版 ###
最初的想法是将 场景打包，NPC打包，UI打包，配置文件脚本打包，然后替换相关的包即可实现更新，
这样的坏处是
1、更新包大（所以最好只能UI更新，配置文件更新）
2、处理依赖很复杂

### 第二版 ###
针对这个问题，我开发了一个针对AssetBundle包差异比较合并工具，可以将老包通过比较小的更新量变为新包，
打包策略为 场景打包，Resource打包，然后将其压缩后，放StreamingAsset
这样的坏处是
1、zip解压速度慢（80M压缩包，解压后180M，小米2需要90秒，iPhone5需要50秒）
2、占用磁盘空间（因为差异工具目前只支持非压缩的assetbundle，压缩会造成耗时更新更久。。）

其实占用磁盘空间我认为是可以接受的，但解压速度慢不可忍受。


### 第三版 ###
第二版是一个大而全的版本，可以解决全部资源的更新，但其实没必要做的如此灵活，可以跟据第一版分别打包，只对要更新的资源diff。

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
