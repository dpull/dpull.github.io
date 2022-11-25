---
layout: post
title: 工作机设置备忘
categories: [general]
tags: []
---

# 软件列表
* ~~效率工具：`alfred`  `Magnet`~~
* ~~安装软件：`Homebrew`~~
* 卸载软件：`AppCleaner`
* 解压：`The Unarchiver`
* 浏览器：`Google Chrome`
* git：~~`SourceTree`~~`UGit`
* 思维导图：~~`MindNode`~~`XMind`
* 时间管理：~~`OmniFocus`~~`MS TODO`
* 文本编辑：`VS Code`
* ~~系统监控：`iStat Menus`~~
* ~~文件管理：`Commander One`~~
* 电子书：~~`CleanView`~~`微信读书`
* 虚拟机：~~`Parallels Desktop` 和~~ `Docker`
* IDE：~~`Xcode` 和 `Visual Studio(windows)`~~`JetBrains`
* 办公：`Office`
* 播放器：~~`射手影音`~~`Fig Player`
* Terminal：`WeTERM`

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

## 我的终端设置

`~/.bash_profile` 的配置如下：

{% highlight shell %}
export CLICOLOR=1
export LSCOLORS=gxfxaxdxcxegedabagacad
alias ll="ls -l"
alias la="ls -a"
{% endhighlight %}

