---
layout: post
title: 工作机设置备忘
categories: [general]
tags: []
---

# 软件列表

* 效率工具：`alfred`  `Magnet`
* 安装软件：`Homebrew`
* 卸载软件：`AppCleaner`
* 解压：`The Unarchiver`
* 浏览器：`Google Chrome`
* git：`SourceTree`
* 思维导图：`MindNode`
* 时间管理：`OmniFocus`
* 文本编辑：`VS Code`
---
* 系统监控：`iStat Menus`
* 文件管理：`Commander One`
* 电子书：`CleanView`
* 虚拟机：`Parallels Desktop` 和 `Docker`
* IDE：`Xcode` 和 `Visual Studio(windows)`
* 办公：`Office`
* 开发文档：`Dash`
* 播放器：`射手影音`
* 计划任务：`QuickBuild`

## 常用指令

{% highlight shell %}
dot_clean 路径 # 清理mac生成的._开头的文件
lsof -i :80 # 查看某端口号被哪些程序占用
netstat -lnp # 查看监听的程序和端口
find path -name *.cpp
pmap -x pid # 可用于查看加载的模块
pstack pid # 查看堆栈
screen # 多会话
source ~/.bash_profile
dos2unix 
rpm -ql sqlite-devel
/usr/include/c++/ #C++ 库文件
{% endhighlight %}	

## `git`常用命令

{% highlight shell %}
git checkout # 可用于回滚
{% endhighlight %}	

## `svn`常用命令

{% highlight shell %}
svn revert -R [Path]
svn status --no-ignore [Path]
svn add --no-ignore [Path]
svn status | grep '^?' | awk '{print $2}' | xargs rm -rf #删除非版本内的文件 
IFS=$(echo -en "\n\b") #处理文件名中空格 
{% endhighlight %}	

## `Docker`常用命令

{% highlight shell %}
docker ps -a
docker run -t -i -v /Volumes/Data/git:/git centos /bin/bash
docker exec -i -t 69d1 bash
docker start 69d1
{% endhighlight %}	

## `QuickBuild`常用任务
[QuickBuild](http://www.pmease.com/) 是一款持续集成工具，
提供了对版本控制工具，编译工具，命令行很好的支持。

**注意：**从官网下载后，不要执行安装，而是直接运行`./server.sh console`。因为安装要求用户是root，会造成一些权限问题。其他的配置参考[QuickBuild安装说明](http://pureivan.blog.51cto.com/2035414/1607215)。

### 定期更新skynet_mingw库
[skynet_mingw](https://github.com/dpull/skynet-mingw) 是我维护的一个开源项目，它有一个日常需求就是更新`submoudle`到最新。

### 更新工作的产品库
每天早上自动更新svn

## 我的终端设置

`~/.bash_profile` 的配置如下：

{% highlight shell %}
export CLICOLOR=1
export LSCOLORS=gxfxaxdxcxegedabagacad
alias ll="ls -l"
alias la="ls -a"
export ALL_PROXY=socks5://10.20.1.1:1111
{% endhighlight %}

## 备份及恢复

* 开启time machine时刻备份硬盘数据。

  教训：恢复硬盘时一定要使用快速的传输设备，有次使用了usb2.0的硬盘盒，恢复了四个多小时。

* 制作安装盘，防止需要网络下载系统。

  教训：因为公司网络限速，有次下载`互联网恢复系统`用了一个多小时。

  	# 将Install{0}替换为安装盘文件名(按tab选择);
  	# 将Install{1}替换为U盘名(按tab选择);
  	sudo /Applications/Install{0}/Contents/Resources/createinstallmedia --volume /Volumes/{1} --applicationpath /Applications/Install{0} --nointeraction 