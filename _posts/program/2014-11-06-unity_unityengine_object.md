---
layout: post
title: Unity 杂记
categories: [general]
tags: []
---


## UnityEngine.Object 生命周期 ##

`UnityEngine.Object` 并不是真正的C#对象，并非引用后就可以一直使用了，如果有外部释放的可能性，需要在使用前判空。

```C#
	void TestDestroy()
	{
		var test = new GameObject("test");
		Debug.Log(test == null); // False
		Debug.Log(object.ReferenceEquals(test, null)); // False

		Object.DestroyImmediate(test);
		Debug.Log(test == null); // True
		Debug.Log(object.ReferenceEquals(test, null)); // False
	}
```

另外不要继承 `UnityEngine.Object`, 判空是不正确的,

```C#
	void TestInherit()
	{
		var test = new StringObj();
		test.Value = "test";
		
		UnityEngine.Object testObj = test;
		UnityEngine.Object testObjNull = null;
		
		Debug.Log("TestObject begin");
		Debug.Log(test == null); // True
		Debug.Log(testObj == null); // True
		Debug.Log(testObj is StringObj); // True
		Debug.Log(test.Value); // test
		Debug.Log(((StringObj)testObj).Value); // test
		Debug.Log(object.ReferenceEquals(testObj, null)); // False
		Debug.Log(object.ReferenceEquals(testObjNull, null)); // True

		Object.DestroyImmediate(test);
		Debug.Log("TestObject end");
	}
```

### 参考 ###

[Forums > Unity Community Support > UnityEngine.Object](http://forum.unity3d.com/threads/unityengine-object.71205/)


[Playmaker Forum » Playmaker Help & Tips » Playmaker Help » Making custom FsmObject types?](http://hutonggames.com/playmakerforum/index.php?topic=3518.msg16185#msg16185)
> WARNING: Unity.Object do not obey garbage collections, they only get cleaned up if you call manually Resources.UnloadUnusedAssets() else on mobile you might get to a memory crash eventually if you use a lot of these.

## WWW阻塞加载 ##
一直以为WWW是不能阻塞加载的，后来看别人的代码发现并非如此，测试代码如下：

```C#
	void TestWWW() 
	{
		using(WWW www = new WWW("http://dldir1.qq.com/qqfile/qq/QQ8.1/17283/QQ8.1.exe"))
		{
			var timeout = System.DateTime.Now.AddSeconds(200);
			while (!www.isDone) 
			{
				if (timeout < System.DateTime.Now)
				{
					Debug.Log("Time out");
					break;
				}
				Debug.Log("loop");
			}
			Debug.Log(www.isDone);
			Debug.Log(www.error);
			Debug.Log(www.text);
		}
	}
```
