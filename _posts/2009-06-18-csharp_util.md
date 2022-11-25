---
layout: post
title: C#小工具
categories: [general, dotnet, kit]
tags: [csharp]
---

备忘，备忘。

==========

## 动态创建子类 ##

常用于工厂模式。要求每一种子类都有相同的构造函数，并且都在相同的程序集中
我常在程序加载数据和处理网络通信协议的使用时候这个函数

{% highlight c# %}
// 作用 根据基类 和 子类型的type字符串创建一个子类的实例        
// 要确保要创建的对象类型和 T在一个程序集中       
// 继承于Ｔ的类名字
// 该类的构造函数参数       
// 该类的构造函数参数       
// 成功返回 类实例，失败返回null
public static T Create(string typename, Type[] types, object[] parameters)
{
    Assembly assembly = typeof(T).Assembly;
    Type type = assembly.GetType(typename);

    if (type == null)
        return default(T);

    ConstructorInfo constructor = type.GetConstructor(types);
    if (constructor == null)
        return default(T);

    T result = (T)constructor.Invoke(parameters);
    return result;
}
{% endhighlight %}

## 生成对象的深层副本 ##
和Object.MemberwiseClone 方法 相对

{% highlight c# %}
public static T Clone(T item)       
{
    MemoryStream ms = new MemoryStream();            
    BinaryFormatter bf = new BinaryFormatter();
    bf.Serialize(ms, item);
    ms.Seek(0, SeekOrigin.Begin);
    return (T)bf.Deserialize(ms);
}
{% endhighlight %}

## 事件响应 ##
《.NET设计规范》一书中讲到的，不过该函数存在编译警告。

{% highlight c# %}
//警告    8   CA1030
public static void Raise(EventHandler hander, object sender, TEventArgs args) where TEventArgs : EventArgs
{
    //.net设计规范 P128
    EventHandler eventHander = hander;
    if (eventHander != null)
    {
        eventHander(sender, args);
    }
}
{% endhighlight %}

## 二进制协议解析 ##

{% highlight c# %}
[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct PatchFileHeader
{
    public byte byDeleteFile;
    public byte byInPackage;
    public Int32 nFileModifyTime;
    public Int32 uFileNameLen;   // uFileNameLen 的长度包含'\0'
    public Int32 uFileDataLen;

    public static PatchFileHeader Convert(byte[] bytes, int offset)
    {
        int size = Marshal.SizeOf(typeof(PatchFileHeader));
        if (offset + size > bytes.Length)
            throw new ArgumentOutOfRangeException("offset");

        unsafe
        {
            fixed (byte* pbytes = bytes)
            {
                return (PatchFileHeader)Marshal.PtrToStructure((IntPtr)(pbytes + offset), typeof(PatchFileHeader));
            }
        }
    }
}
{% endhighlight %}
    