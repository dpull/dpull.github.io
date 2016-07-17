---
layout: post
title: 工作机设置备忘
categories: [general]
tags: []
---

# 软件列表

* 效率工具：`alfred`
* 安装软件：`Homebrew`
* 卸载软件：`AppCleaner`
* 解压：`Keka`
* 浏览器：`Chrome`
* 文件管理：`CRAX Commander` 和 `Total Commander(windows)`
* 文本编辑：`Sublime Text`
* 电子书：`CleanView`
* 虚拟机：`Parallels Desktop`
* 办公：`Office(windows)`	
* IDE：`Xcode` 和 `Visual Studio(windows)`	
* git：`SourceTree`
* svn：`svn命令行` 和 `TortoiseSVN(windows)`
* 思维导图：`MindNode`
* 时间管理：`OmniFocus`
* 开发文档：`Dash`
* Markdown编辑器：`Mou`
* 播放器：`射手影音`
* 下载：`迅雷(windows)`
* 计划任务：`QuickBuild`

## `alfred`常用功能或工作流
* 锁屏：`lock`
* 启动应用：`无` 或 `open`
* 退出应用：`quit`
* 执行终端命令：`> ls`
* 搜索文件：`find`
* dash工作流：查文档
* `dot_clean` 文档目录

## `Sublime`插件设置

安装[插件管理器](https://packagecontrol.io/installation)。

我常用插件有：

* Path Tools，用于拷贝文件路径
* Advanced CSV，用于查看csv配置表
* Json Reindent，用于格式化json文本，用法：打开插件界面，输入json

## `QuickBuild`常用任务
[QuickBuild](http://www.pmease.com/) 是一款持续集成工具，
提供了对版本控制工具，编译工具，命令行很好的支持。

**注意：**从官网下载后，不要执行安装，而是直接运行`./server.sh console`。因为安装要求用户是root，会造成一些权限问题。其他的配置参考[QuickBuild安装说明](http://pureivan.blog.51cto.com/2035414/1607215)。

### 定期更新skynet_mingw库
[skynet_mingw](https://github.com/dpull/skynet-mingw) 是我维护的一个开源项目，它有一个日常需求就是更新`submoudle`到最新。

### 更新工作的产品库
每天早上自动更新svn

## 我的终端设置

`.bash_profile` 的配置如下：

{% highlight shell %}
export CLICOLOR=1
export LSCOLORS=gxfxaxdxcxegedabagacad
alias ll="ls -l"
alias la="ls -a"

alias unity='open -a Unity -n'

export ANDROID_SDK_ROOT=/Applications/ADT/sdk
export ANDROID_NDK_ROOT=/Applications/android-ndk-r8d
export NDK_ROOT=/Applications/android-ndk-r8d
export PATH=$PATH:$ANDROID_SDK_ROOT
export PATH=$PATH:$ANDROID_NDK_ROOT 
{% endhighlight %}

## 备份及恢复

* 开启time machine时刻备份硬盘数据。

	教训：恢复硬盘时一定要使用快速的传输设备，有次使用了usb2.0的硬盘盒，恢复了四个多小时。
	
* 制作安装盘，防止需要网络下载系统。
	
	教训：因为公司网络限速，有次下载`互联网恢复系统`用了一个多小时。
	
	
		# 将Install{0}替换为安装盘文件名(按tab选择);
		# 将Install{1}替换为U盘名(按tab选择);
		sudo /Applications/Install{0}/Contents/Resources/createinstallmedia --volume /Volumes/{1} --applicationpath /Applications/Install{0} --nointeraction 