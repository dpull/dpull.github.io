---
layout: post
title: golang 编译相关
categories: [general]
tags: []
---

## map

{% highlight go %}
for k := range m {
    delete(m, k)
}
{% endhighlight %}

1. 可以一边遍历一边删除
1. 据说会被优化为 `mapclear`, 可以汇编确认下`go tool compile -S xxx.go`

## range

**TODO**

## 逃逸分析

**TODO**

* cmd/compile/internal/escape/escape.go
* `go run -gcflags "-m -l" internal/test1/main.go`
* go build -gcflags '-m=1 -l' -l是禁止内联，-m是打印优化决定，后面指定的数字越大越详细。 重点关注 escapes to heap 和 moved to heap 附近的打印。
* https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/
