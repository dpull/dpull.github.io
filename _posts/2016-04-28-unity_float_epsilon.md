---
layout: post
title: Unity浮点数的Epsilon
categories: [general]
tags: []
---

今天项目出了一个问题，iOS版本的表现和其他版本不同，调试后发现问题出在了浮点数比较上，
使用了[float.Epsilon](https://msdn.microsoft.com/en-us/library/system.single.epsilon(v=vs.110).aspx)进行浮点数比较，
使用Unity提供了[Mathf.Epsilon](http://docs.unity3d.com/ScriptReference/Mathf.Epsilon.html)是没有问题的。

测试代码和输出如下：

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

从结论可以看出：在Mono2x的iOS版本上，float.Epsilon的值为0。

## iOS使用Mono2x的原因：

因为项目目前使用的Unity5.3，计划五一后才升级Unity5.3，
不过[Unity5.2导出的IL2CPP的Xcode工程不支持Xcode 7.3](http://forum.unity3d.com/threads/error-unknown-type-name-__declspec-after-xcode-7-3-upgrade.393128/)，
为了兼容开发机和构建机，所以暂时先把编译选项改为Mono2x。