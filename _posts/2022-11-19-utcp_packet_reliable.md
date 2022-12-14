---
layout: post
title: Unreal传输层协议---数据包
categories: [general]
tags: [unreal, socket]
---

完成握手环节后, 成功建立了连接, 传输Packet(数据包)进行数据通信, Packet由三部分数据组成:

* 当前PacketId
* 接收到的PacketId
* 应用层的数据: Bunch

PacketId是自增的数字, 即便重传应用层数据(Bunch), PacketId也会变大, 
当处理一个Packet后, 会保证小于等于该PacketId的Packet都丢弃掉.
所以可以由收到的`接收到的PacketID`推测出哪些Packet丢了, 从而重发Bunch.

## 当前PacketId

当前的PacketId, 在Packet中是一个14位的`uint`.
为了避免溢出问题, 需要根据上次接收到的PacketId, 得到完整的PacketId.

在`UE4.18`中, 收到一个`Packet`会立即处理.
在后续的版本中, 会把不连续的`Packet`做缓存, 在PostTick阶段, 清空缓存.
这个改动会减少当帧乱序收包问题.

// TODO 补充流程图 

## 接收到的PacketId

在`UE4.18`的版本, 会以`Ack标记+PacketId`的方式序列化, 
一个Packet中会有序的存放多个`AckPacketId`, 这样存储可能会占用大量的存储空间

// TODO 补充类图

在后续的版本中, 采用了位图的方式来进行优化.

## 应用层的数据: Bunch

Bunch的主要难点主要是分块的Bunch如何拼包的问题


doing

Unreal传输层抽象了几个名词:

* UNetConnection: 代表客户端和服务器的一条连接, 建立连接后, 客户端/服务器都会有对应的UNetConnection的对象
* UChannel: UNetConnection中有多个UChannel, UChannel之间数据不互相堵塞, 以此实现多路复用.
* Bunch: UChannel 接收和发送的数据类型, 由BunchHeader和Data组成, UChannel可以有自己的的编码协议(即Data的编解码由Channel决定)
* Packet: UNetConnection发送和接收的数据, 由PacketHeader和多个Bunch组成

当建立连接后, 服务器和客户端通过Cookie的前四个字节, 转化为服务器和客户端的序号(Seq), 收到和发送的Packet的序列号将以此开始.

```
int16_t* CurSequence = (int16_t*)Cookie;
int32_t LastServerSequence = *CurSequence & (MAX_PACKETID - 1);
int32_t LastClientSequence = *(CurSequence + 1) & (MAX_PACKETID - 1);
```

## Packet收包流程

```mermaid
classDiagram
    UDPHeader <|-- PacketHeader

    class UDPHeader{
      +bit MagicHeader[]
      +bit bHandshakePacket
    }
    class PacketHeader{
	    +uint32_t HistoryWordCount:4;
	    +uint32_t AckedSeq:14;
        +uint32_t Seq:14;
	    +uint32_t History[HistoryWordCount]; 
        +bit bHasPacketInfoPayload;
        +uint32_t PacketJitterClockTimeMS;
        +bit bHasServerFrameTime;
        +uint8_t FrameTimeByte;
    }
```

当接收到一个Packet包时, PacketHeader中的Seq是包的序号, 和UNetConnection之前的收到的序号(`FNetPacketNotify::InSeq`)计算差值PacketSequenceDelta(*注意要考虑溢出问题*):

```mermaid
graph TD
    PacketSequenceDelta{PacketSequenceDelta}
    bFlushingPacketOrderCache{bFlushingPacketOrderCache}
    ProcBunches[ProcBunches]
    End[End]
    PacketSequenceDelta -->|>1| bFlushingPacketOrderCache
    PacketSequenceDelta -->|=1| ProcBunches
    bFlushingPacketOrderCache -->|true| ProcBunches
    bFlushingPacketOrderCache -->|false| PacketOrderCache[PacketOrderCache]  --> End
    PacketSequenceDelta -->|<1| End
```

1. 当`PacketSequenceDelta=1`, 进入Bunches处理阶段
1. 当`PacketSequenceDelta<1`, 已经处理过该包或者更新的包, 直接丢弃
1. 当`PacketSequenceDelta>1`, 存在丢包, 此时分为两种情况:
    * 如果在收包阶段, 把包加入包有序缓存队列`PacketOrderCache`
    * 如果是清空有序缓存队列阶段(`bFlushingPacketOrderCache == true`), 进入Bunches处理阶段

## Bunch收包流程


```mermaid
classDiagram
    class Bunch{
        +bit bControl;
        +bit bOpen;
        +bit bClose;
        +uint8_t CloseReason : 4;
        +uint32_t ChIndex;

        +bit bHasPackageMapExports;
        +bit bHasMustBeMappedGUIDs;
        +bit bPartial;
        +bit bPartialInitial;
        +bit bPartialFinal;

        +bit bHardcoded;
		+uint32_t NameIndex;
        +uint32_t BunchDataBits;
        +bit Data[BunchDataBits];
    }
```
Bunch的序列化数据中存在大量的位操作, 以及采用额外的标志位, 减少整体的传输, 比如说对于某个Channel而言, 通常只有一个Bunch的bOpen=1包, 一个bClose=1的包,和N个bOpen=0且bClose=0等于0的包,
如果使用一个bControl字段, 当bOpen和bClose有一个为1时, 存储三位, 分别标识bControl=1, bOpen=0/1, bClose=0/1, 当都为0时, 仅存储bControl=0, 则大多数情况下能节省流量.