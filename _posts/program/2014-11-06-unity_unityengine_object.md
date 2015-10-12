---
layout: post
title: UnityEngine.Object相关
categories: [general, hero]
tags: []
---

前一段忙demo、招聘、培养新人不可开交，幸而老兄弟[jlu3389](https://github.com/jlu3389)加盟，得以缓解。

## 问题 ##

当类继承自UnityEngine.Object时，判空是不正确的，如下面代码：

```C#
public class TestObject : MonoBehaviour 
{
    class StringObj : UnityEngine.Object
    {
        public string Value;
    }

	void Start ()
    {
        var test = new StringObj();
        test.Value = "Acai";

        UnityEngine.Object testObj = test;
        UnityEngine.Object testObjNull = null;

        Debug.Log("TestObject begin");
        Debug.Log(test == null); // True
        Debug.Log(testObj == null); // True
        Debug.Log(testObj is StringObj); // True
        Debug.Log(test.Value); // Acai
        Debug.Log(((StringObj)testObj).Value); // Acai
        Debug.Log(object.ReferenceEquals(testObj, null)); // False
        Debug.Log(object.ReferenceEquals(testObjNull, null)); // True
        Debug.Log("TestObject end");
	}
}
```

## 结论 ##
猜测原因是UnityEngine.Object是重写了内存分配器的。

自定义类不要直接继承自UnityEngine.Object，应继承自ScriptableObject或SerializedObject，注意要使用Object.Destory释放，不走垃圾回收的。

## 参考 ##

[Forums > Unity Community Support > UnityEngine.Object](http://forum.unity3d.com/threads/unityengine-object.71205/)


[Playmaker Forum » Playmaker Help & Tips » Playmaker Help » Making custom FsmObject types?](http://hutonggames.com/playmakerforum/index.php?topic=3518.msg16185#msg16185)
> WARNING: Unity.Object do not obey garbage collections, they only get cleaned up if you call manually Resources.UnloadUnusedAssets() else on mobile you might get to a memory crash eventually if you use a lot of these.
