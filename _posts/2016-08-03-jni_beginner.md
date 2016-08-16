---
layout: post
title: JNI入门
categories: [general]
tags: []
---

JNI全称Java Native Interface，用于Java和C/C++交互。这里主要记录一下Android使用JNI的一些注意点。

## 基本概念

* `JavaVM` Java虚拟机，一般使用`JNI_OnLoad`函数缓存下来，配对函数`JNI_OnUnload`。 
* `JNIEnv` JNI环境，线程唯一。
	* 通过`JavaVM::GetEnv`来获取.
	* 如果非`JavaVM`创建的线程，需要调用`JavaVM::AttachCurrentThread`来获取.


## 基本流程

[函数文档](http://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/functions.html)

1. 获取类`jclass`
	* `JNIEnv::FindClass`
	* `JNIEnv::GetObjectClass`
2. 获取字段或函数ID
	* 字段：`JNIEnv::GetFieldID`	, `JNIEnv::GetStaticFieldID` ...
	* 函数：`JNIEnv::GetMethodID`, `JNIEnv::GetStaticMethodID` ...
3. 执行操作
	* 字段：
	
		`JNIEnv::GetObjectField`, `JNIEnv::GetStaticObjectField` ...
		
		`JNIEnv::SetObjectField`, `JNIEnv::SetStaticObjectField` ...
		
	* 函数：
		
		`JNIEnv::CallObjectMethod`  ...
		
		`JNIEnv::CallStaticObjectMethod`  ...
		
		`JNIEnv::CallNonvirtualObjectMethod`  ...

> 优化：
> `GetFieldID()`、`GetStaticFieldID()`、`GetMethodID()` 和 `GetStaticMethodID()`，为特定类返回的 ID 不会在 JVM 进程的生存期内发生变化。但是，获取字段或方法的调用有时会需要在 JVM 中完成大量工作，因为字段和方法可能是从超类中继承而来的，这会让 JVM 向上遍历类层次结构来找到它们。由于 ID 对于特定类是相同的，因此您只需要查找一次，然后便可重复使用。同样，`FindClass()`查找类对象的开销也很大，因此也应该缓存它们。

## 局部引用和全局引用
大多数JNI函数返回局部引用，当本地函数返回时，局部引用被自动释放。局部引用不能被跨线程调用，可以使用`JNIEnv::NewGlobalRef` 或 `JNIEnv::NewWeakGlobalRef`将其变为全局引用或弱全局引用（不影响垃圾回收）。
对于弱全局引用，可以通过判断`JNIEnv::IsSameObject(weakRef, NULL)`检查是否已经被垃圾回收。

> 注意：
> JNI 规范要求各本机代码至少能创建 16 个本地引用。虽然这对许多方法来说都已经足够了，但一些方法在其生存期中却需要更多的本地引用（如循环）。对于这种情况，应该删除不再需要的引用`JNIEnv::DeleteLocalRef`。

## 数组读取和修改
对于接口`JNIEnv::Get[Boolen|Byte|Int|Long...]ArrayElements`，Java 规范让 JVM 实现决定让这些调用提供对数组的直接访问，还是返回一个数组副本。为了避免不确定性，建议使用`JNIEnv::Get[Boolen|Byte|Int|Long...]ArrayRegion`进行批量的读取和修改。


## 单独传递字段优于传递一个有多个字段的对象

	int sumValues(JNIEnv* env, jobject obj, jint a, jint b,jint c, jint d, jint e, jint f){
	   return a + b + c + d + e + f;
	}
	
	int sumValues2(JNIEnv* env, jobject obj, jobject allValues){
	
	   jint avalue = (*env)->GetIntField(env, allValues, a);
	   jint bvalue = (*env)->GetIntField(env, allValues, b);
	   jint cvalue = (*env)->GetIntField(env, allValues, c);
	   jint dvalue = (*env)->GetIntField(env, allValues, d);
	   jint evalue = (*env)->GetIntField(env, allValues, e);
	   jint fvalue = (*env)->GetIntField(env, allValues, f);
	   
	   return avalue + bvalue + cvalue + dvalue + evalue + fvalue;
	}

`sumValues` 比 `sumValues2` 效率高，因为`sumValues2`需要 6 个 JNI 回调。

在面向对象设计中，传递对象通常能提供较好的封装，因为对象字段的变化不需要改变方法签名。但是，对于 JNI 来说，本机代码必须通过一个或多个 JNI 调用返回到 JVM 以获取需要的各个字段的值。这些额外的调用会带来额外的开销，因为从本机代码过渡到 Java 代码要比普通方法调用开销更大。因此，对于 JNI 来说，本机代码从传递进来的对象中访问大量单独字段时会导致性能降低。


## 尽量减少JNI交互代码
在设计 Java 代码与本机代码之间的界限时应该最大限度地减少两者之间的相互调用。消除不必要的越界调用，并且应该竭力在本机代码中弥补越界调用造成的成本损失。最大限度地减少越界调用的一个关键因素是确保数据处于 Java/本机界限的正确一侧。如果数据未在正确的一侧，则另一侧访问数据的需求则会持续发起越界调用。

## 辅助工具
	
	＃ 显示函数的内部类型
	javap -s java.util.UUID 
	
## 隐式注册函数

	JNIEnv::RegisterNatives
	JNIEnv::UnregisterNatives
	

## 参考资料 ##
* 《Android C++高级编程 使用NDK》第三章
* [使用 Java Native Interface 的最佳实践](http://www.ibm.com/developerworks/cn/java/j-jni/index.html)