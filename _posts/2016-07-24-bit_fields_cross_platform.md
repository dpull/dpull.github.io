---
layout: post
title: 位域(Bit-fields)跨平台的问题
categories: [general]
tags: []
---

常见的`Bit-fields`有两种，一种是微软的(`MSVC`)，一种是非微软的(`GCC`, `Clang`)，它们大多数情况下相同，当声明的类型和使用的位数不一致时可能不同。

`GCC`, `Clang` 提供了编译选项 `-mms-bitfields` 或者编译指令 `#pragma ms_struct on` 来兼容`MSVC`的`Bit-fields`。

举个例子，`uint64_t uSelectable : 7`只使用7位，其内存大小在两类编译器下是不同的，注释中标明了内存布局。

{% highlight cpp %}
#pragma	pack(1)
// sizeof(S2C_SYNC_NEW_PLAYER) = sizeof(uint8_t) + sizeof(uint16_t)
// uSelectable | uSyncSN | uSyncSN
struct S2C_SYNC_NEW_PLAYER 
{
	uint64_t uSelectable : 7;
	uint16_t uSyncSN;
};

#pragma ms_struct on
// sizeof(S2C_SYNC_NEW_PLAYER_MS) = sizeof(uint64_t) + sizeof(uint16_t)
// uSelectable | 0 | 0 | 0 | 0 | 0 | 0 | 0 | uSyncSN | uSyncSN
struct S2C_SYNC_NEW_PLAYER_MS 
{
    uint64_t uSelectable : 7;
    uint16_t uSyncSN;
};
#pragma ms_struct reset
#pragma	pack()
{% endhighlight %}
	
`Bit-fields`主要用于网络协议，需要保证内存布局一致，所以通常将其指定为`MSVC`格式。

为了避免这种跨平台问题，强烈建议协议中不要使用`Bit-fields`。