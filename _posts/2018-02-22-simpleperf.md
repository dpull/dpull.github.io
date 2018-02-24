---
layout: post
title: 使用Simpleperf进行Unity Android性能分析
categories: [general]
tags: []
---

`Unity`内置的`Profiler`是基于标签统计实现的，存在统计不全的问题。
如我的某次统计中`FixUpdate`占总体性能的46%，但其中只有不到7%是有更详细的分析，所以需要一些更强力的性能剖析工具进行分析。

在`iOS`上可以使用`Xcode`的`TimeProfiler`来分析，在`Android`上，`AndroidStudio`内置的性能剖析工具主要是针对Java应用，第三方的有`Intel Vtune Amplifier`的Android版只能用于Intel CPU，`Snapdragon  prefiler`的`Sampling Capture`是对`Simpleperf`的封装，对我们游戏支持不好。

## Simpleperf简单介绍

`Simpleperf`是`Android NDK`中内置读性能分析工具（`NDK r13b` 开始），在[Android文档](https://developer.android.com/ndk/guides/simpleperf.html)中对其用法有简单介绍，但这个文档已经过时，
更准确的文档存在于其[代码库的doc](https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/)中。

`Simpleperf`的原理，简单来说，现代CPU一般都带有一个叫做性能监视单元（PMU）的组件，这个硬件能够记录诸如CPU周期数、执行的指令数、缓存失效次数等等关键信息；Linux内核对这个硬件做了一层封装，通过`perf_event_open`系统调用把接口暴露给用户空间；这就是`Simpleperf`工具的由来。

## Simpleperf 常用法

`Simpleperf`常用法分为record和report两个功能。做法是在Android机器上运行`Simpleperf`程序的record功能，然后将输出文件同步到PC上，使用report功能分析数据。

提供了app_profiler.py和report.py，report_sample.py等封装了`Simpleperf`常见的用法，简化命令行的难度。

### record 功能
对于游戏而言，因为启动时间较长，通常是直接截取运行中的数据，所以需要加上-nc选项，避免启动游戏。

有两种获取堆栈信息的方法，一种是基于`dwarf`的`call graph` 使用`-g`选项，另外一种是基于`stack frame`的`call graph` 使用`--call-graph fp`选项。不同的CPU支持的类型不同，优先尝试基于`dwarf`的，如果不支持，再尝试基于`stack frame`的。

`-lib` 选项用于so的符号表不存在于APK内的时候, Unity5.6.5后，Android il2cpp版本的符号表不再存在于apk中的libil2cpp.so中了，会存在于apk的同级目录下的*.symbols.zip文件中，有个libil2cpp.sym的文件，要将它改名为libil2cpp.so放入-lib制定路径进行分析。

`-nb` 选项是指不需要从设备拉取符号，同版本的应用第二次运行可使用该选项，同时不设置`-lib`，这样可以减少push调试符号到设备上，从流程上缩减。

    python app_profiler.py -p com.dpull.test -nc -r "-g --duration 10" -lib /Volumes/Data/git/TestUnity/Symbol
    python app_profiler.py -p com.dpull.test -nc -r "-g --duration 10" -nb
    python app_profiler.py -p com.dpull.test -nc -r "--call-graph fp --duration 10" -lib /Volumes/Data/git/TestUnity/Symbol
    python app_profiler.py -p com.dpull.test -nc -r "--call-graph fp --duration 10" -nb

### report 功能

`Simpleperf`提供了简单的GUI来查看数据（--gui选项），使用-g选项可以查看热点的堆栈，不使用可以看热点函数

    python report.py --gui -g
    
### Suggestions about recording call graphs
elow is our experiences of dwarf based call graphs and stack frame based call graphs.

dwarf based call graphs:
1. Need support of debug information in binaries.
2. Behave normally well on both ARM and ARM64, for both fully compiled Java code and C++ code.
3. Can only unwind 64K stack for each sample. So usually can't show complete flame-graph. But
   probably is enough for users to identify hot places.
4. Take more CPU time than stack frame based call graphs. So the sample frequency is suggested
   to be 1000 Hz. Thus at most 1000 samples per second.

stack frame based call graphs:
1. Need support of stack frame registers.
2. Don't work well on ARM. Because ARM is short of registers, and ARM and THUMB code have different
   stack frame registers. So the kernel can't unwind user stack containing both ARM/THUMB code.
3. Also don't work well on fully compiled Java code on ARM64. Because the ART compiler doesn't
   reserve stack frame registers.
4. Work well when profiling native programs on ARM64. One example is profiling surfacelinger. And
   usually shows complete flame-graph when it works well.
5. Take less CPU time than dwarf based call graphs. So the sample frequency can be 4000 Hz or
   higher.

So if you need to profile code on ARM or profile fully compiled Java code, dwarf based call graphs
may be better. If you need to profile C++ code on ARM64, stack frame based call graphs may be
better. After all, you can always try dwarf based call graph first, because it always produces
reasonable results when given unstripped binaries properly. If it doesn't work well enough, then
try stack frame based call graphs instead.

以上文档说针在ARM64对C++ code采用stack frame模式比较好，但我在小米5等高通的ARM64 CPU上测试，dwarf模式更好。

