---
layout: post
title: 浮点型 float double
categories: [general]
tags: [note]
---

float 是单精度浮点类型；double 是双精度浮点类型。

## 存储结构 ##

存储方式是用科学计数法来存储数据的。

**科学记数法** 是一种以记下极大或极小数字的方法。
在科学记数法中，一个数被写成一个1与10之间的实数（尾数）与一个10的幂的积，
为了得到统一的表达方式，该尾数并不包括10：

	782300=7.823×10^5
	0.00012=1.2×10^-4
	10000=1×10^4
        
在电脑或计算器中一般用E或e（英语Exponential）来表示10的幂：

    7.823E5=782300
    1.2e-4=0.00012
        

采用二进制浮点算法的 IEC 60559:1989 (IEEE 754) 标准。[IEEE 754](http://zh.wikipedia.org/wiki/IEEE_754)

Type     | Sign     | Exponent    | Mantissa
float    | 1 bit    | 8 bit       | 23 bit
double   | 1 bit    | 11 bit      | 52 bit


Sign(符号位) ： 0代表正，1代表负。 Exponent(指数)： 

指数偏移值(exponentbias)，是指浮点数表示法中的指数域的编码值为指数的实际值加上某个固定的值，
IEEE 754标准规定该固定值为 2^e-1 - 1，其中的e为存储指数的位元的长度。
如:float指数是8 bit，固定偏移值是2^8-1 - 1 = 128−1 = 127。
单精度浮点数的指数部分实际取值是从128到-127。
例如指数实际值为17，在单精度浮点数中的指数域编码值为144， 即144 = 17 +
127。 Mantissa(尾数)： [#MSDN\_IEEE\_754]* 被存储为 1.XXX...
形式的二进制分数。此分数有一个大于或等于 1 且小于 2 的值。
注意实数总是以规范化形式存储；即尾数左移以使尾数的高序位总是 1。
因为该位总是 1，所以存储尾数时，只存储 XXX... 。

如，十进制浮点数120.5的二进制形式为1111000.1，转换为科学计数法形式为(1.1110001)\*(2^6)，
指数偏移值为6+127，尾数为1110001。尾数则直接填入，如果空间多余则以0补齐，如果空间不够则0舍1入。
所以十进制浮点数120.5的float类型存储如下（二进制）：

Sign    | Exponent          | Mantissa
0       | 1000 0101         | 111 0001 0000 0000 0000 0000 
0       | 6+127=133         | 110 1101 


**在线演示** [IEEE-754 Analysis](http://babbage.cs.qc.cuny.edu/IEEE-754/)
该网页已经无法访问, 可使用[源码](https://github.com/cvickery/IEEE-754)自行搭建.


## 取值范围 ##

在Microsoft Visual C++ 中取值范围如下：

Type Name                  | Bytes     | Range of Values
__int32                    | 4         | –2,147,483,648 to 2,147,483,647
unsigned __int32           | 4         | 0 to 4,294,967,295
__int64                    | 8         | –9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
unsigned __int64           | 8         | 0 to 18,446,744,073,709,551,615
**float**                  | 4         | 3.4E +/- 38 (7 digits)
**double**                 | 8         | 1.7E +/- 308 (15 digits) *<---这个指15 个十进制位*

## 比较浮点数相等 ##

[MSDN文档](http://msdn.microsoft.com/zh-cn/library/c151dt3s\(v=VS.80\).aspx)
浮点十进制值通常没有完全相同的二进制表示形式。这是 CPU所采用的浮点数据表示形式的副作用。
为此，可能会经历一些精度丢失，并且一些浮点运算可能会产生意外的结果。导致此行为的原因是下面之一：

    * 十进制数的二进制表示形式可能不精确。
    * 使用的数字之间类型不匹配（例如，混合使用浮点型和双精度型）。  

为解决此行为，大多数程序员或是确保值比需要的大或者小，或是获取并使用可以维护精度的二进制编码的十进制
(BCD) 库。 浮点值的二进制表示形式影响浮点计算的精度和准确性。

## 忽略精度 ##
建议采用的一种方法是定义两个值之间可接受的差值幅度(例如.000001)，而不是比较其是否相等。
如果两个值之间的绝对差值小于或等于该幅度，则差值可能是因精度差异而产生的，因此这两个值可能相等。
下面的示例使用此方法比较 .33333 和 1/3。

{% highlight c %}
#define EPSILON         .000001   // Define your own tolerance
#define FLOAT_EQ(x,v)   (((v - EPSILON) < x) && (x <( v + EPSILON)))

double double1 = .3333333;
double double2 = (double) 1/3;

if (FLOAT_EQ(double1, double2))
    printf("double1 and double2 are equal.");
else
    printf("double1 and double2 are unequal.");
    
if (fabs(double1 - double2) < .000001)
    printf("double1 and double2 are equal.");
else
    printf("double1 and double2 are unequal.");
{% endhighlight %}
            
    对于 EPSILON，可以使用常数 FLT_EPSILON（为浮点型定义为 1.192092896e-07F）或者 DBL_EPSILON（为双精度型定义为 2.2204460492503131e-016）。
        

## 直接降低精度 ##
[参考文档](http://www.codingnow.com/2004/board/view.php?paster=412&reply=0)

比如想对 double d 降低精度，只需要做 

{% highlight c %}
*((__int64*)&d)&=~0xf; 
{% endhighlight %}

0xf 是可调整的，这一句就是把尾数最后几位清为 0 而已。
**PS:** 感觉这种做法的精度有问题.对于指数大于53的应当存在很大的误差。

## 浮点型转整型 ##

> 当float转为整型值时，小数部分被舍弃。如果浮点数的值过于庞大，无法容纳于整型值中，那么其结果将是未定义的。 *《C与指针》* 

从尾数位数来看，double可是表示54位二进制，所以__int32-->double-->__int32，是没有误差的;
但__int64超出这个范围，其互转就不精确了。

*lua中number是用double存储的，在脚本和C API的交互时，经常出现int、double互转。
PS:在lua使用lua_pushnumber(DWORD)写入，则对应的要使用(DWORD)lua_tonumber()读取。
当lua_pushnumber(DWORD)写入但采用(DWORD)lua_tointeger读取的时候，当数值大于INT_MAX时，会出现数据错误。*    

## ftol的一种实现方式 ##
[参考文档](http://blog.codingnow.com/2005/12/_ftol_opt.html)

ftol 的整数指令版本

{% highlight c %}
int ftol(float f)
{ 
    int a         = *(int*)(&f);
    int sign      = (a>>31); 
    int mantissa  = (a&((1<<23)-1))|(1<<23);
    int exponent  = ((a&0x7fffffff)>>23)-127;
    int r         = ((unsigned int)(mantissa)<<8)>>(31-exponent);
    return ((r ^ (sign)) - sign ) &~ (exponent>>31);       
}
{% endhighlight %}
           
**更多ftol的实现和比较可参考**  [代码优化－之－优化浮点数取整](http://blog.csdn.net/housisong/article/details/1616026)

## lua中double to int 的实现 ##

{% highlight c %}
union luai_Cast { double l_d; long l_l; };
#define lua_number2int(i,d) \
  { volatile union luai_Cast u; u.l_d = (d) + 6755399441055744.0; (i) = u.l_l; }
{% endhighlight %}

**分析**

[参考文档 ](http://blog.codingnow.com/2006/02/double_to_int_magic_number.html)

    这个宏神奇的在正数和负数的双精度浮点数时都可以正确工作，以四舍五入方式转换为 32 位整数。
    这个数字是 1.5*2^52，
    小于 2^31 的数字在和这个magic number 相加的时候，
    按浮点加法的规则（以科学计数法记数），和一定按幂大的一个对齐。
    而 1.5 是2进制的 1.1 在浮点标准中，小数点前的 1 是不需要记录的。
    这样，double 的前四字节就被空出来。而需要转换的整数将因为加法恰当的被置入对应的位置。


## 单精度浮点数(float)各种极值情况 ##
	* 符号位可以为0或1 。

类别                 | 正负号   	| 实际指数     	| 有偏移指数      | 指数域         	| 尾数域                             | 数值
零                	| 0        	| -127         	| 0            	| 0000 0000      	| 000 0000 0000 0000 0000 0000      | 0.0
负零              	| 1        	| -127         	| 0            	| 0000 0000      	| 000 0000 0000 0000 0000 0000      | -0.0
1                 	| 0       	| 0            	| 127          	| 0111 1111      	| 000 0000 0000 0000 0000 0000      | 1.0
-1                	| 1       	| 0            	| 127          	| 0111 1111      	| 000 0000 0000 0000 0000 0000      | -1.0
最小的非规约数    	    | *        	| -127         	| 0           	| 0000 0000      	| 000 0000 0000 0000 0000 0001      | ±2^-23 × 2^-126 = ±2^-149 ≈ ±1.4E-45
中间的非规约数    	    | *        	| -127         	| 0            	| 0000 0000      	| 100 0000 0000 0000 0000 0000      | ±2^-1 × 2^-126 = ±2^-127 ≈ ±5.88E-39
最大的非规约数    	    | *        	| -127         	| 0            	| 0000 0000      	| 111 1111 1111 1111 1111 1111      | ±(1?2^-23) × 2^-126 ≈ ±1.18E-38
最小的规约数        	| *        	| -126         	| 1            	| 0000 0001      	| 000 0000 0000 0000 0000 0000      | ±2^-126 ≈ ±1.18E-38
最大的规约数      	    | *        	| 127          	| 254          	| 1111 1110      	| 111 1111 1111 1111 1111 1111      | ±(2-2^-23) × 2^127 ≈ ±3.4E38 
正无穷           	    | 0        	| 128          	| 255          	| 1111 1111      	| 000 0000 0000 0000 0000 0000      | +∞
负无穷           	    | 1        	| 128          	| 255          	| 1111 1111      	| 000 0000 0000 0000 0000 0000      | -∞
NaN               	| *        	| 128          	| 255          	| 1111 1111      	| non zero                          | NaN


## 更多文档 ##

[浮点数的精度和转换](http://user.qzone.qq.com/12628201/blog/1163397920)

[浮点精度问题](http://user.qzone.qq.com/1229431/blog/1292249537)

       
