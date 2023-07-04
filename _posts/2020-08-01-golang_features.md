---
layout: post
title: golang的一些特性分析笔记
categories: [general]
tags: [golang]
---

## 反汇编相关

[在线反汇编](https://go.godbolt.org/):

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


# 使用objdump会更容易看linux平台的代码
go build -gcflags "all=-l"
objdump -Sd XXX
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

{% highlight go %}
type eface struct {
    _type *_type
    data  unsafe.Pointer
}
{% endhighlight %}

* `interface{}` 是一个结构体, 由类型和指针组成
* 如果赋值的元素是结构体(不是结构体指针), 则会进行复制结构体, 并将复制的结构体的指针赋值给`data`

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

* `interface{}`包含类型和值, 当interface不是nil的时候, **存在类型不为nil, 值为nil的情况**,
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

这个实现原理是`interface{}`的判空只看类型是不是nil, 不看value, 下面的代码中, type被放在第一个参数rax, 类型被放在了第二个参数rbx 

{% highlight nasm %}
func worker(i interface{}) {
  488100:	49 3b 66 10          	cmp    0x10(%r14),%rsp
  488104:	0f 86 aa 00 00 00    	jbe    4881b4 <main.worker+0xb4>
  48810a:	48 83 ec 30          	sub    $0x30,%rsp
  48810e:	48 89 6c 24 28       	mov    %rbp,0x28(%rsp)
  488113:	48 8d 6c 24 28       	lea    0x28(%rsp),%rbp
  488118:	48 89 44 24 38       	mov    %rax,0x38(%rsp)
  48811d:	48 89 5c 24 40       	mov    %rbx,0x40(%rsp)
	if i == nil {
  488122:	48 85 c0             	test   %rax,%rax
  488125:	74 43                	je     48816a <main.worker+0x6a>
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

## defer函数修改return的值, 需要使用具名return

{% highlight go %}
func f1() (i int) { // return 2
    i = 1
    defer func() { 
        i = 2
    }()
    return i 
}
func f2 () int { // return 1
    i := 1
    defer func() { 
        i = 2
    }()
    return i 
}
{% endhighlight %}

简单说一下这个的原理, 可以理解为函数堆栈上有一个返回值变量的空间,
当该变量匿名时, 执行return N时, 会给该变量赋值,
当defer执行后, 会将该变量再赋值给eax(eax是第一个返回值)

简单来说，这个原理可以理解为函数堆栈上有一个用于存储返回值的变量空间。
当该变量未命名时，执行return N语句时，会将该变量赋值为N。
紧接着执行defer语句后，该变量的值会被再次赋值给eax（eax是第一个返回值）。

{% highlight asm %}
000000000045f220 <main.f1>:
	return i                                                                ; 因为返回的是具名的返回值变量, 所以不需要赋值给返回值变量
  45f28b:	e8 b0 2b fd ff       	callq  431e40 <runtime.deferreturn>
  45f290:	48 8b 44 24 08       	mov    0x8(%rsp),%rax                   ; 将具名的返回值变量赋值给%rax
  45f295:	48 8b 6c 24 70       	mov    0x70(%rsp),%rbp
  45f29a:	48 83 c4 78          	add    $0x78,%rsp
  45f29e:	c3                   	retq 

000000000045f300 <main.f2>:
	return i
  45f36b:	48 8b 44 24 10       	mov    0x10(%rsp),%rax          
  45f370:	48 89 44 24 08       	mov    %rax,0x8(%rsp)                   ; 赋值给匿名的返回值变量
  45f375:	e8 c6 2a fd ff       	callq  431e40 <runtime.deferreturn>
  45f37a:	48 8b 44 24 08       	mov    0x8(%rsp),%rax                   ; 将匿名的返回值变量赋值给%rax
  45f37f:	48 8b 6c 24 78       	mov    0x78(%rsp),%rbp
  45f384:	48 83 ec 80          	sub    $0xffffffffffffff80,%rsp
  45f388:	c3                   	retq   
{% endhighlight %}


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

## 参数和返回值

[Go internal ABI specification](https://go.googlesource.com/go/+/refs/heads/dev.regabi/src/cmd/compile/internal-abi.md)

golang 函数之间的调用传递参数和结果是通过使用 stack 和 registers 的联合方式。 

amd64 架构使用以下 9 个寄存器序列来存储整数参数和结果： `RAX, RBX, RCX, RDI, RSI, R8, R9, R10, R11`

{% highlight go %}
func arguments(i1 int8, i2 int16, f1 float32 , f2 float64, i3 int32, i4 int64)  (int8, int16, float32, float64, int32, int64) {
	return 1, 2, 3, 4, 5, 6
}

arguments(6, 5, 4, 3, 2, 1)
{% endhighlight %}

{% highlight nasm %}

func arguments(i1 int8, i2 int16, f1 float32 , f2 float64, i3 int32, i4 int64)  (int8, int16, float32, float64, int32, int64) {
  49af40:	48 83 ec 28          	sub    $0x28,%rsp
  49af44:	48 89 6c 24 20       	mov    %rbp,0x20(%rsp)
  49af49:	48 8d 6c 24 20       	lea    0x20(%rsp),%rbp
  49af4e:	88 44 24 30          	mov    %al,0x30(%rsp)
  49af52:	66 89 5c 24 32       	mov    %bx,0x32(%rsp)
  49af57:	f3 0f 11 44 24 34    	movss  %xmm0,0x34(%rsp)
  49af5d:	f2 0f 11 4c 24 38    	movsd  %xmm1,0x38(%rsp)
  49af63:	89 4c 24 40          	mov    %ecx,0x40(%rsp)
  49af67:	48 89 7c 24 48       	mov    %rdi,0x48(%rsp)
  49af6c:	c6 44 24 05 00       	movb   $0x0,0x5(%rsp)
  49af71:	66 c7 44 24 06 00 00 	movw   $0x0,0x6(%rsp)
  49af78:	0f 57 d2             	xorps  %xmm2,%xmm2
  49af7b:	f3 0f 11 54 24 0c    	movss  %xmm2,0xc(%rsp)
  49af81:	0f 57 d2             	xorps  %xmm2,%xmm2
  49af84:	f2 0f 11 54 24 18    	movsd  %xmm2,0x18(%rsp)
  49af8a:	c7 44 24 08 00 00 00 	movl   $0x0,0x8(%rsp)
  49af91:	00 
  49af92:	48 c7 44 24 10 00 00 	movq   $0x0,0x10(%rsp)
  49af99:	00 00 
	return 1, 2, 3, 4, 5, 6
  49af9b:	c6 44 24 05 01       	movb   $0x1,0x5(%rsp)
  49afa0:	66 c7 44 24 06 02 00 	movw   $0x2,0x6(%rsp)
  49afa7:	f3 0f 10 15 49 46 02 	movss  0x24649(%rip),%xmm2        # 4bf5f8 <$f32.40400000>
  49afae:	00 
  49afaf:	f3 0f 11 54 24 0c    	movss  %xmm2,0xc(%rsp)
  49afb5:	f2 0f 10 15 9b 46 02 	movsd  0x2469b(%rip),%xmm2        # 4bf658 <$f64.4010000000000000>
  49afbc:	00 
  49afbd:	f2 0f 11 54 24 18    	movsd  %xmm2,0x18(%rsp)
  49afc3:	c7 44 24 08 05 00 00 	movl   $0x5,0x8(%rsp)
  49afca:	00 
  49afcb:	48 c7 44 24 10 06 00 	movq   $0x6,0x10(%rsp)
  49afd2:	00 00 
  49afd4:	0f b6 44 24 05       	movzbl 0x5(%rsp),%eax
  49afd9:	0f b7 5c 24 06       	movzwl 0x6(%rsp),%ebx
  49afde:	8b 4c 24 08          	mov    0x8(%rsp),%ecx
  49afe2:	f3 0f 10 44 24 0c    	movss  0xc(%rsp),%xmm0
  49afe8:	f2 0f 10 4c 24 18    	movsd  0x18(%rsp),%xmm1
  49afee:	bf 06 00 00 00       	mov    $0x6,%edi
  49aff3:	48 8b 6c 24 20       	mov    0x20(%rsp),%rbp
  49aff8:	48 83 c4 28          	add    $0x28,%rsp
  49affc:	c3                   	retq   
  49affd:	cc                   	int3   
  49affe:	cc                   	int3   
  49afff:	cc                   	int3   

  (6, 5, 4, 3, 2, 1)
49b486:	b8 06 00 00 00       	mov    $0x6,%eax
49b48b:	bb 05 00 00 00       	mov    $0x5,%ebx
49b490:	f3 0f 10 05 64 41 02 	movss  0x24164(%rip),%xmm0        # 4bf5fc <$f32.40800000>
49b497:	00 
49b498:	f2 0f 10 0d b0 41 02 	movsd  0x241b0(%rip),%xmm1        # 4bf650 <$f64.4008000000000000>
49b49f:	00 
49b4a0:	b9 02 00 00 00       	mov    $0x2,%ecx
49b4a5:	bf 01 00 00 00       	mov    $0x1,%edi
49b4aa:	e8 91 fa ff ff       	callq  49af40 <main.arguments>
{% endhighlight %}

### slice, string, interface{} 传参

slice 会用三个寄存器传递
string 会用两个寄存器传递
interface{} 会用两个寄存器传递(第一个是type, 第二个是value指针)