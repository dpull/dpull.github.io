---
layout: post
title: 优化so大小
categories: [general]
tags: []
---

在使用UE的Program做一些扩展, 会引入大量的无用代码, 导致so非常大.

## 精简动态符号表

采用[GCC隐藏ELF符号](./2017-05-06-gcc_hidden_symbols)的方案, 控制全局的符号可见性.

## 移除无用代码

### 开启LTO

LTO 是 `Link Time Optimization` 的缩写, 即链接期优化.

LTO 能够在链接目标文件时检测出 DeadCode 并删除它们, 从而减小编译产物的体积.DeadCode 举例: 某个 if 条件永远为假, 那么 if 为真下的代码块就可以移除.
进一步地, 被移除代码块所调用的函数也可能因此而变为 DeadCode, 它们又可以被移除.

能够在链接期做优化的原因是, 在编译期很多信息还不能确定, 只有局部信息, 无法执行一些优化.但是链接时大部分信息都确定了, 相当于获取了全局信息, 所以可以进行一些优化.

GCC 和 Clang 均支持 LTO.LTO 方式编译的目标文件中存储的不再是具体机器的指令, 而是机器无关的中间表示(GCC 采用的是 GIMPLE 字节码, Clang 采用的是 LLVM IR 比特码).

CMake 项目的配置方式: 

{% highlight cmake %}
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -flto")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -flto")
{% endhighlight %}

如果项目工程依赖了静态库, 可以使用 LTO 方式重新编译该静态库, 那么编译动态库时, 就能移除静态库中的 DeadCode, 从而减小最终 so 的体积.

### 开启 GC sections

这是传递给链接器的参数, GC 即 `Garbage Collection`(垃圾回收), 也就是对无用的 section 进行回收.注意, 这里的 section 不是指最终 so 中的 section, 而是作为链接器的输入的目标文件中的 section.

简要介绍下目标文件, 目标文件(扩展名 .o)也是 ELF 文件, 所以也是由 section 组成的, 只不过它只包含了相应源文件的内容: 函数会放到 .text 样式的 section 中, 一些可读写变量会放到 .data 样式的 section 中, 等等.

链接器会把所有输入的目标文件的同类型的 section 进行合并, 组装出最终的 so 文件.

GC sections 参数通知链接器: 仅保留动态符号(及 .init_array 等)直接或者间接引用到的 section, 移除其他无用 section.这样就能减小最终 so 的体积.

但开启 GC sections 还需要考虑一个问题: 编译器默认会把所有函数放到同一个 section 中, 把所有相同特点的数据放到同一个 section 中, 如果同一个 section 中既有需要删除的部分又有需要保留的部分, 会使得整个 section 都要保留.

所以我们需要减小目标文件 section 的粒度, 这需要借助另外两个编译参数 `-fdata-sections` 和 `-ffunction-sections` , 这两个参数通知编译器, 将每个变量和函数分别放到各自独立的 section 中, 这样就不会出现上述问题了.

CMake 项目的配置方式: 

{% highlight cmake %}
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fdata-sections -ffunction-sections")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fdata-sections -ffunction-sections")
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections")
{% endhighlight %}
