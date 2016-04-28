---
layout: post
title: Unity浮点数的Epsilon
categories: [general]
tags: []
---

今天项目出了一个问题，ios版本的表现和其他版本不同，理论上不应该的问题，为什么呢？

调试后发现问题出在了浮点数比较上，使用了 [float.Epsilon](https://msdn.microsoft.com/en-us/library/system.single.epsilon(v=vs.110).aspx)。
Unity提供了另外一个常量[Mathf.Epsilon](http://docs.unity3d.com/ScriptReference/Mathf.Epsilon.html) 。

为什么Unity要额外提供一个常量呢？测试如下：

{% highlight c# %}
string TestEpsilon()
{
    var sb = new System.Text.StringBuilder();
    sb.AppendFormat("float.Epsilon = {0}\n", float.Epsilon.ToString("G"));
    sb.AppendFormat("Mathf.Epsilon = {0}\n", Mathf.Epsilon.ToString("G"));
    return sb.ToString();
}
/*
在Unity 5.3.4 f1 

编辑器
float.Epsilon = 1.401298E-45
Mathf.Epsilon = 1.401298E-45

Mono2x
float.Epsilon = 0
Mathf.Epsilon = 1.175494E-38

IL2CPP
float.Epsilon = 1.401298E-45
Mathf.Epsilon = 1.175494E-38
*/
{% endhighlight %}

从结论可以看出：在Mono2x的ios版本上，float.Epsilon的值为0了，这就是造成这个问题原因。

那为什么我们要用Mono2x，而不用IL2CPP呢？因为赶版本项目还未升级Unity5.3，
[Unity5.2导出的XCode工程不支持XCode 7.3](http://forum.unity3d.com/threads/error-unknown-type-name-__declspec-after-xcode-7-3-upgrade.393128/)，
为了兼容开发机和构建机，暂时先把编译选项改为Mono2x。