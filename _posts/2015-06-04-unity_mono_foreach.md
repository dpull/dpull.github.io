---
layout: post
title: Unity foreach 造成额外的GC开销
categories: [general]
tags: [C#, Unity]
---

Unity的foreach会造成额外的GC开销，但一直没有细究，今早看了[作为Unity3D的脚本而言，c#中for是否真的比foreach效率更高？ - 回答作者：王剑飞](https://www.zhihu.com/question/30334270/answer/49858731)明白了其产生的原因，于是做此笔记。

例如针对`Dictionary<string, int> TestContainer`进行测试：

## 产生额外GC Alloc的原因：

{% highlight c# %}
void TestListForeach()
{
	foreach (var i in TestContainer)
	{
		CountString(i.Key);
	}
}
{% endhighlight %}

会产生额外的GC Alloc，原因是这段代码等同于：

{% highlight c# %}
void TestListNoForeachWithUsing()
{
	using(var i = TestContainer.GetEnumerator())
	{
		while(i.MoveNext())
		{
			CountString(i.Current.Key);
		}
	}
}
{% endhighlight %}

当using结束进行Dispose时，因为`IEnumerator<T>`是结构体，进行了一次装箱操作。


## 不产生额外GC Alloc的等价写法：

{% highlight c# %}
void TestListNoForeachSafe()
{
	var i = TestContainer.GetEnumerator();
	try
	{
		while(i.MoveNext())
		{
			CountString(i.Current.Key);
		}
	}
	finally
	{
		i.Dispose();
	}
}
{% endhighlight %}

这个写法写起来挺拗口的，如果不调用`IEnumerator<T>.Dispose()`会好很多：

{% highlight c# %}
void TestListNoForeach()
{
	var i = TestContainer.GetEnumerator();
	while(i.MoveNext())
	{
		CountString(i.Current.Key);
	}
}
{% endhighlight %}

那Dictionary.Dispose做了什么呢？

{% highlight c# %} 
// 摘自Unity Mono的 mcs/class/corlib/System.Collections.Generic/Dictionary.cs 文件
public struct Enumerator : IEnumerator <T>, IDisposable {
	Dictionary<TKey, TValue> dictionary;
	// ...
	public void Dispose ()
	{
		dictionary = null;
	}
}
{% endhighlight %}

~~通过以上代码，我认为针对`Dictionary`是可以不调用`Dispose`的。当然作为通用流程还是要调用的，如果想采用简单写法，必须明白`Dispose`做了什么。~~

## 结论

因为foreach比其替代写法，清晰明了太多，建议只用在一些不常调用的函数上。
可以先使用`foreach`开发，针对`Profiler`进行定点的优化，
为了项目不易出错，改写的代码，采用`TestListNoForeachSafe`写法。
