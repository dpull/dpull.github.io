---
layout: post
title: Hero开发笔记-客户端资源更新
categories: [general]
tags: []
---

unity使用`AssetBundle`进行资源更新，分成三个步骤：
1. 分包
1. 打包
1. 更新包


##分包
分包的目的：将需要打包的资源分成多个`AssetBundle`包。
注意点：避免资源被重复打包。

需要打包资源有哪些？Level 和 Resources资源，及它们的依赖资源。
为了避免资源重复打包，我们把所有的资源进行分包处理，而不是由unity自动关联其依赖的资源。

1. 遍历所有需要打包的资源，根据正则表达式将其分入不同的分组，没有设定规则的文件则使用其文件名，作为一个单独的分组。

	常用的分包规则有：Resources中的UI预设归为一个分组，所有的Shader放在一个分组，Resources中的配置文件放在一个分组。
	
1. 通过 `AssetDatabase.GetDependencies` 生成分组的有向图，每个分组是有向图的顶点，依赖关系为其入度关系，如A依赖B，则B->A。

	注意，要检查生成的有向图中不能存在环，如果存在则修改第一步中的正则表达式。
	
1. 寻找顶点间的最长路径，删除非最长路径，如 {C->B->A, C->A}，则删除{C->A}，只保留{C->B->A}。

1. 寻找出度为1的顶点，根据其是否接受出度合并 及 其出度顶点是否接受入度合并的规则，进行合并。

	{C->B->A, C->B->D},C允许出度合并，B允许入度合并，则合并为 {CB->A, CB->D}
	
1. 对于存在禁止入度合并配置，使用虚拟合并的方式（只合并有向图，不合并资源）进行优化。

	{C->A, B->A} 如果A禁止入度合并，可将其合并为{CB->A}
	
1. 观察输出的调试信息，并使用XDot生成有向图，继续完善正则表达式。

	(调试命令 `dot -Tpng -O 1.txt`)

##打包
根据分包出的结果，调用`BuildPipeline.BuildAssetBundles`进行打包。
优化点：

1. 打入安装包内的`AssetBundle`(放入streamingAssetsPath文件夹中的)可以考虑使用非压缩格式，因为：

	1. 安装包会进行压缩，所以没必要重复进行压缩。
	1. Resources和Level的数据在安装包中也是以非压缩的AssetBundle存储的。

1. 使用WWW.LoadFromCacheOrDownload加载AssetBundle	
注意，加载streamingAssetsPath中的文件要用WWW，因为Android的该文件夹在jar包内，当然也可以使用[AndroidAssetStream](https://github.com/dpull/UnityUtils/blob/master/AndroidAssetStream.cs)直接读取。

##更新包
### 以`AssetBundle`为单位更新
可以直接将更改过的AssetBundle包，下载到persistentDataPath进行优先加载。

缺点：更新包比较大，解决方案，如下：

### 对`AssetBundle`进行差异更新（只能用于非压缩的AssetBundle）
针对更新包大的问题，开发了一个对 `AssetBundle` 包差异比较合并工具[`AssetBundlePatch`]，可以将老包通过比较小的更新量变为新包，
比如说 {CB->A} 变更为了 {DCB->A}，假设BCD都是纹理,且BC没有变更，这时候可以只把D更新下去，通过差异比较合并工具，得到二进制相同的DCB包。

因为Resources和Level的资源其内部也是用了AssetBundle，
所以不仅仅可以去自己打出的AssetBundle中进行差异合并，
也可以获取应用包内的资源进行差异合并。

目前支持的差异合并的资源类型有：

Id           | Type        | Remark
128          | Font        | 需特殊处理
83           | AudioClip   | 支持
49           | TextAsset   | 支持
48           | Shader      | 理论支持 
43           | Mesh        | 理论支持 
28           | Texture2D   | 支持

插件代码已经放github [`AssetBundlePatch`], 需要特殊处理和理论支持的部分还有待开发。


[`AssetBundlePatch`]: https://github.com/dpull/AssetBundlePatch
[`Serialized file format`]: https://github.com/ata4/disunity/wiki/Serialized-file-format
