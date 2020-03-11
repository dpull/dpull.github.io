---
layout: post
title: 探秘大小端[未完待续]
categories: [general]
tags: []
---

抄点书上的内容

## 建立大端试验环境

目前支持大端的环境越来越少, 就拿[debian](https://www.debian.org/ports/)举例, 目前仅剩`mips`支持大端序, 而且也计划要终止了.

[qemu](https://www.qemu.org/)是纯软件实现虚拟机, 可以用它来模拟不同的cpu.

### 下载操作系统

从下载[debian mips netboot](http://ftp.debian.org/debian/dists/stable/main/installer-mips/current/images/malta/netboot/)中下载`initrd.gz`和`vmlinux-4.19.0-8-4kc-malta`两个文件

### 创建虚拟机

    # macOS用brew或MacPorts安装, Windows下载安装, Linux用yum或apt-get安装
    brew install qemu 
    # 创建虚拟机磁盘
    qemu-img create mips-big-endian.img 4g 
    # 通过网络安装操作系统
    qemu-system-mips -m 2048 mips-big-endian.img -initrd initrd.gz -kernel vmlinux-4.19.0-8-4kc-malta -nographic 
    # 启动操作系统
    qemu-system-mips -m 2048 mips-big-endian.img

## 试验字节序

    union byte_tentative {
        unsigned int i;
        unsigned short sa[2];
        struct {
            unsigned char c0;
            unsigned char c1;
            unsigned char c2;
            unsigned char c3;
        };
    };
    byte_tentative.i = 0x1020304

在小端机器上:

| c0    | c1   | c2    | c3   |
|-------|------|-------|------|
| 0x04  | 0x03 | 0x02  | 0x01 |
| sa[0]=0x304| | sa[1]=0x102| |
| i=0x1020304| |       |      |

在大端机器上:

| c0    | c1   | c2    | c3   |
|-------|------|-------|------|
| 0x01  | 0x02 | 0x03  | 0x04 |
| sa[0]=0x102| | sa[1]=0x304| |
| i=0x1020304| |       |      |

## 试验位域

    union bit_tentative {
        unsigned short s;
        unsigned char ca[2];
        struct {
            unsigned short s1 : 1;
            unsigned short s2 : 2;
            unsigned short s3 : 3;
            unsigned short s4 : 4;
        };
    };

    bit_tentative.s1 = 0b1;
    bit_tentative.s2 = 0b10;
    bit_tentative.s3 = 0b100;
    bit_tentative.s4 = 0b1000;

在小端机器上:

| s1:1               | s2:2 | s3:3  | s4:4       | s5:6     |
|--------------------|------|-------|------------|----------|
| 0b1                | 0b10 | 0b100 | 0b1000     | 0b000000 |
| c0                 |      |       | c1         |          |
| 0b00100101         |      |       |            |0b00000010|
| i                  |      |       |            |          |
| 0b0000001000100101 |      |       |            |          |
    
在大端机器上:

| s1:1               | s2:2 | s3:3  | s4:4       | s5:6     |
|--------------------|------|-------|------------|----------|
| 0b1                | 0b10 | 0b100 | 0b1000     | 0b000000 |
| c0                 |      |       | c1         |          |
| 0b11010010         |      |       | 0b00000000 |          |
| i                  |      |       |            |          |
| 0b1101001000000000 |      |       |            |          |




