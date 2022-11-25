---
layout: post
title: 《深入理解C#》
categories: [general, note]
tags: []
---

我是从大一下学期开始自学C#的，当时觉得用C、C++写Window GUI程序挺累人，偶然间看到一本C#的教程，发现它解决这个问题，于是自学起来。
毕业后开始做端游，一直用C、C++、lua，偶尔用C#写个小工具，但不是主要的开发语言。

2009年左右看了《CLR via C#》对.NET有了自我感觉上的深入理解 :);随后看了《.NET设计规范》学到了一些“正规军”做法。

从2014年起，开始用Unity3d做手游客户端，C#正式成了主要开发语言，Unity的.NET版本约等于.NET3.5，和我以前自学的.NET2.0有些差异。

有必要找本书进阶下，于是选了 [Stack Overflow上排名第一的大神Jon Skeet](http://meta.stackexchange.com/questions/9134/jon-skeet-facts) 的《深入理解C#》，主要看了前十章，后面主要讲了Linq，不过我对Linq的着实提不起兴趣来，而且游戏开发用Linq的需求也比较少。

通过《深入理解C#》，我感觉C#是从工程上解决问题，每一次版本升级，总会提供一些特性，解决当前版本存在的开发起来不爽的问题。例如委托在.NET1中使用起来很繁琐，.NET2中引入了+=的操作符重载，引入了匿名委托，尝试解决这个问题，在.NET3中引入了lambda表达式，继续解决这个问题。

## 委托 ##
匿名方法中存在一个捕获变量的概念，他的生存期会超出当前函数作用域，只要还有委托实例引用它，它就会一直存在。

## 泛型 ##
书上的内容没啥好记录的。

## 可空类型 ##
书上的内容没啥好记录的。

题外话：它可以解决Unity iOS的一些[限制](http://developer.xamarin.com/guides/ios/advanced_topics/limitations/)，可以用可空类型来绕过。

> **Value types as Dictionary Keys**

> Using a value type as a Dictionary<TKey, TValue> key is problematic, as the default Dictionary constructor attempts to use EqualityComparer<TKey>.Default. EqualityComparer<TKey>.Default, in turn, attempts to use Reflection to instantiate a new type which implements the IEqualityComparer<TKey> interface.

> This works for reference types (as the reflection+create a new type step is skipped), but for value types it crashes and burns rather quickly once you attempt to use it on the device.

> Workaround: Manually implement the IEqualityComparer<TKey> interface in a new type and provide an instance of that type to the Dictionary<TKey, TValue> (IEqualityComparer<TKey>) constructor.


## 迭代器 ##

以前我一直疑惑为何迭代器有多种写法，有的实现是复杂的 `IEnumerator` 接口，有的只用 `yield` 轻松搞定，哪样实现才是“正统”，通过这章，我知道了`yield` 是 `IEnumerator` 的代码糖，.NET2为了解决.NET1开发不爽引入的。


## 隐式类型的局部变量 ##
书上的内容没啥好记录的。

## 扩展方法 ##
书上的内容没啥好记录的。

## 有趣的知识点 ##

* **??** 操作符： 我以前不常用它，可以简化判空赋默认值操作。`if (tom == null) tom = lucy;` 可以写为 `tom = tom ?? lucy;`
* **::** 操作符： 可用于using 重命名某个命名空间后，获取里面的类型。
* 集合初始化列表 `new List<string>{"a", "b"};`
* 对于 `MyMethod(new string[]{"a", "b"})` 可以简写为 `MyMethod(new []{"a", "b"});`
* partial 用于 函数（unity3d的mono不支持）
* 匿名类型 `var tom = new {Name = "Tome"};`
* 投影初始化列表 `var alex = new {tom.Name};` 等同于 `var alex = new {Name = tom.Name};`
* lambda表达式树







