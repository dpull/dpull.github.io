---
layout: post
title: cocos2dx开发环境设置及常用操作
categories: [general, cocos2dx]
tags: [cocos2dx]
---

以前一直开发端游，不熟悉ios和android的开发环境。

工作机选择：
ios和android特有功能的开发，选用mac作为开发机，因为它又能开发ios又能开发android。

纯游戏功能使用windows开发，毕竟大家都熟windows。

## ios开发环境 ##

1. 使用AppStore安装XCode
1. 安装Svn：菜单选择XCode--Preferences--Downloads--Command Line
   Tools。（其他的ios模拟器也都下载吧！）

### XCode常用操作 ###
1. 在myapp-Info.plist 中 Bundle display name 中修改就可以修改 app安装后的显示名 
1. XCode4 设置命令行参数：左上角下拉列表 Scheme单击前面文字后选择Edit Scheme，选择Run 工程名

## Android ##
Android的调试比较复杂，如果不使用C++代码的调试，可采用如下步骤。

1. 下载adt-bundle-mac 和 android-ndk （[下载](http://developer.android.com/sdk/index.html)）** (android的NDK一定要选择 Platform(32-bit target)，在构建Unitylua时，使用x64版本出现缺失库的问题。） **
2. 点击C/C++ Build->Environment 增加NDK_ROOT的路径 （Vsriable：NDK_ROOT， Value：路径）
3. 菜单File--Import--Android--Existing Android Code Into Workspace--项目工程proj.android文件夹 和 cocos2dx/platform中的android文件夹
4. 右击项目->Debug As->Android Application

> 第2步可以修改为从终端执行
> 修改.bash_profile中NDK_ROOT=/Applications/android-ndk（见我的终端设置）， 执行build_native.sh

如果要开启C++代码的调试

1. 右击项目->点Properties->点击C/C++ Build  在C/C++Build 中的 Build command  的命令后面加上 NDK_DEBUG=1
1. 右击项目->Debug As->Android Native Application

如果出现 Unknown Application ABI， 使用终端执行ndk-build DUMP_APP_ABI看详细信息

- NDK_MODULE_PATH 问题：cocos2dx、CocosDenshion、extensions、external、cocos2d-x-2.2/cocos2dx/platform/platform/third_party/android/prebuilt中5个（libcurl、libjpeg、libpng、libtiff、libwebp）复制到android-ndk的sources中
- android:minSdkVersion 问题：修改AndroidManifest.xml 中的<uses-sdkandroid:minSdkVersion="？"/>将？修改为提示的数字（注意api的版本要低于手机的版本）
- 只有一些info日志，没有出错信息：去.mk中删除相关的info

## Svn注意事项 ##

- 使用TortoiseSVN提交cocos2dx的源代码,需要将 Global ignore pattern 中的 \*.a \*.py等去掉，否则一些.a文件会漏提。
- 使用命令行需要增加参数--no-ignore 如：`svn add --no-ignore`

> 导入项目的时候可能会弹出错误提示：
> Errors occurred during the build. 
> Errors occurred during the build. 
> Errors running builder 'Android Pre Compiler' on project'项目名称' java.lang.NullPointerException.
> 
> 原因是使用SVN导致：svn 1.7以前的版本每个文件夹下都有一个.svn文件，
> 而新版的adt加强了对项目文件中的异常类型文件的识别，所以在遇到.svn时报了空指针的错误。

## 工程配置 ##
建议不要使用向导创建工程，直接用HelloCpp工程修改。
用文本文件打开ios和android的工程配置文件，修改文件中的相对路径。

## Android MK文件 ##
1. 示例工程中的LOCAL\_SRC\_FILE是全部列出来的，其实是没必要的。
 		
{% highlight shell %}
CLASS_FILES := $(wildcard $(LOCAL_PATH)/../../Classes/*.cpp)
CLASS_FILES := $(CLASS_FILES:$(LOCAL_PATH)/%=%) 

LOCAL_SRC_FILES := Client/main.cpp
LOCAL_SRC_FILES += $(CLASS_FILES)  
{% endhighlight %}
        

1. 打开项目调试日志（可以看CCLOG的输出）

{% highlight shell %}
LOCAL_CFLAGS += -DCOCOS2D_DEBUG=1
{% endhighlight %}

1. MK文件输出

{% highlight shell %}
$(error LOCAL_PATH)  #输出字符串LOCAL_PATH
$(warning $(LOCAL_PATH)) #输出变量$(LOCAL_PATH)的值
$(info LOCAL_PATH= $(LOCAL_PATH)) 
{% endhighlight %}
