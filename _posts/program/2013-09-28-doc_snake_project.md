---
layout: post
title: 《天天爱萌仙》开发规范，约定、惯用法
categories: [general]
tags: []
---

## 开发工具 ##

-  cocos2dx 2.2
-  CocosBuilder-3.0-alpha3 (不选用cocostudio，暂时还不成熟)
-  Sublime Text 2 (程序脚本编辑器)
-  Apache OpenOffice (可以将tab文件存为utf8编码，excel和wps都不支持)
-  Texture Packer

----------

## 开发环境 ##

1. 取资源...
1. 开发环境部署 cocos2dx/dev
1. 开启服务端，客户端

## 开发流程 ##
1. 功能设计(策划)
1. UI制作(策划+美术)
1. 功能开发(程序)
1. 功能制作(策划)
1. 功能验收(策划+质量)

## 文件规范 ##
1. 所有路径、文件名都是小写英文字母，不允许有中文。单词隔开可以用下划线
   \_，不要用减号-
1. 所有配置文件用utf8编码。（tab表用.csv扩展名，使用Openoffice编辑）

## 代码命名规范 ##

### 标识符的大小写规则 ###
为了区分一个标识符中的多个单词，把标识符中的每个单词的首字母大写。
不要用下划线来区分单词，或者在标识符中的任何地方使用下划线。
有两种合适的方法来大写标识符中的字母，这取决于所使用的标识符：
>**PascalCasing** 
>
>**camelCasing**

**PascalCasing** 约定被用于除了参数名之外的所有标识符，
它把标识符中每个单词的首字母（包括长度为两个字符以上的首字母缩写词）大写，
如下面的例子所示：
> *PropertyDescriptor*
> 
> *HtmlTag*

两个字母长的首字母缩写词是一个特例，在这种情况下两个字母都要大写，
如下面的标识符所示：
> *IOStream*

**camelCasing**
约定仅用于参数的名字，它把标识符中除了第一个单词之外的所有单词的首字母大写，
如下面的例子所示。
在例子中，如果**camelCasing**风格的标识符以两个字母长的首字母缩写词开始，那么两个字母都要小写。
> *propertyDescriptor*
> *ioStream*
> *htmlTag*
> 
### 不同类型的标识符的大小写规则 ###
1. 作用域小于或者等于当前函数的变量使用camelCasing规则命名
1. 作用域大于当前函数的变量使用PascalCasing规则命名

标识符  			| 类型				      | 例子
文件内全局变量    | PascalCasing     	| **Lib** = Import("scripts/lib.lua"); 
Panel的附加参数  | PascalCasing     	| panel. **Parameter** = {**SelectIndex** = 5, };
函数名          | PascalCasing     	| function **Register** (panel) ... end
函数参数         | camelCasing      	| function OnTouchEvent(**panel**, **control**, **controlEvent**) ... end
CCB中控件名      | PascalCasing     	| panel. **RoleName** .SetText(name);
Tab表中列名      | PascalCasing     	| setting. **CardTemplateId**

### 通用命名约定 ###
1. 要选择易于阅读的名字
1. 要选择易于查找的名字


## 历代iPad和iPhone分辨率 ##
-  iPad 1代、iPad 2代和iPad Mini的分辨率：1024 x 768
-  iPad 3代和iPad 4代的分辨率（Retina屏幕）：2048 x 1536
-  iPhone 1代，iPhone3G，iPhone 3GS的分辨率：480 x 320
-  iPhone 4，iPhone 4S的分辨率：960 x 640
-  iPhone 5的分辨率：1136 x 640
-  iPhone 5s，iPhone 5c的分辨率：1136 x 640

我们要支持iphone4、iphone5、ipad，以iphone4的分辨率960×640为基础，将其推衍，iphone5保持为1136×640，ipad缩放为960×720，然后取长宽最大值，也就是1136×720，美术全屏背景图的大小为1136×720，同时要保证在1136×640，960×640，960×720三个分辨率下，显示都是可以接受的。

## 新员工培训计划 ##

每晚7:30总结今天的工作。

1. 了解lua并按照工作步骤实现简单功能，注意代码规范。

   1. 教程：Programming in lua(第2、3、4、5、6、7、16、18、19、20、22章)
   1. 开发规范，约定、惯用法
   1. 正确的评估工作量
      1. 向需求方了解需求。
      1. 将需求分解为可执行的步骤，将不确定的问题了解清楚。
      1. 估算工作量，和主程确认需求，实现思路、工作量。(达成共识，注意强调达成共识)
      1. 再规定的时间内开发出满足需求的功能。
1. 了解cocos2d基础概念
   1. 教程：ios cocos2d游戏开发实战 (第3章)
   1. 作业：如何用cocos2d实现Fruit Ninja的菜单界面
1. 了解cocosbuilder，并使用cocosbuilder做出简单界面
   1. 作业：使用cocosbulder制作Fruit Ninja的菜单界面
   1. 了解各控件的区别
   1. 了解锚点的概念
1. 简单了解游戏客户端和UI基础
   1. Panel的概念
   1. 如何和cocosbuilder关联起来（根据CCB如何找到对应的脚本）
   1. 讲解简单控件的使用（testui.ccb）
   1. 根据 客户端API文档，练习完成简单的功能
1. 完成简单的游戏UI功能调整
1. 完成简单的游戏UI功能开发