---
layout: post
title: likely(x) 与 unlikely(x)
categories: [general]
tags: [C/C++]
---

[原文](https://kernelnewbies.org/FAQ/LikelyUnlikely) 

## 它们是什么 ？

在linux内核代码，在条件判断时经常看到`likely()` 和 `unlikely()`，例如：


{% highlight c %}
bvl = bvec_alloc(gfp_mask, nr_iovecs, &idx);
if (unlikely(!bvl)) {
  mempool_free(bio, bio_pool);
  bio = NULL;
  goto out;
}
{% endhighlight %}

在这里，调用likely()或unlikely()告诉编译器这个条件很有可能或者不太有可能发生，好让编译器对这个条件判断进行正确地优化。这两个宏在include/linux/compiler.h文件中可以找到：

{% highlight c %}
#define likely(x)       __builtin_expect(!!(x), 1)
#define unlikely(x)     __builtin_expect(!!(x), 0)
{% endhighlight %}

在GCC文档中可找到上述代码中__builtin_expect的说明，摘录如下：

{% highlight c %}
 -- Built-in Function: long __builtin_expect (long EXP, long C)
     You may use `__builtin_expect' to provide the compiler with branch
     prediction information.  In general, you should prefer to use
     actual profile feedback for this (`-fprofile-arcs'), as
     programmers are notoriously bad at predicting how their programs
     actually perform.  However, there are applications in which this
     data is hard to collect.

     The return value is the value of EXP, which should be an integral
     expression.  The value of C must be a compile-time constant.  The
     semantics of the built-in are that it is expected that EXP == C.
     For example:

          if (__builtin_expect (x, 0))
            foo ();

     would indicate that we do not expect to call `foo', since we
     expect `x' to be zero.  Since you are limited to integral
     expressions for EXP, you should use constructions such as

          if (__builtin_expect (ptr != NULL, 1))
            error ();

     when testing pointer or floating-point values.
{% endhighlight %}

## 做了什么

编译器优化时，根据条件跳转的预期值，按正确地顺序生成汇编代码，把“很有可能发生”的条件分支放在顺序执行指令段，而不是jmp指令段（jmp指令会打乱CPU的指令执行顺序，大大影响CPU指令执行效率）。

举例说明。下面这个简单的C程序使用`gcc -O2`进行编译。

{% highlight c %}
#define likely(x)    __builtin_expect(!!(x), 1)
#define unlikely(x)  __builtin_expect(!!(x), 0)

int main(char *argv[], int argc)
{
   int a;

   /* Get the value from somewhere GCC can't optimize */
   a = atoi (argv[1]);

   if (unlikely (a == 2))
      a++;
   else
      a--;

   printf ("%d\n", a);

   return 0;
}
{% endhighlight %}

使用`objdump -S`反汇编，查看它的汇编代码。

{% highlight nasm %}
080483b0 <main>:
 // Prologue
 80483b0:       55                      push   %ebp
 80483b1:       89 e5                   mov    %esp,%ebp
 80483b3:       50                      push   %eax
 80483b4:       50                      push   %eax
 80483b5:       83 e4 f0                and    $0xfffffff0,%esp
 //             Call atoi()
 80483b8:       8b 45 08                mov    0x8(%ebp),%eax
 80483bb:       83 ec 1c                sub    $0x1c,%esp
 80483be:       8b 48 04                mov    0x4(%eax),%ecx
 80483c1:       51                      push   %ecx
 80483c2:       e8 1d ff ff ff          call   80482e4 <atoi@plt>
 80483c7:       83 c4 10                add    $0x10,%esp
 //             Test the value
 80483ca:       83 f8 02                cmp    $0x2,%eax
 //             --------------------------------------------------------
 //             If 'a' equal to 2 (which is unlikely), then jump,
 //             otherwise continue directly, without jump, so that it
 //             doesn't flush the pipeline.
 //             --------------------------------------------------------
 80483cd:       74 12                   je     80483e1 <main+0x31>
 80483cf:       48                      dec    %eax
 //             Call printf
 80483d0:       52                      push   %edx
 80483d1:       52                      push   %edx
 80483d2:       50                      push   %eax
 80483d3:       68 c8 84 04 08          push   $0x80484c8
 80483d8:       e8 f7 fe ff ff          call   80482d4 <printf@plt>
 //             Return 0 and go out.
 80483dd:       31 c0                   xor    %eax,%eax
 80483df:       c9                      leave
 80483e0:       c3                      ret
{% endhighlight %}

在上面程序中，用likely()代替其中的unlikely()，重新编译，再来看它的汇编代码：

{% highlight nasm %}
080483b0 <main>:
 //             Prologue
 80483b0:       55                      push   %ebp
 80483b1:       89 e5                   mov    %esp,%ebp
 80483b3:       50                      push   %eax
 80483b4:       50                      push   %eax
 80483b5:       83 e4 f0                and    $0xfffffff0,%esp
 //             Call atoi()
 80483b8:       8b 45 08                mov    0x8(%ebp),%eax
 80483bb:       83 ec 1c                sub    $0x1c,%esp
 80483be:       8b 48 04                mov    0x4(%eax),%ecx
 80483c1:       51                      push   %ecx
 80483c2:       e8 1d ff ff ff          call   80482e4 <atoi@plt>
 80483c7:       83 c4 10                add    $0x10,%esp
 //             --------------------------------------------------
 //             If 'a' equal 2 (which is likely), we will continue
 //             without branching, so without flusing the pipeline. The
 //             jump only occurs when a != 2, which is unlikely.
 //             ---------------------------------------------------
 80483ca:       83 f8 02                cmp    $0x2,%eax
 80483cd:       75 13                   jne    80483e2 <main+0x32>
 //             Here the a++ incrementation has been optimized by gcc
 80483cf:       b0 03                   mov    $0x3,%al
 //             Call printf()
 80483d1:       52                      push   %edx
 80483d2:       52                      push   %edx
 80483d3:       50                      push   %eax
 80483d4:       68 c8 84 04 08          push   $0x80484c8
 80483d9:       e8 f6 fe ff ff          call   80482d4 <printf@plt>
 //             Return 0 and go out.
 80483de:       31 c0                   xor    %eax,%eax
 80483e0:       c9                      leave
 80483e1:       c3                      ret
{% endhighlight %}

## 如何使用

在一个条件判断语句中，当这个条件被认为是非常非常有可能满足时，则使用`likely()`宏，否则，条件非常非常不可能或很难满足时，则使用`unlikely()`宏。