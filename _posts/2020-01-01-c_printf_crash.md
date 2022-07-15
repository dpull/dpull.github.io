---
layout: post
title: 一个glibc引发的crash
categories: [general]
tags: []
---

## 背景

新版本正式服上线当天上午, 收到了DS Crash的报警, 因为DS没有开启生成Core文件,  所以只有Log中的堆栈信息:

{% highlight c %}
[2019.12.18-20.55.34:436][  1]LogLinux: === Critical error: ===
Unhandled Exception: SIGSEGV: invalid attempt to read memory at address 0x0000000000000000

[2019.12.18-20.55.34:436][  1]LogLinux: Fatal error!
0x00007f1de6bc0730 /lib64/libc.so.6(+0x4c730) [0x7f1de6bc0730]
0x00007f1de6bc13e8 /lib64/libc.so.6(__printf_fp+0xc58) [0x7f1de6bc13e8]
0x00007f1de6bc75cb /lib64/libc.so.6(vfwprintf+0x1a1b) [0x7f1de6bc75cb]
0x00007f1de6be3146 /lib64/libc.so.6(vswprintf+0x86) [0x7f1de6be3146]
0x0000000003caeeb2 FStandardPlatformString::GetVarArgs(wchar_t*, unsigned long, int, wchar_t const*&, __va_list_tag*) 
0x0000000003d5406d FMsg::Logf_Internal(char const*, int, FName const&, ELogVerbosity::Type, wchar_t const*, ...)
0x00000000034087dd FXXXSetting::InitFromConfig(UXXXConfig const*)
{% endhighlight %}

查看对应的代码:

{% highlight c %}
double tf_ReadVal;
// ...
UE_LOG(LogXXX, Log, TEXT("Float set <%s>|%llf"), *PropertyName, tf_ReadVal);
{% endhighlight %}   

该段代码在体验服没有发生过变更, 且体验服没有发现与此相关的Crash.

### 背景结论
* 这是一个偶现的DS Crash.
* 空指针读内存失败导致Crash.

## 静态分析

通过查看项目源码和glibc源码进行静态分析.

### 项目代码错误

`double`类型在日志格式化输出时, 错误使用了`%llf`. 
根据标准, `double` 应当用`%f`, `long double` 应当用`%Lf`, `%llf`是未定义的.

