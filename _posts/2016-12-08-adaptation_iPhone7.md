---
layout: post
title: 适配iPhone7时的两个小问题
categories: [general]
tags: []
---

一直用iPad pro开发，也是用的iOS10系统，心想应当和iPhone没啥区别，但实际上还是有些问题。

## OpenGL ES 设备丢失
当把程序设置为可横屏也可竖屏时，从横屏进入后台，然后恢复前台，iPhone7的渲染设备丢失了，iPad pro不会；
游戏设置为仅横屏或者仅竖屏时没有这个问题；
搜索网上没有相关的解决方案。

仔细看`GLKView`的文档，发现`bindDrawable`方法，文档中提到：

> If your application changed the framebuffer object bound to OpenGL ES, it calls this method to rebind the view’s framebuffer object to OpenGL ES.

在`applicationWillEnterForeground`时执行该方法，问题解决。

## 无法连接网络
游戏的资源放在http服务器上，发现程序运行后，使用`curl`无法下载资源，返回错误码是无法连接服务器，但是Safari访问是正常的。

一开始怀疑是iOS要求使用https的问题，于是在`info.plist`中开启http的相关设置，但没有解决问题。

不停重启调试时突然弹出一个框： 

>允许“XX”使用数据

>可能同时包含无线局域网和蜂窝移动数据

点击允许后，http连接正常了。

搜索弹框内容，网上有帖子说是iOS10的一个bug：
 
> 由于大陆相关部门出台的新规定指出，应用在未经用户允许的前提下，系统不能授予其使用联网、获取定位的功能。Apple 在 iOS 10 操作系统中加入了关于应用使用数据的授权弹窗提示，用户在 iOS 10 系统中第一次打开应用时，会被要求对于是否授予应用联网权限进行选择。
> 
> 不过，新的权限系统的引入也带来了一个 iOS 10 的新 bug。
> 
> 如果你在 iOS 10 操作系统中安装了一个新应用或者第一次打开某个应用时发现应用出现无法访问网络无法刷新数据的情况，并且在蜂窝数据网络的设置项中无法找到相应应用的联网权限设置选项，恭喜你，你中招了。
> 
> 目前已知的是，关于应用使用数据的权限完全由 iOS 10 系统控制，开发者无法针对此设置项进行检查或者开发主动请求联网权限的功能，在 Apple 针对此 bug 发布系统更新之前，你可能需要手动解决相关应用的网络连接问题。

网上提供了几种解决方案，都不怎么靠谱。

经过多次尝试，使用如下方案解决此问题：

{% highlight objc %}
extern "C" void FixDataPermissions()
{
    NSURL* pUrl = [NSURL URLWithString:@"https://www.baidu.com"];
    NSURLSessionDataTask* pTask = [[NSURLSession sharedSession]dataTaskWithURL:pUrl];
    [pTask resume];
}
{% endhighlight %}

**思路说明：** 猜测iOS权限确认框功能，应当通过hook相关API实现的，故而只有使用自带的网络请求API才会弹框。