---
layout: post
title: GCC隐藏ELF符号
categories: [general]
tags: []
---

GCC 默认是将所有符号导出的,如果想隐藏符号,通常有两种做法:

## 使用`version-script`

export_symbols 内容

    {
        global:
            SceneModule*;
            CreatePhysWorld;
        local: *;
    };

Cmake增加 

    set (CMAKE_SHARED_LINKER_FLAGS ${CMAKE_SHARED_LINKER_FLAGS} "-Wl,--version-script=" ${CMAKE_SOURCE_DIR} "/export_symbols")

存在问题

符号的全名中存在路径信息, 如果需要覆盖进程空间的符号时, 可能会覆盖失败.

## 使用`-fvisibility=hidden`

使用编译选项`-fvisibility=hidden`, 在函数前增加前缀`__attribute__ ((visibility ("default")))`

不过如果so中有链接静态库, 静态库的仍会导出符号, 可使用以下方式:

    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fPIC -fvisibility=hidden -Wl,--exclude-libs=ALL -ffunction-sections")
