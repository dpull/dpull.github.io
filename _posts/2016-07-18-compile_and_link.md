---
layout: post
title: 编译笔记整理
categories: [general]
tags: []
---
## ld完全链接静态库

链接静态库时，ld默认会分析obj文件，没有引用的obj不会加入到目标文件中。

这可能引起静态变量及其初始化代码被裁减掉的问题，可采用链接参数来避免这个问题。

	gcc       -Wl,--whole-archive
	clang     -Wl,-force_load
	Android   LOCAL_WHOLE_STATIC_LIBRARIES
	
## 常见警告		