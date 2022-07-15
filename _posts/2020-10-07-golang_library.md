---
layout: post
title: 一些golang的知识点
categories: [general]
tags: []
---

## strings
* `strings.Builder`

{% highlight go %}
type Builder struct {
    addr *Builder // of receiver, to detect copies by value
    buf  []byte
}
{% endhighlight %}

// 通过`b.addr = b`和`if b.addr != b { panic("") }`来检查是否被复制 

* `strings.Compare` 这函数是类似于C的strcmp, 但文档中一直在提到不要用它, 应当用更加简明的运算符比较
* `strings.Reader` 字符串的Reader interface, 里面用了utf8的判断rune的函数:

{% highlight go %}
if c := r.s[r.i]; c < utf8.RuneSelf {
    r.i++
    return rune(c), 1, nil
}
ch, size = utf8.DecodeRuneInString(r.s[r.i:])
r.i += int64(size)
{% endhighlight %}

* `strings.NewReplacer` 工厂模式, 根据传入的参数不同的情况, 返回不同的实现.

Q:为何返回一个struct, 其私有变量是一个interface, 而不是直接返回interface?(1.7版本疑问)
A:猜测可能为了更好的改写实现, 在1.17版本中, 使用了sync.Once进行了延迟初始化

	* 只有一个字符串被替换: `makeSingleStringReplacer`
		* 使用`stringFinder`进行字符串查找
	* byte字符替换byte字符: `byteReplacer`
		* 使用[256]byte存储替换
	* byte字符替换字符串: `byteStringReplacer`
		* 使用[256][]byte存储替换
	* 其他情况: `makeGenericReplacer`
		* 分层(TODO 后续完善)
* `strings.stringFinder` 子串查找(Boyer-Moore string search)
* `string.Index` 使用了多种处理:(参数成为字符串和子串)
	1. 字符串长度小于等于bytealg.MaxBruteForce, 则直接使用汇编
	1. 字符串长度小于等于bytealg.MaxLen, 直接内存查找
	1. 其他情况先内存查找几次(fails >= 4+i>>4), 超过限制次数后使用[rabin-karp search](https://zh.wikipedia.org/wiki/%E6%8B%89%E5%AE%BE-%E5%8D%A1%E6%99%AE%E7%AE%97%E6%B3%95)`

## bytes
* `const maxInt = int(^uint(0) >> 1)` 常量写法
* bytes和strings提供了大量相同的函数, 供[]byte和string类型调用
* `bytes.Index` 同 `string.Index`

## bufio
* `bufio.Scan***`的函数, 一些功能函数, 其中`ScanRunes`可以用来取utf8, 避免调用utf8库
* `bufio.NewScanner`可以用于特定规则去查找文本, 可以和`bufio.Scan***`组合调用
* `bufio.NewReader``bufio.NewWriter``bufio.NewReadWriter`提供了带缓冲区的io读取

## container
提供了三种容器, 堆, 链表, 环

## errors
* `errors.Unwrap`中判断是否存在某个函数

{% highlight go %}
u, ok := err.(interface {
    Unwrap() error
})
{% endhighlight %}

* `errors.Unwrap`获取指定类型的反射

{% highlight go %}
var errorType = reflectlite.TypeOf((*error)(nil)).Elem()
{% endhighlight %}


## sync
* `sync.Cond` 中的 `noCopy`

{% highlight go %}
// noCopy may be embedded into structs which must not be copied
// after the first use.
//
// See https://golang.org/issues/8005#issuecomment-190753527
// for details.
type noCopy struct{}

// Lock is a no-op used by -copylocks checker from `go vet`.
func (*noCopy) Lock()   {}
func (*noCopy) Unlock() {}
{% endhighlight %}

* `sync.atomic.Value` 

1. 把interface{}进行原子Load/Save,首先将其转化为`ifaceWords`, 然后对两个指针分别进行Load/Save

{% highlight go %}
type ifaceWords struct {
    typ  unsafe.Pointer
    data unsafe.Pointer
}
{% endhighlight %}

1. 因为是两个指针的原子操作, 所以可能存在竞争状态, 所以可以学习一下Save是怎么解决这个问题的:`sync.atomic.Value.Store`

{% highlight go %}
for {
    typ := LoadPointer(&vp.typ)
    if typ == nil {
        // 首先load typ, 如果是nil, 则尝试设置为-1, 如果成功了, 则设置data和typ(注意顺序)
        runtime_procPin()
        if !CompareAndSwapPointer(&vp.typ, nil, unsafe.Pointer(^uintptr(0))) {
            runtime_procUnpin()
            continue
        }
        StorePointer(&vp.data, vlp.data)
        StorePointer(&vp.typ, vlp.typ)
        runtime_procUnpin()
        return
    }
    if uintptr(typ) == ^uintptr(0) {
        continue
    }
    if typ != vlp.typ {
        panic("sync/atomic: store of inconsistently typed value into Value")
    }
    StorePointer(&vp.data, vlp.data)
    return
}
{% endhighlight %}

## reflect
* `reflect.ValueOf` 强制将变量从堆上改到栈上

{% highlight go %}
func escapes(x interface{}) {
    if dummy.b {
        dummy.x = x
    }
}

var dummy struct {
    b bool
    x interface{}
}
{% endhighlight %}
