---
layout: post
title: cocos2dx 功能调整或bug修复
categories: [general, cocos2dx]
tags: [cocos2dx]
---

> 本帖持续更新

## cocos2dx的触摸响应的机制调整 ##

cocos2dx默认的触摸响应机制效率看似高但使用起来太过复杂，在制作过程中带来的麻烦远大于这套机制带来的好处，所以将其重载，调整为按照**树形结构遍历**。

## 增加extensions库的ios proj ##

类似于其他模块，增加extensions的ios proj

## CCB关键帧回调由SEL_CallFuncN改为CCCallFunc ##

为了做lua关键帧回调的支持而做的这个改动。

和[James Chen]聊了一下，他建议改为`SEL_CallFuncND`，但我认为`SEL_CallFuncND`是不安全的，所以不提交改动了。

## Issues ##
1. 修复ccb动画管理器空指针访问（已合并）
1. 子ccb锚点位置（已合并）
1. 修复 子节点初始隐藏然后显示，顺序错乱的bug
1. 修复 AssetsManager消息分发慢的问题
1. 修复 AssetsManager::uncompress() 部分分支没有执行unzClose的问题
1. 修复 AssetsManager 引用计数问题
1. 修复了EditBox在ios平台上部分情况下不显示光标的问题。
1. 修复了CCScrollView::minContainerOffset没有考虑Container小于View的情况。(回滚了,CCTableView使用其做了一个功能.)
1. 修复 CCParticleSystemQuad::setVisible 没有重置粒子发射器的问题

从bug第3条起，cocos2dx团队正准备要发布2.1.4版本并进行3.0版本的升级，
3.0命名规范改动很大，[James Chen]建议我把改动合到3.0分支，
但我这一段忙着出公司内测版本，先放放吧。

## 增加CCB调试日志，减少宕掉 ##
开发过程中，经常出现缺图等问题，修改为记录log，而非直接宕掉。

## 图片异步加载排重以及将CCB中的图片加载改为异步加载 ##
主要是优化性能，详见 [cocos2d性能优化--CCB加载优化](../cocos2dx_ccbreader_optimize/)

其默认的图片多线程加载排重没有除去后台线程正在加载中的文件，导致文件可能被加载多次。

## windows版CPU占用高 ##
2013/12/02

今天博强说我们手游的windows端比端游消耗的cpu都高，用VS的性能分析看了一下其热点在于Sleep函数。

```C
    // file: cocos2dx/platform/win32/CCApplication.cpp
    if (nNow.QuadPart - nLast.QuadPart > m_nAnimationInterval.QuadPart)
    {
        nLast.QuadPart = nNow.QuadPart;
        CCDirector::sharedDirector()->mainLoop();
    }
    else
    {
        Sleep(0); 
    }
```

问题的原因就在于这个Sleep(0)， [MSDN](http://msdn.microsoft.com/en-us/library/windows/desktop/ms686298\(v=vs.85\).aspx) 中:

> A value of zero causes the thread to relinquish the remainder of its
> time slice to any other thread that is ready to run. If there are no
> other threads ready to run, the function returns immediately, and the
> thread continues execution.

修改为Sleep(10)就好了。

**PS:** 以前剑三做过一个测试，dwMilliseconds小于10和10没有区别。

## 修复客户端顿卡时，战斗可能卡住的问题 ##
2014/03/01

我们战斗是通过ccb的关键帧触发的，在顿卡时，Action会执行的比较混乱，

修改方式：
CCActionManager::update会根据间隔时间，执行多次

## 修复ios7下cocos2dx语音输入时闪退 ##
2014/03/18

测试报了一个bug，CCEditBox使用语音输入闪退，原以为是CCEditBox的问题，调试后发现没那么简单，查看cocos2dx提交记录，原来3.0分支已经在25天前（2014.02.19）解决了，遗憾的是2014.03.15发布的v2.2.3并没有修复这个问题。

根据3.x分支的改动，将其移植到了2.x分支，[查看改动](https://github.com/cocos2d/cocos2d-x/pull/5861/files)

## CCLabelTTF 描边/勾边 问题 ##
2014/05/27

1. CCLabelTTF 的勾边 是内勾边，不满足ui外勾边的需求。 
1. 在ios7下，勾边不起作用了。（原因是部分接口在ios7下被改了）

核心修改如下，另外还修改了排版有点偏的问题，小改动，不展示代码了：

```C
// take care of stroke if needed
if ( pInfo->hasStroke )
{
    CGContextSetTextDrawingMode(context, kCGTextStroke);
    CGContextSetRGBStrokeColor(context, pInfo->strokeColorR, pInfo->strokeColorG, pInfo->strokeColorB, 1);
    CGContextSetLineWidth(context, pInfo->strokeSize);
    CGContextSetLineJoin(context, kCGLineJoinRound);
    
    if([[[UIDevice currentDevice] systemVersion] floatValue] >= 7.0)
    {
        CGContextSetRGBFillColor(context, pInfo->strokeColorR, pInfo->strokeColorG, pInfo->strokeColorB, 1);
    }
    
    [str drawInRect:CGRectMake(textOriginX, textOrigingY, textWidth, textHeight) withFont:font lineBreakMode:NSLineBreakByWordWrapping alignment:(NSTextAlignment)align];
    
    if([[[UIDevice currentDevice] systemVersion] floatValue] >= 7.0)
    {
        CGContextSetRGBFillColor(context, pInfo->tintColorR, pInfo->tintColorG, pInfo->tintColorB, 1);
    }
}
CGContextSetTextDrawingMode(context, kCGTextFill);
```

## Win8支持 ##
2014/06/18

- 背景音乐、音效问题
    - 将MP3转成wav。
 
- Webp支持 
    - [代码](https://github.com/cocos2d/cocos2d-x/pull/7124/files)  
    - [第三方库](https://github.com/cocos2d/cocos2d-x-3rd-party-libs-bin/pull/11/files)

- TTF字体排版问题
   
    重写FT_Error CCFreeTypeFont::initGlyphs(const char* text)即可，默认按英文单词排的，也就是查英文空格，重写这个函数即可
    
- 内存问题
    - 不支持512M的机器
    
- WebView问题
    - 不支持透明背景，临时方案让网页加上背景色。
- 打包问题（尚未解决）
- 资源更新问题
- 高分辨率的锯齿问题（尚未解决）


[James Chen]: https://github.com/dumganhar





