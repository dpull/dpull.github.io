---
layout: post
title: 轻松入门VC++.Net
categories: [general, dotnet]
tags: [c]
---

网络上关于VC++.Net介绍的资料很少，经过一段时间的摸索，
我初步了解了VC++.Net，本文就VC++.Net入门做一些简单介绍！

**本文适用人群：** 了解C++语法，了解.NET类库。

----------

## 为什么要使用托管C++？ ##

大家可能都有这个疑问，毕竟写.NET程序最好用C#，C++.NET这个不论不类的东西为什么要存在呢？
其实原因很简单，就是兼容以前的代码！通俗点说，就是为了省钱！
如果有个多年积累下来的C++类库，但现在的项目想移植到.NET上，为了节省人力财力，
最简便的办法就是用C++.NET。

## 基本类型 ##
C++类型（本机类型）和.NET Framework类型对应，
在托管C++里面使用这些类型就相当于使用后面的.NET Framework类型。

C++ 类型 								| .NET Framework 类型
---  									| --- 		
bool 									| System.Boolean
signed char								| System.SByte
unsigned char                           | System.Byte
unsigned char                           | System.Byte
wchar_t                                 | System.Char
double, long double                     | System.Double
float                                   | System.Single
int, signed int, long, signed long      | System.Int32
unsigned int, unsigned long             | System.UInt32
__int64, signed __int64                 | System.Int64
unsigned __int64                        | System.UInt64
short, signed short                     | System.Int16
unsigned short                          | System.UInt16
void                                    | System.Void


## 运算符^ ##
用来指向托管堆的对象句柄。
运算符^和指针运算符\*很类似。

操作             	| 运算符^         	| 运算符*
--- 			    | ---             	| --- 	
创建              	| gcnew           	| new
销毁              	| 无              	| delete
访问成员          	| ->              	| ->
判空              	| nullptr         	| NULL
 
```C++
List^ result = gcnew List();
result->Add("www.dpull.com");   
```

## 引用运算符 ##
因为.NET Framework中只有out关键字，所以C++.NET的引用在C#中看来就是out

C++             | C#              | C++.NET
--- 			  	| ---         | --- 	
&               | ref, out        | %

```C++
bool TryGet(String^% value);  
```
       
## 托管数组声明和托管泛行声明 ##

```C++
    array^ data;
    array^ names;
    List^ result; 
```
        
## 新增for each关键字 同C#的foreach ##

```C++
array^data =ms->ToArray();        
for each (byte b in data)        
{            
	ret->AppendFormat("{0:X2}", b);        
}
```

## 类和结构声明 ##
使用C++语法声明的class 或者 struct为本机代码（非托管代码）。

.NET Framework中类型分为两类：引用类型和 值类型。

引用类型 声明为ref class 或 ref struct

值类型 声明为 value class 或 value struct

继承，和C++的继承类似

```C++
public ref class PluginRunException : public Exception   
	{    
public:        
	PluginRunException(){}        
	PluginRunException(String^ message):Exception(message){}    
};
```

## 重载 ##

```C++
    virtual String^ ToString() override;
```

## .NET 异常 ##

```C++
    throw gcnew ArgumentNullException("dllName");
```

## 事件(event) ##

```C++
    delegate void ClickEventHandler(int, double);
    event ClickEventHandler^ OnClick;
```

## 托管和非托管交互 ##
托管类中允许出现非托管成员变量，但非托管类中不允许出现托管成员变量。

无论托管函数还是非托管函数，甚至是全局函数，都允许出现托管成员变量。

## 引用命名空间和添加dll引用 ##
可以在C++的Project通用属性页上配置引用的dll，也可以直接写入代码，
举例说明：

```C++
using namespace System;
using namespace System::Text;
using namespace System::Data;
using namespace System::Data::SqlClient;
```

## 遇到servprov.h中IServiceProvider报错 ##


> error C2872: “IServiceProvider”: 不明确的符号 c:filesvisual studio 8.h
> 
> error C2872: 'IServiceProvider' : ambiguous symbol c:filesvisual studio
8.h

**原因：** servprov.h中定义了IServiceProvider，.Net中存在
System::IServiceProvider，造成了重复定义。

**修改办法：**

*第一种办法:* 修改头文件位置，把include 的头文件放在using namespace
System;前面。

*第二种办法:* 修改代码

```C++
//Line 93 in servprov.h is:typedef 
IServiceProvider *LPSERVICEPROVIDER;

//Change this to:
#ifdef __cplusplustypedef
    ::IServiceProvider *LPSERVICEPROVIDER;
#else 
    typedef IServiceProvider *LPSERVICEPROVIDER;
#endif
```

## 字符串互转 ##

**非托管字符串转托管字符串**

```C++
char *psz = "www.886s.com";
String^ result = gcnew String(psz);
```

**托管字符串转非托管字符串**

```C++
class Common    
{     
public:         
    static void MarshalString(System::String ^sSource, TCHAR szDest[], int nDestSize);         
    static void MarshalString_A(System::String ^sSource, char szDest[], int nDestSize);         
    static void MarshalString_W (System::String ^sSource, wchar_t szDest[], int nDestSize);     
};    

void Common::MarshalString_A(System::String ^sSource, char szDest[], int nDestSize)    
{        
    using namespace System::Runtime::InteropServices;        

    char* szSource = (char*)(Marshal::StringToHGlobalAnsi(sSource)).ToPointer();   
    assert(szSource);    

    strncpy(szDest, szSource, nDestSize);        
    szDest[nDestSize - 1] = '\0';      

    Marshal::FreeHGlobal(System::IntPtr((void*)szSource));    
}    

void Common::MarshalString_W (System::String ^sSource, wchar_t szDest[], int nDestSize)    
{        
    using namespace System::Runtime::InteropServices;        

    wchar_t* szSource = (wchar_t*)(Marshal::StringToHGlobalUni(sSource)).ToPointer();
    assert(szSource);        

    wcsncpy(szDest, szSource, nDestSize);        
    szDest[nDestSize - 1] = '\0';        

    Marshal::FreeHGlobal(System::IntPtr((void*)szSource));    
}    

void Common::MarshalString(System::String ^sSource, TCHAR szDest[], int nDestSize)    
{
#ifdef UNICODE 
    MarshalString_W(sSource, szDest, nDestSize);
#else        
    MarshalString_A(sSource, szDest, nDestSize);#endif    
}
```

# Windows Phone8相关 #
2014/06/25

手游时代来临，这一在游戏行业看似鸡肋的技术又有了用武之地。使用了Windows Runtime (WinRT) 的新api，编译选项变为了 /ZW， 它和/clr 并不完全兼容（[详情](http://msdn.microsoft.com/en-us/magazine/jj651569.aspx)），我感受到的几点：

1. /clr 的 gcnew 变为了 /ZW 的 ref new
1. System::String 变为了 Platform::String
1. UI控件在Platform下没有了，必须写写C#代码了
1. 不能继承C++.net的类了，不过可以用接口或者委托，下面有个接口的示例
    
C++代码

```C++
public interface class  XWebViewBase
{
	void Navigate(Platform::String^ url);
};

public ref class XWebViewBaseBridge sealed
{
public:
	static void SetInstance(XWebViewBase^ instance)
	{
		m_WebViewBase = instance;
	}

	static XWebViewBase^ GetInstance()
	{
		return m_WebViewBase;
	}

private:
	property static XWebViewBase^ m_WebViewBase;
};
```

C#代码

```C#
public class XWebView : XWebViewBase
{
    public void Navigate(string url)
    {
    }
}
```
