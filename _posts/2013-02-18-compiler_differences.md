---
layout: post
title: 编译器差异
categories: [general]
tags: []
---

和纯峰一起开始研究手游，本文记录一些编译器差异，主要是针对的一些我们用到的非标准的内容。

## char 的类型是什么 ##
在《编程精粹》“第6章 风险事业” 中提到：

> ANSI 标准忽视了一个非常重要的方面,它没有定 义象 char、int 和 long 这样一些内部数据类型。
> ANSI 标准将这些重要的实现细节留给编译 程序的研制者来决定,标准本身并没有具体定义这些类型。
> 
> 例如,某一个 ANSI 标准的编泽程序可能具有 32 位的 int 和 char。它们在缺省状态下 是有符号的;
> 而另一个 ANSI 标准的编译程序可能有 16 位的 int 和 char,缺省状态下是无符号的。
> 尽管如此不同,然而,这两个编译程序可能都严格附合ANSI 标准。

在X86机器的常见编译器上，char通常是signed char，如vc，gcc；
但是在ARM机器上，char默认是unsigned char。
详细见文档 [C Library ABI for the ARM® Architecture](http://infocenter.arm.com/help/topic/com.arm.doc.ihi0039d/IHI0039D_clibabi.pdf):

> 5.6 inttypes.h This C99 header file refers only to types and values standardized by the AEABI. 
> It declares only constants and real functions whose type signatures involve only primitive types. 
> **Note that plain char is unsigned [AAPCS].**
> This header does not define _AEABI_PORTABLE (§5.1.1)

这个问题在 ndk 上可以通过 `Android.mk` 中的 `LOCAL_CFLAGS := -fsigned-char` 来指定。


## 数据对齐问题 ##

ARM处理器的内存访问，要求数据对齐，
即存取“字（Word）”数据时要求四字节对齐，地址的bits[1：0]＝＝0b00；
存取“半字（Halfwords）”时要求两字节对齐，地址的bit[0]＝＝0b0；
存取“字节（Byte）”数据时要求该数据按其自然尺寸边界（Natural Size Boundary）定位。

{% highlight c++ %}
// 以前处理二进制常用写法，在手机上应用会宕掉。
dwLen = *(DWORD*)pbyPos;

// 修改后的写法
memcpy(&dwLen, pbyPos, sizeof(dwLen));
{% endhighlight %}	

**参考文档:**

1. [ARM C C++内存对齐](http://blog.csdn.net/ctthuangcheng/article/details/27203049)
1. [对ARM处理器的内存对齐问题](http://blog.csdn.net/xcysuccess3/article/details/8308274)

## 获取时区 ##
	
{% highlight lua %}
function GetGMTSec()
	local tbTime = os.date("*t", 0);
	return (tbTime.hour * 3600 + tbTime.min * 60 + tbTime.sec);
end
{% endhighlight %}

以上这个函数是lua中获取时差（秒数），它在windows和linux运行是正确的，但在mac osx上结果是错误的，修改为：

{% highlight lua %}
function GetGMTSec()
	if not _nGMTSec then
		local nTime = os.time();
		local tbUtcDate = os.date("!*t", nTime); 
		local nUtcTime = os.time(tbUtcDate);

		_nGMTSec = os.difftime(nTime, nUtcTime);
	end
	return _nGMTSec;
end
{% endhighlight %}	
