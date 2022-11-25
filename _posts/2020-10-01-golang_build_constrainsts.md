---
layout: post
title: golang 编译约束
categories: [general]
tags: [golang]
---

[Build constraints](https://pkg.go.dev/cmd/go#hdr-Build_constraints)

编译约束, 即编译tag, 以//go:build开头的行注释

	//go:build

它列出文件应包含在package中的条件, 约束出现在源码中(不限制是go代码), 但是必须在文件顶端.
在前面只能有空行或者其他注释行.这些规则说明编译约束需要在package语句前

为了将构建约束和包文档区分开, 构建约束后应当加以个空行

编译约束是一个包含选项和 ||, &&, 和 !运算符和圆括号的表达式.操作符和go中的含义相同

For example, the following build constraint constrains a file to build when the "linux" and "386" constraints are satisfied, or when "darwin" is satisfied and "cgo" is not:
例如, 以下的编译约束限制文件在linux且386下或darwin且非cgo下编译

	//go:build (linux && 386) || (darwin && !cgo)

文件中含有多行`//go:build `会报错

在特定编译下, 满足以下条件:

	- the target operating system, as spelled by runtime.GOOS, set with the
	GOOS environment variable.
	- the target architecture, as spelled by runtime.GOARCH, set with the
	GOARCH environment variable.
	- the compiler being used, either "gc" or "gccgo"
	- "cgo", if the cgo command is supported (see CGO_ENABLED in
	'go help environment').
	- a term for each Go major release, through the current version:
	"go1.1" from Go version 1.1 onward, "go1.12" from Go 1.12, and so on.
	- any additional tags given by the -tags flag (see 'go help build').

测试版或者镜像版本没有单独的构建标签

如果文件名除去扩展名和可能有的_test后缀后, 匹配下面的模式:

	*_GOOS
	*_GOARCH
	*_GOOS_GOARCH

(例如:source_windows_amd64.go)其中GOOS和GOARCH代表了已知的操作系统和处理器架构.
则这个文件被认为拥有隐式构建约束(除了文件中的显示约束)

使用GOOS=android将匹配包含linux和android的tag
使用GOOS=illumos将匹配包含solaris和android的tag
使用GOOS=ios将匹配包含darwin和ios的tag

避免文件被构建
	//go:build ignore

只在cgo和linux或osx下编译一个文件

	//go:build cgo && (linux || darwin)

这样的文件通常会有另外一个文件与之配对, 它将带有这样的约束
	
	//go:build !(cgo && (linux || darwin))

文件dns_windows.go只在windows下被变异, 同样, math_386.s只在32-bit x86下编译

Go1.16和之前版本编译约束使用不同的语法, 有一个`// +build`前缀. gofmt命令在遇到老的语法时将添加一个等效的`//go:build`约束

