---
layout: post
title: Unreal传输层协议-建立连接, 迁移连接
categories: [general]
tags: [unreal, socket]
---

## 背景

建立连接需要进行握手, 常见的方案有如下几种:
* TCP三次握手
* STCP四次握手
* QUIC 1RTT握手(这个需要篇幅较大, 建议自查资料)

### TCP三次握手

```mermaid
sequenceDiagram
    autonumber
    Client->>Server: SYN | SEQ.C
    Server->>Client: SYN-ACK | SEQ.C+1 | SEQ.S
    Client->>Server: ACK | SEQ.S+1 | SEQ.C+1
```

1. 客户端调用connect函数
1. 服务器下
1. 客户端connect函数返回, 客户端连接创建成功
1. 服务器accept函数返回, 服务端连接创建成功

Tcp的三次握手的问题是可能存在`SYN Flood 攻击`漏洞, 因为服务端接收到`SYN`后, 有的TCP实现会分配资源, 从而造成服务器性能下降.

### STCP四次握手

```mermaid
sequenceDiagram
    autonumber
    Client->>Server: INIT(Ta,J)
    Server->>Client: Ta:INIT ACK(Tz,K,Cookie C)
    Client->>Server: Tz:COOKIE ECHO C
    Server->>Client: Ta:COOKIE ACK
```
1. 客户端调用connect函数
1. 服务器下行状态Cookie, 
1. 客户端发送状态Cookie, 服务器接收后accept函数返回, 服务端连接创建成功
1. 客户端connect函数返回, 客户端连接创建成功

## Unreal传输层协议建立连接

Unreal传输层协议采用了类似STCP四次握手的方案.

```mermaid
sequenceDiagram
    autonumber
    Client->>Server: NotifyHandshakeBegin(HandshakePacket)
    Server->>Client: SendConnectChallenge(HandshakePacket)
    Client->>Server: SendChallengeResponse(HandshakePacket)
    Server->>Client: SendChallengeAck(HandshakePacket)
```

握手包数据结构如下

```mermaid
classDiagram
    UDPHeader <|-- HandshakePacket

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
通过[HMAC算法](https://en.wikipedia.org/wiki/HMAC)来校验`Cookie`是否正确:
```
Cookie=HMAC(SecretId, Timestamp, IP:Port)
```
校验通过后则进入下一个握手状态, 通过`Timestamp`的不同数值, 标识握手的三个状态.

```mermaid
stateDiagram-v2
    state Timestamp <<choice>>
    [*] --> Timestamp
    Timestamp --> 一次握手: if == 0
    Timestamp --> 二/三次握手 : if > 0
    Timestamp --> 四次握手 : if == -1
```

回到时序图, 状态如下:

```mermaid
sequenceDiagram
    autonumber
    Client->>Server: NotifyHandshakeBegin(HandshakePacke{Timestamp=0})
    Server->>Client: SendConnectChallenge(HandshakePacket{Timestamp>0})
    Client->>Server: SendChallengeResponse(HandshakePacket{Timestamp>0})
    Server->>Client: SendChallengeAck(HandshakePacket{Timestamp=-1})
```

当服务器发送SendChallengeAck时, 会同时在服务器创建连接, 当客户端收到ChallengeAck时, 认为连接成功.


## 迁移连接

服务器收到来自未知地址的UDP数据, 但不是握手包(`bHandshakePacket==0`), 则触发再次握手的请求.

```mermaid
sequenceDiagram
    Client-->>Server: 非握手包
    autonumber
    Server->>Client: SendRestartHandshakeRequest(RestartResponseDiagnosticsPacket)
    Client->>Server: NotifyHandshakeBegin(HandshakePacket)
    Server->>Client: SendConnectChallenge(HandshakePacket)
    Client->>Server: SendChallengeResponse(RestartResponsePacket)
    Server->>Client: SendChallengeAck(HandshakePacket)
```

和建立连接不同点是, 当SendChallengeResponse时, 发送的数据包类型为**RestartResponsePacket**, 
客户端收到**RestartResponsePacket**后切换状态为断线状态, 并重新发起握手.

```mermaid
classDiagram
    UDPHeader <|-- RestartResponseDiagnosticsPacket
    UDPHeader <|-- HandshakePacket
    HandshakePacket <|-- RestartResponsePacket

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

`RestartResponsePacket`比`HandshakePacket`多了`OrigCookie`, 
当服务器`SendChallengeAck`后, 通过`OrigCookie`寻找之前的连接, 将地址与之前的连接进行关联.
客户端收到SendChallengeAck后, 恢复为连接状态.
