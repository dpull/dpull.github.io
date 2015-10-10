---
layout: post
title: YY构造函数
categories: [general]
tags: [c]
---

摘自 **《C++语言的设计和演化》** **《Effective C++》**

组内培训的ppt。

----------

## 上帝为何创造构造函数 ##
为了防止未经授权的访问，第一种手段通过访问控制机制保证，第二类保证则通过“特殊的成员函数”提供，例如：构造函数，这些函数是由编译程序识别和调用的。基本想法就是想让程序员能够建立起一种保证（有时也称为不变式），以便使其他成员函数都能够依赖这些东西。

## 构造函数—小时候的故事 ##

```C++
Class monitor : object
{
Public:
    new(){}
    delete(){}
}
```

构造函数的概念从何而来？我怀疑这个词是自己发明的。我过去就熟悉Simula的类对象的初始化机制。但无论如何我是把类声明主要看成一个界面的定义，因此就希望能避免把代码放在这里面。由于带类的c与c语言一样有三种存储类型，几乎必然需要有某种由编译程序识别的初始化函数形式。观察发现，允许定义多个构造函数很有价值，因此这也就成了C++重载机制的一个重要应用方面。

与在c语言里一样，对象可以用三种方式分配：在栈上（在自动存储区），在固定的地址（静态存储区），以及在自由空间里（在堆里，或说动态空间里）。在所有这些情况下都必须调用构造函数，以建立起这个对象。在c语言里，在自由空间分配一个对象时之前设到调用一个分配函数。如：

```C++
    monitor *p = (monitor *)malloc(sizeof(monitor ));
```

对于带类的c，这显然是不够的，因为这样无法保证一定会调用构造函数。因此我引进了一个运算符，以便保证分配和初始化都能够完成：

```C++
    monitor *p = new monitor;
```

该运算符称为new，因为这也是Simula里对应运算符的名字。new将调用某种分配函数以获得存储，而后调用一个构造函数去初始化这些存储。这种组合操作常常被称为实例化，或者简单的称为对象创建，它从原始的存储区建立起一个对象。

运算符new的记法规定也很重要（本课不谈）。但是，将分配和初始化组合为一个操作，没有一种显示的错误报告机制也带来了一些实际问题。很少需要在构造函数中处理和报告错误，当然，异常机制的引进为这个问题提供了一种具有普遍意义的解决办法。

## 构造函数-整容记 ##

—把构造函数称作“new-函数”常常造成混乱，因此就引进了命名的构造函数。与此同时，这个概念又得到了进一步扩充，允许将构造函数显示地用在表达式里。例如，

```C++
complex i = complex(0, 1);
complex operator+(complex a, complex b)
{
    return complex (a.re+b.re, a.im+b.im);
}
```

形如complex(x, y);的表达式是显示地调用类complex的构造函数。

为了尽量减少新的关键词，我没有使用下面这样更明确的语法：

```C++
class X
{
    constructor();
    destructor();
};
```

而是选择了能反映构造函数使用形式的声明方式：

```C++
class X
{
    X();// constructor  
    ~X();// destructor
};
```

这也有可能是过于轻巧了。

## 跑题啦！ ::是如何引入的 ##

在带类的C里，圆点出了用于描述从某个对象选择成员外，也可用于描述类的成员。这带来一些不太重要的混乱，也可以用它构造出带有歧义性的例子。考虑：

```C++
class X
{
  int a;
  public:
    void set(X)
};

void X.set(X arg){a = arg.a};

class X  X;//common c practice;class and object with the same name

void f()
{
  X.a; //now,which x do I mean?,the class or the object
}
```

为化解这种问题，引进了用::表示类的成员关系，而将.保留专门用于
对象的成员关系。

## 好人(╯︿╰) C++默默的做了什么？ ##


—如果自己没声明,编译器就会为他声明一个copy构造函数、一个copy
assiagnment操作符和一个析构函数。此外如果你没有声明任何构造函数，编译器也会为你声明一个default的构造函数。这些函数都是public且inline。唯有当这些函数被需要（被调用），他们才会被编译器创建出来。

## 大曝光：default构造函数和析构函数 ##

—default构造函数和析构函数主要是给编译器一个地方用来放置“藏身幕后”的代码，像是调用base
classes和non-static成员变量的构造函数和析构函数。注意，编译器产出的析构函数是一个non-virtual，除非这个class的base
class自身声明有virtual析构函数（这种情况下这个函数的虚属性；virtualness；主要来自base
class）

## 大曝光：copy构造和copy assiagnment操作符 ##

—至于copy构造函数和copy
assiagnment操作符，编译器创建的版本只是单纯地将来源对象的每一个non-static成员变量拷贝到目标对象
。

—针对const 成员 和 reference的默认copy构造

## 影帝：让好人生活得更有尊严 ##

```C++
class NamedObject
{
  public:
      NamedObject(std::string &name, const int &value);

  private:
      std::string &nameValue;
      const int objectValue;
};

std::string ss("acai");

NamedObject no1(ss, 2);
NamedObject no2(ss, 2);

no2 = no1;
// error C2582: “operator =”函数在“NamedObject”中不可用
```

**是妹妹不是ㄇㄟㄇㄟ --- 若不想使用编译器自动生成的函数，就该明确拒绝**

可以将copy构造函数或者copy
assiagnment操作符声明为private。籍由明确声明一个成员函数，你阻止了编译器暗自创建其专属版本；而令这些函数为private,使你得以成功阻止人们调用它般而言这个做法并不绝对安全，因为member函数和friend函数还是可以调用你的private函数。

**咋办呢？**

1. 只声明，不去定义它们，那么如果某些人不慎调用任何一个，会获得一个连接错误（linkage
   error）。
1. 每一个类都写一个private很麻烦，可以这样搞

```C++
class Uncopyable
{
protected:
    Uncopyable(){}
    ~Uncopyable(){}
private:    
    Uncopyable(const Uncopyable&);
    Uncopyable &operator=(const Uncopyable&);
};
class Test : private Uncopyable{};
```

Uncopyable
class的实现和运用颇为微妙，包括不一定得以public继承它，以及Uncopyable
的析构函数不一定得是virtual等等。
Boost库中提供的相同版本，那个class名为noncopyable
