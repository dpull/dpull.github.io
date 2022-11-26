---
layout: post
title: Unreal传输层协议-建立连接
categories: [general]
tags: [unreal, socket]
---

UDP是无连接的协议, 可靠传输的前提是要建立连接, 所以在应用程序上模拟三次握手, 建立连接.

```mermaid
sequenceDiagram
    Client->>+Server: NotifyHandshakeBegin
    Server->>+Client: SendConnectChallenge
    Client->>+Server: SendChallengeResponse
    Server->>+Client: SendChallengeAck
```

握手包数据结构如下

```mermaid
classDiagram
    UDPHeader <|-- HandshakePacket
    HandshakePacket <|-- RestartResponsePacket
    UDPHeader <|-- RestartResponseDiagnosticsPacket

    class UDPHeader{
      +bit MagicHeader[]
      +bit bHandshakePacket
    }
    class HandshakePacket{
      +bit bRestartHandshake
      +bit SecretId
      +double Timestamp
      +char Cookie[]
    }
```

服务端实现了无状态的握手处理模块, 
通过[HMAC算法](https://en.wikipedia.org/wiki/HMAC)来校验`Cookie`是否正确(`Cookie=HMAC(SecretId, Timestamp, IP:Port)`).
通过`Timestamp`的不同数值, 表示握手的三个状态.

```mermaid
stateDiagram-v2
    state if_state <<choice>>
    [*] --> Timestamp
    Timestamp --> if_state
    if_state --> 第一次握手: if == 0
    if_state --> 第二次握手 : if > 0
    if_state --> 第三次握手 : if == -1
```


完整数据结构


```mermaid
classDiagram
    UDPHeader <|-- HandshakePacket
    HandshakePacket <|-- RestartResponsePacket
    UDPHeader <|-- RestartResponseDiagnosticsPacket

    class UDPHeader{
      +bit MagicHeader[]
      +bit bHandshakePacket
    }
    class HandshakePacket{
      +bit bRestartHandshake
      +bit SecretId
      +double Timestamp
      +char Cookie[]
    }
    class RestartResponsePacket{
      +char OrigCookie[]
    }
    class RestartResponseDiagnosticsPacket{
      +bit bRestartHandshake
    }
```
