---
layout: post
title: .NET用Remoting实现进程间通信
categories: [general]
tags: [csharp]
---

工具项目的服务器端(exe)控制端(web)都是用.net写的，原本两者的通信想用Socket，
但被协议所累，即使用序列化传输，也是要处理一大坨东西，偷偷懒，采用Remoting，
缺点是以前的设计是单线程，不用加锁，现在要在服务器端的主循环进行加锁。

决定采用这个方案后决定对Remoting进行一个简单的封装，原因有二：
1. 为了减少开发者的学习成本，没必要每个程序员都要精通这套方案
1. 为了减少业务逻辑对Remoting的依赖（说不定哪天发现不满足需求就换掉了）

**定义Server被web的基本操作的接口，我们定为IServerControl，里面只有一个Add方法。**
	
{% highlight c# %}
public interface IServerControl    
{
    void Add();    
}
{% endhighlight %}

**实现Remoting的对象，也就是允许在支持远程处理的应用程序中跨应用程序域边界访问对象。**
    
{% highlight c# %}
class RemotingControl : System.MarshalByRefObject, IServerControl
{
    public void Add() { }
}
{% endhighlight %}

**定义配置文件类 和 封装Server端的封装**

{% highlight c# %}
static class RemotingConfig    
{       
    public const int RemotingPort = 8241;        
    public static readonly string RemotingUri = "ASPRemoting";    
}

public class RemotingServer
{
    public static void Init()
    {
        channel = new TcpServerChannel(RemotingConfig.RemotingPort);
        ChannelServices.RegisterChannel(channel, false);//将该值设置为 false 将不会使在 TCP 或 IPC 信道上所做的安全设置无效。
        RemotingConfiguration.RegisterWellKnownServiceType(typeof(RemotingControl), RemotingConfig.RemotingUri, WellKnownObjectMode.Singleton);
    } 

    public static void UnInit()
    {
        ChannelServices.UnregisterChannel(channel);
    }

    static IChannel channel;
}
{% endhighlight %}

**封装Client，把RemotingControl进行封装，隐藏Remoting机制！**

代码中我们采用短连接，因为Web出现长连接的可能性也不大

{% highlight c# %}
public class RemotingClient : IServerControl
{
    public static void Init()
    {
        channel = new TcpClientChannel();
        ChannelServices.RegisterChannel(new TcpClientChannel(), false);
    }

    public static void UnInit()
    {
        ChannelServices.UnregisterChannel(channel);
    }

    public static IServerControl GetRemotingObj()
    {
        return (IServerControl)Activator.GetObject(
            typeof(RemotingControl),
            string.Format("tcp://localhost:{0}/{1}", RemotingConfig.RemotingPort, RemotingConfig.RemotingUri)
        );
    }
    static IChannel channel;
    //实现接口       
    public void Add()        
    {
        IServerControl control = GetRemotingObj();
        control.Add();
    }
}
{% endhighlight %}

**小补充 :**

如果Remoting有异常的话，通常主线程也会断下，通常只要修改
工具->选项->Debug->启用仅我代码 就不会断下了！
