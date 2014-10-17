---
layout: post
title: 字节对齐
categories: [general]
tags: [c]
---

## 字节对齐 ##

    {% highlight C %}
    struct TestStruct1
    { 
        double doub; 
        char ch; 
        int i; 
    };
    
    int main()
    {
        cout << sizeof(TestStruct1) << endl;
     
        return 0;
    }
    {% endhighlight %}

`sizeof(TestStruct1)`为多少呢？也许你会这样求： 

    sizeof(TestStruct1) = sizeof(double) + sizeof(char) + sizeof(int) = 13

但是当在VC中测试上面结构的大小时，你会发现`sizeof(TestStruct1)`为16。

----------

其实，这是VC对变量存储的一个特殊处理。
**为了提高CPU的存储速度，VC对一些变量的起始地址做了“对齐”处理。(字节对齐)
在默认情况下，VC规定各成员变量存放的起始地址相对于结构的起始地址的偏移量必须为该变量的类型所占用的字节数的倍数。**

常用类型的对齐方式（Win32） 

	
	类型		| 对齐方式（变量存放的起始地址相对于结构的起始地址的偏移量）
	---  	| --- 	 
	char    | 偏移量必须为sizeof(char)即1的倍数
	int	    | 偏移量必须为sizeof(int)即4的倍数
	double	| 偏移量必须为sizeof(double)即8的倍数
	short	| 偏移量必须为sizeof(short)即2的倍数

**各成员变量在存放的时候根据在结构中出现的顺序依次申请空间，同时按照上面的对齐方式调整位置，空缺的字节VC会自动填充。
同时VC为了确保结构的大小为结构的字节边界数（即该结构中占用最大空间的类型所占用的字节数）的倍数，
所以在为最后一个成员变量申请空间后，还会根据需要自动填充空缺的字节。**

    {% highlight C %}
    struct TestStruct1
    {
        // 先为第一个成员分配空间，其起始地址和结构的起始地址相同, 偏移量为0是sizeof(double)的倍数, 
        // 该成员变量占用sizeof(double)=8个字节
        double doub; 
    
        // 再为第二个成员分配空间，其起始地址对于结构的起始地址的偏移量为8，是sizeof(char)的倍数，
        // 该成员变量占用sizeof(char)=1个字节
        char ch;    
    
        // 最后为第三个成员分配空间，其起始地址对于结构的起始地址的偏移量为9，是sizeof(int)的倍数，
        // 其起始地址的偏移量调整为12，该成员变量占用sizeof(int)=4个字节
        int i;          
    };
    
    struct TestStruct2
    {
        // 偏移量为0，满足对齐方式，ch占用1个字节；
        char ch;       
    
        //下一个可用的地址的偏移量为1，不是sizeof(double)的倍数，需要补足7个字节才能使偏移量变为8，
        // 自动填充7个字节，doub存放在偏移量为8的地址上，它占用8个字节。   
        double doub;    
    
        //下一个可用的地址的偏移量为16，是sizeof(int)的倍数，满足int的对齐方式，
        // 所以不需要自动填充，i存放在偏移量为16的地址上，它占用4个字节。
        int i;          
    
    };
    //所有成员变量都分配了空间，空间总的大小为1+7+8+4=20，不是结构的节边界数
    //（即结构中占用最大空间的类型所占用的字节数sizeof(double)）的倍数，
    // 所以需要填充4个字节，以满足结构的大小为 sizeof(double)的倍数。
    // sizeof(TestStruct2)为 1 + 7 + 8 + 4 + 4 = 24。
    {% endhighlight %}       

## 禁用字节对齐 ##
VC中提供了 **#pragma pack(n)** 来设定变量以n字节对齐方式。
n字节对齐就是说变量存放的起始地址的偏移量有两种情况：

1. 如果n大于等于该变量所占用的字节数，那么偏移量必须满足默认的对齐方式，
1. 如果n小于该变量的类型所占用的字节数，那么偏移量为n的倍数，不用满足默认的对齐方式。

**结构总大小约束条件：**
如果n大于所有成员变量类型所占用的字节数，那么结构的总大小必须为占用空间最大的变量占用的空间数的倍数；
否则必须为n的倍数。

    {% highlight C %}
    #pragma pack(push)     //保存对齐状态 
    #pragma pack(4)        //设定为4字节对齐 
    struct TestStruct2 
    { 
        char ch; 
        double doub; 
        int i; 
    }; 
    #pragma pack(pop)    //恢复对齐状态
    
    // sizeof(TestStruct2) => 16
    {% endhighlight %} 