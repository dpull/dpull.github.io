---
layout: post
title: golang 编译相关
categories: [general]
tags: [golang]
---

编译相关的分析命令, [在线反汇编](https://go.godbolt.org/):

{% highlight bash %}
# -N 禁止优化
# -l 禁止内联
# -S 打印汇编
# -m 打印编译优化策略（包括逃逸情况和函数是否内联，以及变量分配在堆或栈）
# -m=1 -m后面指定的数字越大越详细

go tool compile -m -l main.go

go tool compile -N -l -S main.go
go tool compile -S main.go

go tool compile -N -l main.go && go tool objdump main.o 
go tool compile main.go && go tool objdump main.o
{% endhighlight %}

## string

在部分内置调用上, []byte可以无损的转化为string, 而无需调用`runtime.slicebytetostring`

目前已知的调用有:
* map查找(备注, map赋值不可以)

{% highlight go %}
var b []byte
var m map[string]string
s := m[string(b)]
{% endhighlight %}

* 字符串拼接

{% highlight go %}
var b []byte
s := "ABC" + string(b)
{% endhighlight %}

* 字符串比较

{% highlight go %}
var b []byte
bs := "ABC" == string(b)
{% endhighlight %}

## map

{% highlight go %}
for k := range m {
    delete(m, k)
}
{% endhighlight %}

* range map 可以一边遍历一边删除
* 以上代码会被优化为`runtime.mapclear`

## range 

源码: `cmd/compile/internal/walk/range.go`

range会再编译器通过插入代码的方式实现.

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
{% highlight go %}
func print0(v interface{})  {
    // v does not escape
}

func print1(v interface{}) int {
    // v does not escape
    i := len(v.(string))
    return i
}

func print3(v interface{}) reflect.Type {
    // leaking param: v
    rv := reflect.ValueOf(v)
    return rv.Type()
}

func print()  {
    s1 := ""
    s2 := ""
    s3 := ""
    s4 := ""
    print0(s1) // s1 does not escape
    print1(s2) // s2 does not escape
    print1(s3) // s3 does not escape
    fmt.Println(s4) // s4 escapes to heap
}
{% endhighlight %}

`reflect.ValueOf` 会造成`leaking param`, 可以参考[一些golang的知识点](./2021-10-07-golang_library)中的反射部分.
