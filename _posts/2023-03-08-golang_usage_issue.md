---
layout: post
title: golang遇到的几个小问题
categories: [general]
tags: [golang, socket]
---

## package list模式的几个坑

经常使用 `go` 命令中的 `...` 参数，以便能够对多个 `package` 执行命令。例如：

- `go test ./...`
- `go build ./cmd/...`
- `go clean ./cmd/...`
- `go install ./cmd/...`

最近因为`...` 参数的问题被坑了两次，由于网上对应的文档较少，我也没有时间去做更多的分析，所以仅简单的记录：

**`go test ./...` 编译失败时提示不明显**

当使用`go test ./...`时，其中某个模块编译失败，进程会返回-2，编译错误信息在stderr, 如果有`-v`就更不明显了, 尽量要分离stderr和stdout

**`go build -buildvcs=false ./cmd/...` 不传递参数**

`go build -buildvcs=false ./cmd/...` 并不会将 `-buildvcs=false` 参数传递给每个 `package`，为了解决这个问题，我们改用以下代码：

{% highlight bash %}
export GOFLAGS="${GOFLAGS} -buildvcs=false" 
go build ./cmd/...
{% endhighlight %}


## stderr重定向问题

有一些`panic`是`unrecoverable`的, 例如:

{% highlight go %}
func doubleUnlock() {
    var mu sync.Mutex
    mu.Lock()
    mu.Unlock()
    mu.Unlock()
}
{% endhighlight %}

在这种情况下，`panic` 产生的错误信息输出到 `stderr` 中。

原本计划使用 `os.Stderr = file` 将 `stderr` 重定向到文件中，但发现 `print` 函数（`panic` 输出错误信息的函数）会绕过 Golang 的 `os.Stderr`，因此需要使用 `syscall.Dup2(int(file.Fd())，int(os.stderr.Fd()))` 来实现 `stderr` 的重定向，或在父进程中处理错误输出。