---
layout: post
title: udp 能不能bind INADDR_ANY 
categories: [general]
tags: []
---

tcp 可以 bind INADDR_ANY(0.0.0.0) 用来绑定所有网卡的某个端口, udp 能不能这样呢?

udp bind INADDR_ANY 是不会出错的,也是可以正常收包的(recvfrom), 但如果是多网卡, 会存在sendto时不能保证从哪张网卡出包,导致丢包

## TODO

1. 选网卡进行sendto的算法是什么?
1. 如果多网卡都可以到达目标机器,会不会丢包(从A网卡recvfrom,使用B网卡sendto)