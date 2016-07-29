---
layout: post
title: 链接静态库
categories: [general]
tags: []
---
## 禁止链接器优化掉未引用的函数和数据

链接静态库时，对于没有引用的函数和数据会被删除掉，这种优化被称为transitive COMDAT elimination。

这可能引起未被引用的静态变量及其初始化代码没有执行的问题，可采用链接参数来避免这个问题。

	gcc ld
		--whole-archive             Include all archive contents
		--no-whole-archive          Include only needed archive contents
	
	llvm ld
		-force_load path_to_archive
			Loads all members of the specified static archive library.  Note: -all_load forces all members of all archives to be
			loaded.  This option allows you to target a specific archive.
    
    msvc link 
    	/OPT:REF 
    		When /OFT:REF is enabled, LINK removes unreferenced packaged functions and data.


	
## 静态库依赖顺序
当动态库或可执行程序关联静态库时，一定要逆序传入静态库（被依赖的在后面）。

## 常见警告屏蔽

	-Wno-unused-value
	-Wno-unused-label
	-Wno-unused-local-typedefs
	-Wno-unused-variable
	-Wno-reorder
	-Wno-missing-braces
	-Wno-shorten-64-to-32
	-Wno-logical-op-parentheses
	-Wno-sometimes-uninitialized
	-Wno-incompatible-ms-struct
