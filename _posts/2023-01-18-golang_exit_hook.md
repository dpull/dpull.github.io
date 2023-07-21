---
layout: post
title: golang Exit Hook试用
categories: [general]
tags: [golang, socket]
---
[runtime/exithook.go](https://github.com/golang/go/blob/master/src/runtime/exithook.go) 中增加了`addExitHook`函数, 可以当`os.Exit`时进行回调.

该函数`Sep 27, 2022`添加, 老版本的golang没有这个函数.

经验证:
1. 执行`os.Exit`可以被回调
1. 当出现不可恢复的panic时, 不会被回调

测试代码:

{% highlight go %}

import (
	"os"
	"sync"
	"time"

	_ "unsafe"
)

//go:linkname runtime_addExitHook runtime.addExitHook
func runtime_addExitHook(f func(), runOnNonZeroExit bool)

func main() {
	runtime_addExitHook(func() {
		os.Stderr.WriteString("fuck!!\n\n")
	}, true)

	go func() {
		// os.Exit(2)
		test()
	}()

	time.Sleep(time.Minute)
}

func test() {
	var mu sync.Mutex
	mu.Unlock()
}
{% endhighlight %}
