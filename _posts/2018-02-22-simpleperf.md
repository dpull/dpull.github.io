---
layout: post
title: 使用Simpleperf进行Android性能分析
categories: [general]
tags: []
---

`Unity`内置对`Profiler`是基于标签统计实现的，存在统计不全的问题，如我的某次统计中`FixUpdate`的统计，占总体性能的46%，但其中只有不到7%是有更详细统计的，所以需要一些更详细读性能剖析工具进行分析，在`iOS`上可以使用`Xcode`的`TimeProfiler`来分析，在`Android`上，`AndroidStudio`内置的性能剖析工具主要是针对Java应用，第三方的有`Intel Vtune Amplifier`的Android版安装失败，`Snapdragon  prefiler`的`Sampling Capture`是对`Simpleperf`的封装，对我们游戏支持不好。

## Simpleperf简单介绍

Simpleperf是Android NDK中内置读性能分析工具（NDK r13b 开始），在[Android文档](https://developer.android.com/ndk/guides/simpleperf.html)中对其用法有简单介绍，但这个文档已经过时，
更准确的文档存在于其[代码库的doc](https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/)中。

Simpleperf的原理，简单来说，现代CPU一般都带有一个叫做性能监视单元（PMU）的组件，这个硬件能够记录诸如CPU周期数、执行的指令数、缓存失效次数等等关键信息；Linux内核对这个硬件做了一层封装，通过`perf_event_open`系统调用把接口暴露给用户空间；这就是simpleperf工具的由来。

## Simpleperf 常用法

Simpleperf 常用法分为record和report两个功能。做法是在Android机器上运行Simpleperf程序的record功能，然后将输出文件同步到PC上，使用report功能分析数据。

提供了app_profiler.py和report.py，report_sample.py等封装了Simpleperf常见的用法，简化命令行的难度。

### record 功能
对于游戏而言，因为启动时间较长，通常是直接截取运行中的数据，所以需要加上-nc选项，避免启动游戏。

有两种获取堆栈信息的方法，一种是基于dwarf的call graph 使用 -g 选项，另外一种是基于stack frame的call graph 使用 --call-graph fp 选项。不同的CPU支持的类型不同，优先尝试基于dwarf的，如果不支持，再尝试基于stack frame的。

    python app_profiler.py -p com.dpull.test -nc -r "-g --duration 10"
    python app_profiler.py -p com.dpull.test -nc -r "--call-graph fp --duration 10"

### report 功能

Simpleperf 提供了简单的GUI来查看数据（--gui选项），使用-g选项可以查看热点的堆栈，不使用可以看热点函数

    python report.py --gui -g --symfs /Volumes/Data/git/TestUnity/Symbol

这里重点说一下--symfs选项，它需要文件路径一致。例如上述命令 /data/app/com.dpull.test-1/lib/arm/libil2cpp.so 的符号文件要存在于 /Volumes/Data/git/TestUnity/Symbol/data/app/com.dpull.test-1/lib/arm/libil2cpp.so

Unity5.6.5后，Android il2cpp版本的符号表不再存在于apk中的libil2cpp.so中了，会存在于apk的同级目录下的*.symbols.zip文件中，有个libil2cpp.sym的文件，要将它改名为libil2cpp.so放入上述路径进行分析


