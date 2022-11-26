---
layout: post
title: Unreal传输层协议-建立连接
categories: [general]
tags: [unreal, socket]
---

UDP是无连接的协议, 可靠传输的前提是要建立连接, 所以在应用程序上模拟三次握手, 建立连接.

```mermaid
  flowchart  TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
```
