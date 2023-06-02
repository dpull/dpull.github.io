---
layout: post
title: 位域的内存布局
categories: [general]
tags: [c++]
---

## 字节序(Byte Order)

字节序（Byte Order）是指计算机系统在存储多字节数据（如：16位、32位、64位整数等）时，在内存中的存储顺序。字节序主要有两种：大端序（Big Endian）和小端序（Little Endian）。

### 小端序（Little Endian）
小端序是指数据的低字节存储在内存中的低地址处，而数据的高字节存储在内存的高地址处。在同样一个例子中，一台小端序的计算机系统中，一个32位整数数值0x12345678将被存储为：

|             	|      	|      	|      	|      	|              	|
|-------------	|------	|------	|------	|------	|--------------	|
| Low Address 	| 0x78 	| 0x56 	| 0x34 	| 0x12 	| High Address 	|

### 大端序（Big Endian）
大端序是指数据的高字节存储在内存中的低地址处，而数据的低字节存储在内存的高地址处。例如，在一台大端序的计算机系统中，一个32位整数数值0x12345678将被存储为：

|             	|      	|      	|      	|      	|              	|
|-------------	|------	|------	|------	|------	|--------------	|
| Low Address 	| 0x12 	| 0x34 	| 0x56 	| 0x78 	| High Address 	|

### 大小端数据转换

只需要将字节顺序进行逆序即可实现大小端数据转换。

## 位域(Bit-field)

位域（Bit-field）是一种特殊的C语言结构体成员类型，它允许以位（bit）为单位来表示一个数据成员。位域在节省内存空间方面有优越性，特别是对于一些仅需要表示一定取值范围内的变量时，位域可以大大降低内存占用。

定义位域时，需要在结构体中声明按位定义的字段，并指定所占据的位数。例如：

{% highlight c %}
#pragma pack(push)
#pragma pack(1)
struct {
    uint16_t field1 : 6; /* field1是一个6位的无符号整数位域 */
    uint16_t field2 : 10; /* field2是一个10位的无符号整数位域 */ 
} myVar;
#pragma pack(pop)
{% endhighlight %}

在上面的例子里，`field1` 和 `field2` 不再占据整个2字节（或者说16比特）的无符号整数，而是仅分别占用6位和10位的内存空间。


## 位域的内存布局

因为字节序的缘故, 位域的内存布局是什么样的呢? 测试程序

{% highlight c %}
#pragma pack(push)
#pragma pack(1)
union bit_field_test
{
	struct {
		uint32_t field1 : 6;
		uint32_t field2 : 7;
		uint32_t field3 : 14;
		uint32_t field4 : 5;
	};
	uint32_t i;
	uint8_t  b[4];
};
#pragma pack(pop)

int main(int argc, char** argv)
{

	union bit_field_test test;
	test.field1 = 1;
	test.field2 = 2;
	test.field3 = 3;
	test.field4 = 4;

    printf("size=%d\n", (int)sizeof(test));

	printf("b=%d, %d, %d, %d\n", (int)test.b[0], (int)test.b[1], (int)test.b[2], (int)test.b[3]);

	printf("i=%d, bits=", test.i);
	for (int i = 0; i < 32; i++)
	{
		uint32_t mask = 1 << i;
        printf(test.i & mask ? "1" : "0");
	}
	printf("\n");

	return 0;
}   
{% endhighlight %}


### 小端序（Little Endian）

程序输出:

{% highlight bash %}
size=4
i=536895617, bits=00100000000000000110000010000001
b=129, 96, 0, 32
{% endhighlight %}

|             	| 0      	| 1 	| 2 	| 3 	| 4 	| 5 	| 6      	| 7 	| 8  	| 9 	| 10 	| 11 	| 12 	| 13     	| 14 	| 15 	| 16 	| 17 	| 18 	| 19 	| 20 	| 21 	| 22 	| 23 	| 24 	| 25 	| 26 	| 27     	| 28 	| 29 	| 30 	| 31 	|              	|
|-------------	|--------	|---	|---	|---	|---	|---	|--------	|---	|----	|---	|----	|----	|----	|--------	|----	|----	|----	|----	|----	|----	|----	|----	|----	|----	|----	|----	|----	|--------	|----	|----	|----	|----	|--------------	|
| Low Address 	| 1      	| 0 	| 0 	| 0 	| 0 	| 0 	| 0      	| 1 	| 0  	| 0 	| 0  	| 0  	| 0  	| 1      	| 1  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0      	| 0  	| 1  	| 0  	| 0  	| High Address 	|
|             	| 0x81    	|   	|   	|   	|   	|   	|        	|   	| 0x60 	|   	|    	|    	|    	|        	|    	|    	| 0x00 	|    	|    	|    	|    	|    	|    	|    	| 0x20 	|    	|    	|        	|    	|    	|    	|    	|              	|
|             	| field1 	|   	|   	|   	|   	|   	| field2 	|   	|    	|   	|    	|    	|    	| field3 	|    	|    	|    	|    	|    	|    	|    	|    	|    	|    	|    	|    	|    	| field4 	|    	|    	|    	|    	|              	|