我们服务器的`glibc`对应版本是`glibc2.17`, 通过查看对应源码[vfprintf.c](https://github.com/bminor/glibc/blob/release/2.17/master/stdio-common/vfprintf.c) 将`llf`识别为`long double`类型.

### 崩溃堆栈分析

对照日志中的堆栈信息和[libc.so的反汇编](./libc.so.6.asm)代码可知, 函数崩溃在:

    000000000004c730 <__guess_grouping>:
        4c730:	0f b6 06             	movzbl (%rsi),%eax

对应在[__printf_fp](https://github.com/bminor/glibc/blob/release/2.17/master/stdio-common/printf_fp.c) 中的代码是:

{% highlight c %}
unsigned int
__guess_grouping (unsigned int intdig_max, const char *grouping)
{
    unsigned int groups;

    /* We treat all negative values like CHAR_MAX.  */

    if (*grouping == CHAR_MAX || *grouping <= 0)
        /* No grouping should be done.  */
        return 0;
{% endhighlight %} 

由此可知是: `*grouping`操作导致了`read memory at address 0x0000000000000000`. 

但是搜索源码发现, 两处调用`__guess_grouping`的地方都有指针判空.

### 静态分析结论

1. 项目误将`double`类型使用`long double`类型格式化输出
1. 确定程序崩溃在函数`__guess_grouping`, 调用该函数的地方是在将`double`或`long double`转为字符串
1. 调用`__guess_grouping`的地方均有判空, 但出现了空指针访问

## 动态分析

静态分析陷入了死胡同, 于是搭建环境重现问题.

使用假大厅每100ms启动一个DS, 最多并存200个DS, 每个DS存活1分钟, 累计启动40808次, 其中8次Crash. (平均崩溃率:1.96‱)


看了多个core文件后, 发现的寄存器`rsi`的值都是:

    rsi            0x4460068200e6b654       4926945147773957716

这是一个无效的内存地址, 故而发生判空没问题, 但是读内存失败的问题.

通过查看文档[mpx-linux64-abi P20](https://software.intel.com/sites/default/files/article/402129/mpx-linux64-abi.pdf) 

**2. If the class is INTEGER or POINTER, the next available register of the sequence %rdi, %rsi, %rdx, %rcx, %r8 and %r9 is used.**

根据第二条可知: `%rdi` 对应的是 `intdig_max`, `%rsi` 对应的是 `grouping`. 

虽然`%rsi`是一个无效的地址, 但`%rdi`是对的:

    rdi            0x1      1

通过GDB查看上一层写入`%rsi`的内存, 发现其值也是也是该无效地址.

### 动态分析结论
1. 堆栈没有被破坏, 没有异常的函数调用
1. `grouping`在上一层中指针是一个无效指针, 导致判空失败和传入函数`__guess_grouping`后崩溃
1. **支线任务** 为何无效的指针在信号捕获时传参为空指针?
1. **支线任务** 错误的传参实际读到的是什么?

## 假设/验证

假设当传入特定`long double`时, `vswprintf`会引起Crash.

**验证思路:**`long double`是128位的, 用`union`将其转化为两个`int64_t`, 先对`int64_t`进行输出, 然后再调用`%Lf`输出`long double`.

**验证结果:** 成功找到一些数值, 可以将崩溃率从1.96‱提高到了30%, 以下为其中一个数值的演示代码:

{% highlight c %}
union long_double {
    long double d;

    struct {
        int64_t i1;
        int64_t i2;
    };
};

int main (void)
{
    long_double value;
    value.i1 = 140598190754240;
    value.i2 = 12912;

    printf("%Lf", value.d);
    return 0;
}
{% endhighlight %}

由此可以得出, glibc2.17存在bug, 在特定`long double`数值下, `printf`会导致程序Crash. 

在glibc官网有这样一个[Bug 4586 - printf crashes on some 'long double' values](https://sourceware.org/bugzilla/show_bug.cgi?id=4586)

该问题于`2007-06-02`被人发现过, 并且于`2007-06-08`被修复了

    * [BZ #4586]

    2007-06-06  Jakub Jelinek  <jakub@redhat.com>
        BZ #4586
        * sysdeps/i386/ldbl2mpn.c (__mpn_extract_long_double): Treat
        pseudo-zeros as zero.
        * sysdeps/x86_64/ldbl2mpn.c: New file.
        * sysdeps/ia64/ldbl2mpn.c: New file.

而我们的`glibc`版本是`libc-2.17.so`发布于`2012-12-25`?!

### 验证结论

1. 当特定的`long double`进行格式化输出时, `glibc`会导致崩溃
1. 该问题已于2007年修复, 但我们使用的版本是2012年发布的, 为什么还会Crash?
1. 导致Crash的long double是有效的浮点数吗?
1. **支线任务** 为什么会导致随机Crash(使用gdb运行不会Crash)
1. **支线任务** glibc在哪次提交修复了该问题

## 验证不同版本的`glibc`

使用`docker`针对不同版本的`glibc`做实验:

* `libc2.17`: `tlinux`(`libc2.17`-`157.tl2.2`)**会崩溃**
* `libc2.17`: `centos7`(`libc2.17`-`292.el7`)**会崩溃**(centos7最新版)
* `libc2.17`: `ubuntu:13.10`(`libc2.17`)**会崩溃**
* `libc2.19`: `ubuntu:14.04`(`libc2.19`)**会崩溃**
* `libc2.21`: `ubuntu:15.04`(`libc2.21`)**不会崩溃**
* `libc2.21`: `ubuntu:15.10`(`libc2.21`)**不会崩溃**
* `libc2.28`: `centos8`(`libc2.28`-`42.el8.1`)**不会崩溃**

由此可知, [BZ #4586](https://sourceware.org/bugzilla/show_bug.cgi?id=4586) 并没有在2007年被修复, 是在2.19(发布于2014-02-08)-2.21(发布于2015-02-06)的某个版本被修复的, 
`BZ #4586`有这样一行记录:[fweimer	2014-07-04 16:25:35 UTC	CC](https://sourceware.org/bugzilla/show_activity.cgi?id=4586)可以佐证这一假设.

## 导致Crash的`long double`是有效的浮点数吗?

{% highlight c %}
union ieee854_long_double
{
    long double d;
    struct
    {
        /* Together these comprise the mantissa.  */
        unsigned int mantissa3 : 32;
        unsigned int mantissa2 : 32;
        unsigned int mantissa1 : 32;
        unsigned int mantissa0 : 16;
        unsigned int exponent : 15;
        unsigned int negative : 1;
    } ieee;
};
{% endhighlight %}

根据long double的数据结构, 对导致Crash的70多个数值进行分析, 发现其`exponent`为0, 则浮点数的指数E等于1-16383(十进制 6.909499226981e-310#DEN	double)，是一个非常小的浮点数, **是合法的**。

## 总体结论

由于错误使用了格式化字符串, 导致触发了`glibc`老版本存在的bug.