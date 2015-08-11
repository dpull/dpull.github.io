---
layout: post
title: Hero开发笔记-立项
categories: [general, hero]
tags: []
---

2014年7月7日，我们7人回归吉大，成立了一个新工作室，准备做一款手游。游戏内容保密，仅记录技术上遇到的问题和选择的方案。

## 服务端 ##
选用skynet，主要有两个原因：

1. 可以很轻松的开发异步逻辑，从而充分的利用起多核优势来。
1. 可以很方便的做性能优化，把热点作为一个单独的服务独立出来。这意味着，我们可以减少很多的过度设计。

## 客户端 ##
选用unity，主要有两个原因：

1. 工具链完整，可以发挥出我们美术和UE的优势来
1. 平台支持比较专业。

如何使用unity：

我不喜欢网上一些团队采用的各工种独立开发的想法，比如说：UE只负责拼界面，但界面如何响应，播动画这些要程序开发，这样就带来了很多沟通成本，我希望的是，程序负责开发组件和内容填充，UE负责界面响应，也就是我们要充分的利用起编辑器的组件优势来。

当然，这也带来了一些问题，比如说，权限不好管理，在以往的项目，美术和UE通常只有产品库权限，没有代码库权限，按照这种想法，其实是没有代码库的。
 
## 代码规范 ##
### C、C++ ###
1. 参考金山、心游代码规范。
1. 前缀改为C（C、C++的意思，省的换个项目就想着规范），即类前缀`CExample`，宏前缀`C_FAILED_JUMP`
1. 无论在服务端和客户端，都是以插件的形式加载，所以不要直接记录Log，采用C的方式返回错误码。

## C# 和 lua##
参考《.net设计规范：约定、惯用法与模式》

1. 作用域小于或者等于当前函数的变量使用camelCasing规则命名
1. 作用域大于当前函数的变量使用PascalCasing规则命名
1. 不使用C前缀

### C#示例 ###
    标识符  				| 类型				| 例子
    ---  			 	| --- 				| ---
    类名    	            | PascalCasing     	| class **Example**
    成员变量  		    | PascalCasing     	| int **Level**
    属性           	    | PascalCasing     	| int **Level** {get; set;}
    函数           	    | PascalCasing     	| void **SetLevel** (int level)
    函数参数         	| camelCasing      	| void SetLevel(int **level**)

### lua示例 ###
    标识符  				| 类型				| 例子
    ---  			 	| --- 				| ---
    文件内全局变量    	| PascalCasing     	| **Lib** = Import("scripts/lib.lua"); 
    Panel的附加参数  		| PascalCasing     	| panel. **Parameter** = {**SelectIndex** = 5, };
    函数名           	| PascalCasing     	| function **Register** (panel) ... end
    函数参数         	| camelCasing      	| function OnTouchEvent(**panel**, **control**, **controlEvent**) ... end
    Tab表中列名      	| PascalCasing     	| setting. **CardTemplateId**
