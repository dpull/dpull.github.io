---
layout: post
title: C#打印当前行号和函数名和Unity log
categories: [general]
tags: [csharp]
---

昨天杨教授在群里面问我一个问题，如何用C#打印当前行号和函数名，类似于C中的 `__FILE__`, `__LINE__`, `__THIS_FUNCTION__` 关键字。

我当时给出的方案是几年前我写ASP服务端时用的方法，代码如下：

{% highlight c# %}
void Log(string format, params object[] arg)
{
	var sf = new System.Diagnostics.StackFrame(1, true);
	string info = string.Format(format, arg);
	string log = string.Format(
		"{0}\tFile:{1}\tLine:{2}\t{3}\t{4}",
		System.DateTime.Now.ToString("MM-dd HH:mm:ss"), 
		sf.GetFileName(), 
		sf.GetFileLineNumber(), 
		sf.GetMethod(), 
		info
	);
	// ...
}
{% endhighlight %}	

晚上闲着无聊随手翻了一下MSDN，看到一篇[Caller Information](http://msdn.microsoft.com/zh-cn/library/hh534540.aspx)的文档，可以使用如下Attribute实现这个功能，效率也会更高：

{% highlight c# %}
public void TraceMessage(string message,
        [CallerMemberName] string memberName = "",
        [CallerFilePath] string sourceFilePath = "",
        [CallerLineNumber] int sourceLineNumber = 0)
{
    Trace.WriteLine("message: " + message);
    Trace.WriteLine("member name: " + memberName);
    Trace.WriteLine("source file path: " + sourceFilePath);
    Trace.WriteLine("source line number: " + sourceLineNumber);
}
{% endhighlight %}	

不过这些Attribute是.Net4.5提供的，而杨教授弄这个是为Unity3d，自然不支持了。

提到Unity3d的log文件，其实没必要自己获取这些，使用Debug.Log写日志，会自动记录。

在我的项目里面，使用 `Application.RegisterLogCallback` 注册了一个回调函数，就实现了这些功能。

