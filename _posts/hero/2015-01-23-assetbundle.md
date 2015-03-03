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
将 场景打包，NPC打包，UI打包，配置文件脚本打包，然后替换相关的包即可实现更新
这样的坏处是:
1. 更新包大
1. 处理依赖复杂

### 第二版 ###
针对更新包大的问题，开发了一个对AssetBundle包差异比较合并工具，可以将老包通过比较小的更新量变为新包，
打包策略为 场景打包，Resource打包，然后将其压缩后，放StreamingAsset
这样的坏处是：
1. 解压速度慢（80Mzip压缩包，解压后180M，小米2需要90秒，iPhone5需要50秒，换成lzma算法也不快）
1. 占用磁盘空间（因为差异工具目前只支持非压缩的assetbundle，压缩会造成耗时更新更久。）

其实占用磁盘空间我认为是可以接受的，但解压速度慢不可接受。

### 第三版 ###
第二版是一个大而全的版本，可以解决全部资源的更新，但其实没必要做的如此灵活，可以删减到只支持Resource资源的更新，
打包策略：默认不打assetbundle包，只是将修改过的文件和其依赖打成assetbundle，利用我的差异比较合并工具，除了第一次更新大点，以后应当还好。
这样的坏处是：
资源冗余，如果不可更新的部分和可更新的部分依赖了同一个资源，可能在更新后，存在两个资源。

其实存在另外一个策略，做包时将资源打包，它的问题是粒度小的话，要处理依赖，大的话，又要考虑做包时如何解决依赖。先按照这个方案走一下吧，走不通在出第四版 :)

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
