---
layout: post
title: Hero开发笔记-asset bundle思路
categories: [general, hero]
tags: []
---
使用asset bundle更新资源，有三种思路，因为还在做demo，仅作记录，待有新人入职后，做这件事。

## 按功能更新 ##
在天天爱萌仙更新问题上，渠道建议更新包不要大于4M，根据这个限制，我们只需要UI、脚本、配置表支持资源更新即可，按照这个思路，我们可以把UI、配置表、场景、角色分别打包，更新的时候替换所有的UI和配置表即可。

## 每个文件打包 ##
使用`AssetDatabase.GetDependencies`可以获取到资源依赖，可以讲每个资源打一个包，写个模块专门解决资源依赖问题，更新的时候只是替换相应的包即可。

优化：可以只把UI和配置表做这个处理。

## 差异更新asset bundle ##
Github上有asset bundle的[解包工具](https://github.com/ata4/disunity)，可以参考这个工具格式，将其改为支持包的差异更新。