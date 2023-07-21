---
layout: post
title: golang Exit Hook试用
categories: [general]
tags: [golang, socket]
---

在 [runtime/exithook.go](https://github.com/golang/go/blob/master/src/runtime/exithook.go)  中实现了 `addExitHook` 函数，可以在调用 `os.Exit` 时进行回调。该函数是在 `Sep 27, 2022`` 添加的，旧版本的 Go 中并没有这个函数。

经过验证：

1. 当调用 `os.Exit` 时，函数可以被回调。
1. 当出现不可恢复的 `panic` 时，函数不会被回调。

目前来看，该函数的用途不是特别大。

以下是测试代码:

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
