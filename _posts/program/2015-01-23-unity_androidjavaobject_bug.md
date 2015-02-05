---
layout: post
title: Unity函数AndroidJavaObject.Call的bug
categories: [general]
tags: []
---

用AndroidJavaObject.Call调用一个需要参数传入缓冲区的函数，函数返回值是正确的，但缓冲区内数据错误，因为其文档不全，网上搜索也没有类似的例子，通过Go to declaration功能看Call的代码，原来是unity的bug。

	protected void _Call (string methodName, params object[] args)
	{
		if (args == null)
		{
			args = new object[1];
		}
		IntPtr methodID = AndroidJNIHelper.GetMethodID (this.m_jclass, methodName, args, false);
		jvalue[] array = AndroidJNIHelper.CreateJNIArgArray (args);
		try
		{
			AndroidJNISafe.CallVoidMethod (this.m_jobject, methodID, array);
		}
		finally
		{
			AndroidJNIHelper.DeleteJNIArgArray (args, array);
		}
	}

传入的缓冲区被AndroidJNIHelper.CreateJNIArgArray被其拷贝了一份，函数调用完成后，没有将缓冲区中的值赋过去。