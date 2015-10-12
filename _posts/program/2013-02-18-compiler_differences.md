---
layout: post
title: 编译器差异
categories: [general]
tags: []
---

和纯峰一起开始研究手游，本文记录一些编译器差异，主要是针对的一些我们用到的非标准的内容。

## 字节对齐问题 ##
若读/写非对齐的数据，一些微处理器不做处理，读出来或写进去的可能只是随机数； 还有一些微处理器，会使程序崩溃。

```C++
// 以前处理二进制常用写法
dwLen = *(DWORD*)pbyPos;

// 修改后的写法
memcpy(&dwLen, pbyPos, sizeof(dwLen));
```	

## 0大小的数组大小 ##

```C++
#pragma pack(1) 
struct TG_PROTOCOL_BODY 
{ 
	char szText[0]; 
}; 
#pragma pack()
// 0大小的数组是非标准的C
// sizeof(TG_PROTOCOL_BODY) 在vc下是1，在xcode下是0
```

## 获取时区 ##
	
```Lua
function GetGMTSec()
	local tbTime = os.date("*t", 0);
	return (tbTime.hour * 3600 + tbTime.min * 60 + tbTime.sec);
end
```

以上这个函数是lua中获取时差（秒数），它在windows和linux运行是正确的，但在mac osx上结果是错误的，修改为：

```Lua
function GetGMTSec()
	if not _nGMTSec then
		local nTime = os.time();
		local tbUtcDate = os.date("!*t", nTime); 
		local nUtcTime = os.time(tbUtcDate);

		_nGMTSec = os.difftime(nTime, nUtcTime);
	end
	return _nGMTSec;
end
```	
