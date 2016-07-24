---
layout: post
title: 位域(Bit-fields)跨平台的问题
categories: [general]
tags: []
---

常见的`Bit-fields`有两种，一种是微软的(`MSVC`)，一种是非微软的(`GCC`, `Clang`)，它们大多数情况下相同，当声明的类型和位数不一致时不同。

`GCC`, `Clang` 提供了编译选项 `-mno-ms-bitfields` 或者编译指令 `#pragma ms_struct on` 来兼容`MSVC`的`Bit-fields`。

举个例子，`uint64_t uSelectable : 8`只用了8位，其大小是不同的，注释中标明了内存布局。

	#pragma	pack(1)
	// sizeof(S2C_SYNC_NEW_PLAYER)	 = sizeof(uint8_t) + sizeof(uint16_t)
	// uSelectable | uSyncSN | uSyncSN
	struct S2C_SYNC_NEW_PLAYER 
	{
		uint64_t    uSelectable : 8;
		uint16_t    uSyncSN;
	};

	#pragma ms_struct on
	// sizeof(S2C_SYNC_NEW_PLAYER_MS)	 = sizeof(uint64_t) + sizeof(uint16_t)
	// uSelectable | 0 | 0 | 0 | uSyncSN | uSyncSN
	struct S2C_SYNC_NEW_PLAYER_MS 
	{
	    uint64_t    uSelectable : 8;
	    uint16_t    uSyncSN;
	};
	#pragma ms_struct reset
	#pragma	pack()
	
`Bit-fields`主要用于网络协议，所以其`ABI`需要保持一致，所以通常将其指定为`MSVC`格式，但建议不要使用位域。