### 大端序（Big Endian）

大端机很少, 用模拟器实现:

{% highlight bash %}
docker run -it asmimproved/qemu-mips
mips-linux-gnu-gcc -std=c99 -static -mips32 a.c 
qemu-mips a.out
{% endhighlight %}


程序输出:
{% highlight bash %}
size=4
b=4, 16, 0, 100
i=68157540, bits=00100110000000000000100000100000
{% endhighlight %}


|             	| 31     	| 30 	| 29 	| 28 	| 27 	| 26 	| 25     	| 24 	| 23 	| 22 	| 21 	| 20 	| 19 	| 18     	| 17 	| 16 	| 15 	| 14 	| 13 	| 12 	| 11 	| 10 	| 9 	| 8 	| 7   	| 6 	| 5 	| 4      	| 3 	| 2 	| 1 	| 0 	|              	|
|-------------	|--------	|----	|----	|----	|----	|----	|--------	|----	|----	|----	|----	|----	|----	|--------	|----	|----	|----	|----	|----	|----	|----	|----	|---	|---	|-----	|---	|---	|--------	|---	|---	|---	|---	|--------------	|
| Low Address 	| 0      	| 0  	| 0  	| 0  	| 0  	| 1  	| 0      	| 0  	| 0  	| 0  	| 0  	| 1  	| 0  	| 0      	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0  	| 0 	| 0 	| 0   	| 1 	| 1 	| 0      	| 0 	| 1 	| 0 	| 0 	| High Address 	|
|             	| 0x04     	|    	|    	|    	|    	|    	|        	|    	| 0x10 	|    	|    	|    	|    	|        	|    	|    	| 0x00 	|    	|    	|    	|    	|    	|   	|   	| 0x64 	|   	|   	|        	|   	|   	|   	|   	|              	|
|             	| field1 	|    	|    	|    	|    	|    	| field2 	|    	|    	|    	|    	|    	|    	| field3 	|    	|    	|    	|    	|    	|    	|    	|    	|   	|   	|     	|   	|   	| field4 	|   	|   	|   	|   	|              	|


### 结论
1. 域结构体字段的排布仍然按照从低地址到高地址的顺序。
1. 对于每一个字段，按照字节序排布。

## 跨平台的位域代码

写跨平台的位域代码时，需要考虑内存布局问题。对于大小端不同的机器，变量的定义顺序应当反过来。

以上述代码为例，如果想要在跨平台的环境下使用，需要对`bit_field_test`结构体的定义进行修改：

{% highlight c %}
#pragma pack(push)
#pragma pack(1)
union bit_field_test
{
	struct {
#if __BYTE_ORDER__==__ORDER_BIG_ENDIAN__
		uint32_t field1 : 6;
		uint32_t field2 : 7;
		uint32_t field3 : 14;
		uint32_t field4 : 5;
#elif __BYTE_ORDER__==__ORDER_LITTLE_ENDIAN__
		uint32_t field4 : 5;
		uint32_t field3 : 14;
		uint32_t field2 : 7;
		uint32_t field1 : 6;
#endif        
	};
	uint32_t i;
	uint8_t  b[4];
};

int main(int argc, char** argv)
{

	union bit_field_test test;
	test.field1 = 1;
	test.field2 = 2;
	test.field3 = 3;
	test.field4 = 4;

	return 0;
}  
#pragma pack(pop)
{% endhighlight %}

在大端序机器上，test.i的值为:68157540(0x04100064)，即`0x04 0x10 0x00 0x64`。将此数据传输到小端序机器后, 需要将它转换为小端序的`uint32`类型，即`0x64 0x00 0x10 0x04`。
其寄存器数据将变为：

{% highlight c %}
寄存器(0<-->31)
0010 0110 0000 0000 0000 1000 0010 0000

field4 -> 00100 -> 4
field3 -> 11000000000000 -> 3
field2 -> 0100000 -> 2 
field1 -> 100000 -> 1
{% endhighlight %}


