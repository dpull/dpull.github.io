---
layout: post
title: 带着问题研究Unity
categories: [general, dotnet]
tags: [csharp]
---

## AddComponent(string className)为何className必须和文件名一致 ##
因为脚本其实是一种资源，unity需要根据文件名寻找到相关的资源。

## 如何实现继承自YieldInstruction的协程类 ##
无法实现，因为其逻辑写在了Coroutine.cpp中，仅拿YieldInstruction做了缓存数据的功能。

## Unity资源管理 ##
### Assetbundle ###
只有文件索引相关的数据占用内存

### Resources ###
也是预存了索引数据

### Resources.Load ###

### Object.Instantiate ###

## WWW性能问题 ##
以前我向unity反馈过，WWW没有stream接口，没有设置超时接口，
研究后发现，其是全读到内存中的，这。。。。。


## ParticleSystem ##

<!--  
------------------------------------------------------



1. 
1. 用系统的粒子编辑器实现一个给NGUI用
1. 运行时序列化
1. 
1.  




{% highlight c# %}
public class Script : MonoBehaviour, ISerializationCallbackReceiver
{
	private const int KCurrentVersion = 1;
	//mark the old stuff as obsolete and hidden
	[SerializeField]
	[Obsolete]
	[HideInInspector]
	private int myField;
	//add a new field with a better name
	[SerializeField]
	private int m_MyField;
	//add a serialization version (could also use a bool for simpler things)
	[SerializeField]
	private int m_Version = 0;
	public void OnSerialize()
	{ }
	public void OnDeserialize()
	{
		// if we are not upgraded
		if (m_Version < 1)
		{
			 // upgrade
			 m_MyField = myField;
			 m_Version = KCurrentVersion;
		}
	}
}
{% endhighlight %}	


-->