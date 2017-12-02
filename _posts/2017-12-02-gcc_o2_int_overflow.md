---
layout: post
title: 整型溢出检查被GCC优化掉的问题
categories: [general]
tags: []
---
## 问题
skynet最近有一个issue [cluster中session溢出问题](https://github.com/cloudwu/skynet/issues/773)，用简单代码模拟一下：（以下代码运行在：`gcc version 5.4.0 20160609 (Ubuntu 5.4.0-6ubuntu1~16.04.4)`）

{% highlight c %}
int main() {
	int32_t a = INT32_MAX - 5;
	while (++a > 0)
		printf("%d\n", a);
	return 0;
}
{% endhighlight %}

gcc -O 后，输出：

	2147483643
	2147483644
	2147483645
	2147483646
	2147483647

gcc -O2 后，死循环：

	2147483643
	2147483644
	2147483645
	2147483646
	2147483647
	-2147483648
	-2147483647
	-2147483646
	-2147483645
	-2147483644
	.....

为什么开启`O2`优化后，程序死循环了？看一下汇编代码

{% highlight asm %}
;gcc -O
main:
.LFB23:
	.cfi_startproc
	pushq	%rbx
	.cfi_def_cfa_offset 16
	.cfi_offset 3, -16
	movl	$2147483643, %ebx
.L2:
	movl	%ebx, %edx
	movl	$.LC0, %esi
	movl	$1, %edi
	movl	$0, %eax
	call	__printf_chk
	addl	$1, %ebx
	cmpl	$-2147483648, %ebx
	jne	.L2
	movl	$0, %eax
	popq	%rbx
	.cfi_def_cfa_offset 8
	ret
	.cfi_endproc
.LFE23:
{% endhighlight %}


{% highlight asm %}
;gcc -O2
main:
.LFB23:
	.cfi_startproc
	pushq	%rbx
	.cfi_def_cfa_offset 16
	.cfi_offset 3, -16
	movl	$2147483642, %ebx
	.p2align 4,,10
	.p2align 3
.L2:
	addl	$1, %ebx
	movl	$.LC0, %esi
	movl	$1, %edi
	movl	%ebx, %edx
	xorl	%eax, %eax
	call	__printf_chk
	jmp	.L2
	.cfi_endproc
.LFE23:
{% endhighlight %}


对比可以看出，O2的情况下，编译器优化掉了`int32_t`上溢检查的代码，所以出现了死循环。（这个问题在`MSVC`和`Clang`下不存在）

## 解决
针对这个问题，反馈问题的同学建议使用`volatile`限定符，这种方案可以避免此类优化，但用在这儿并不合适。

>volatile限定符告知计算机，代理（而不是变量所在的程序）可以改变该变量的值。通常它被用于硬件地址以及在其他程序或同时运行的线程中共享数据。
>-- C Primer Plus(第六版) 12.5.2 

一种正确的方案是将其转化为更高精度的数值，做上限的检查，如unsigned int32_t或 int64_t。
