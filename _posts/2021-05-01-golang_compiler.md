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
* `cmd/compile/internal/walk/range.go`

## interface{}

* `interface{}`不是指针, 如果赋值是元素, 则会进行复制.
如下面的例子, 修改a和c都不会影响b

{% highlight go %}
var a = item {
    name: "aaa",
}
var b interface{} = a
var c = b.(item)
a.name = "bbb"
c.name = "ccc"
fmt.Println(b.(item).name)
{% endhighlight %}

* `interface{}`包含类型和值, 当interface不是nil的时候, 存在类型不为nil, 值为nil的情况,
尤其在error返回的时候要注意, error一定要返回nil, 而不要返回某个类型的nil.
如下面的例子, 输出为 "a is nil" "b is not nil"

{% highlight go %}
var a *item = nil
if a == nil {
    fmt.Println(a, "a is nil")
} else {
    fmt.Println(a, "a is not nil")
}
var b interface{} = a
if b == nil {
    fmt.Println(b, "b is nil")
} else {
    fmt.Println(b, "b is not nil")
}
{% endhighlight %}

## 逃逸分析

**TODO**
**TODO interface的逃逸分析**

* cmd/compile/internal/escape/escape.go
* `go run -gcflags "-m -l" internal/test1/main.go`
* go build -gcflags '-m=1 -l' -l是禁止内联，-m是打印优化决定，后面指定的数字越大越详细。 重点关注 escapes to heap 和 moved to heap 附近的打印。
* https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/
