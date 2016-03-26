---
layout: post
title: cocos2dx性能优化--CCB加载优化
categories: [general, cocos2dx]
tags: [cocos2dx]
---

我们使用cocos2dx 2.2和CocosBuilder-3.0-alpha3配合开发卡牌游戏。
测试机器itouch4。

以下界面有明显的加载等待：

* 登陆界面 login.ccb 
* 主页界面 home.ccb 
* 阵容界面 myteam.ccb 
* 活动界面 activity.ccb

==========

## 吐槽 ##

1. cocos2dx的代码不像有经验的程序之作，存在无数的新手错误。
   1. 滥用std::string
   1. 传参的时候不使用指针或引用
   1. TODO标识到处都是，但没写上TODO什么
   1. 调试用的LOG没有删除
   1. 代码规范不统一
   1. 可以返回`const string&`的地方返回`string`
   1. 可以使用`string(char*,size_t)`构造的地方会先`malloc`内存，然后使用`string(char*)`
1. 滥用继承和重载，导致性能统记时候发现函数调用层层嵌套，不容易找到真正的热点。
1. cocos2dx的CCBReader没有考虑多线程加载，动画管理竟然使用弱引用。
1. 函数不正交
   1. CCLabelBMFont::createFontChars中包含了部分CCLabelBMFont::updateLabel部分功能

## 性能统计方法 ##

-  使用Time Profiling寻找加载热点

## 优化图片的多线程加载 ##
login.ccb只有几张图片，其卡的原因主要是图片是单线程加载的，将其改为多线程加载后，
发现两个问题 

1. 图片被加载线程多次加载 
1. 图片加载成功后回调速度太慢

原因是，CCTextureCache的多线程加载实现的太搓了，改写了就好了。

## TTF字体创建速度慢 ##
login.ccb有一个CCControlButton，其在设置按钮文字的时候占用时间较长，暂时不优化。

## BMFont字体创建速度慢 ##
home.ccb 玩家信息相关的数字使用了图片字，其加载速度不乐观， setFntFile和 setTexture都要优化。

1. 将setFntFile改为多线程加载 
1. 改写CCBMFontConfiguration::parseConfigFile，性能提升不多，主要是满足自己的代码洁癖。
1. 将大量使用的sscanf(,"%d",)修改为strtol。一百万次执行两个函数相差一秒钟（xcode5,debug&release）

## 文件打包功能实现不完善 ##
我们自己开发的文件打包功能实现有些地方实现的不完善，导致成为热点。 

1. 文件打包系统在ios下没有实现getFullPathForDirectoryAndFilename 
1. 因为异步加载，CCSprite创建了默认纹理，也就是创建了一个不存在的文件，CCFileUtils::fullPathForFilename当文件不存在时，是不会将路径加入缓存，导致该函数一直被调用。
