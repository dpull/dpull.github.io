---
layout: post
title: Console.Write写大量字符串异常
categories: [general]
tags: [C#]
---

Console.Write 大约写2G字符后就会抛出：

> Must complete Convert() operation or call Encoder.Reset() before calling GetBytes() or GetByteCount(). 
> Encoder 'Chinese Simplified (GB2312)' fallback 'System.Text.InternalEncoderBestFitFallback'.
> 
> 必须首先完成 Convert() 操作或调用 Encoder.Reset()，然后才能调用 GetBytes() 或 GetByteCount()。
> 编码器; 简体中文(GB2312)”回退; System.Text.InternalEncoderBestFitFallback”。

从堆栈上来是System.Text.DBCSCodePageEncoding.GetBytes函数执行出错！所以这个bug并不仅仅影响Console.Write，对于写文本文件(StreamWriter)同样会出现！
在网上搜索了一下，似乎亚洲字符都有这个问题，Big5
日文JIS都存在相关的提问，用VS2005和VS2008测试了一下，都存在这个问题.

## 解决方案 ##
- 当使用StreamWriter.Write等类似的文件流写入函数时,获取文件大小,当接近2G时,关闭流,以追加方式打开继续写
- 使用WriteConsole取代Console.Write

示例如下: 

{% highlight c# %}
  public static class ConsoleEx
  {
     public static IntPtr OutHandle
     {
         get
         {
             if (outHandle == IntPtr.Zero)
                 outHandle = GetStdHandle(StdHandle.STD_OUTPUT_HANDLE);
  
             return outHandle;
         }
     }
  
     public static void Write(string value)
     {
         if (OutHandle == IntPtr.Zero)
             return;
  
         int numberOfCharsWritten;
         char[] valueArray = value.ToCharArray();
         WriteConsole(outHandle, valueArray, valueArray.Length, out numberOfCharsWritten, 0);
     }
  
     public static void Write(string format, params Object[] arg)
     {
         Write(string.Format(format, arg));
     }
  
     public static void WriteLine(string value)
     {
         Write(value);
         Write(Environment.NewLine);
     }
  
     public static void WriteLine(string format, params Object[] arg)
     {
         Write(format, arg);
         Write(Environment.NewLine);
     }
  
     enum StdHandle
     {
         STD_INPUT_HANDLE = -10,
         STD_OUTPUT_HANDLE = -11,
         STD_ERROR_HANDLE = -12
     }
  
     [System.Runtime.InteropServices.DllImport(Kernel32.dll)]
     static extern IntPtr GetStdHandle(StdHandle nStdHandle);
  
     [System.Runtime.InteropServices.DllImport(Kernel32.dll)]
     static extern int WriteConsole(
         IntPtr hConsoleOutput, 
         char[] lpBuffer, 
         int nNumberOfCharsToWrite, 
         out int lpNumberOfCharsWritten, 
         int lpReserved
     );
  
     static IntPtr outHandle = IntPtr.Zero;
  }
{% endhighlight %}
