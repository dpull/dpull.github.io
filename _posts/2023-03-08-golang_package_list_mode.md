---
layout: post
title: golang package list模式的几个坑
categories: [general]
tags: [golang, socket]
---

经常使用 `golang` 命令中的 `...` 参数，以便能够对多个 `package` 执行命令。例如：

- `go test ./...`
- `go build ./cmd/...`
- `go clean ./cmd/...`
- `go install ./cmd/...`

最近因为`...` 参数的问题被坑了两次，由于网上对应的文档较少，我也没有时间去做更多的分析，所以仅简单的记录：

## `go test ./...` 编译失败时提示不明显

当使用`go test ./...`时，其中某个模块编译失败，进程会返回-2，编译错误信息在stderr, 如果有`-v`就更不明显了, 尽量要分离stderr和stdout

## `go build -buildvcs=false ./cmd/...` 不传递参数

`go build -buildvcs=false ./cmd/...` 并不会将 `-buildvcs=false` 参数传递给每个 `package`，为了解决这个问题，我们改用以下代码：

{% highlight bash %}
export GOFLAGS="${GOFLAGS} -buildvcs=false" 
go build ./cmd/...
{% endhighlight %}
