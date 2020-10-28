---
layout: post
title: C++ 模板 笔记
categories: [general]
tags: []
---

我不喜欢模板, 也不喜欢C++, 但无奈新项目要用C++, 为了做好模块间的解耦, 重新了解一下.

### 模版静态变量或常量

enum 或 const static 成员变量, 可以使用?:/=+-*等在编译器展开

### 模板的模板参数

template<typename T, template<typename> class CONT=std::vector>

class 不能写为typename
函数模板并不支持模板的模板参数

### 友元可以定义在类的内部

### 模版不定参数展开

支持定义多个类型

    template<typename ...args>
    void print(args ...rest)
    {
        print(rest...);
    }

    template<typename T, typename ...args>
    void print(T a, args ...rest)
    {
        std::cout << a << std::endl;
        print(rest...);
    }

    template<typename T, typename U, typename ...args>
    void print(T a, U b, args ...rest)
    {
        std::cout << a << '\t' << b << std::endl;
        print(rest...);
    }

    void print()
    {
        std::cout << "empty" << std::endl;
    }


### sfinae 可以用于 模板类型, 函数参数, 返回值

### 只有当C是一个class类型的时候，身为成员指针的类型构造C::*才会是有效的。

### 函数不支持部分偏特化

### 当用int&替换T之后，所获得的T&看成与int&等价

### 在C++中已经有了一个好用的规则，就是如果派生类要使用基类的成员函数的话，可以通过using声明

### ...的重载

### 如果编译器能在出现的时候知道它是一个类型，那么就不需要typename，如果必须要到实例化的时候才能知道它是不是合法，那么定义的时候就把这个名称作为变量而不是类型。


### 测试一下模板引用数组大小问题

对于非引用类型的参数，在实参演绎的过程中，会出现数组到指针（array-to-pointer）的类型转换（这种转型通常也被称为decay）

‘apple’和‘peach’具有相同的类型char const[6]；然而‘tomato’的类型则是：charconst[7]。

对于字符串，在实参演绎过程中，当且仅当参数不是引用时，才会出现数组到指针（array-to-pointer）的类型转换（称为decay）。

### 测试一下使用指针，引用的非类型参数

### 如何看模版展开后的代码
