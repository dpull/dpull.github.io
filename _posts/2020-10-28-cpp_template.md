---
# layout: post
title: XXXXXX
categories: [general]
tags: []
---

### const和constexpr区别

1. 常量表达式（const expression）是指值不会改变并且在编译过程就能得到计算结果的表达式。显然，字面值属于常量表达式，用常量表达式初始化的const对象也是常量表达式。
1. 允许将变量声明为constexpr类型以便由编译器来验证变量的值是否是一个常量表达式。声明为constexpr的变量一定是一个常量，而且必须用常量表达式初始化
1. 常量表达式的值需要在编译时就得到计算，因此对声明constexpr时用到的类型必须有所限制。因为这些类型一般比较简单，值也显而易见、容易得到，就把它们称为“字面值类型”（literal type）

### 模版静态变量或常量

enum 或 const static 成员变量, 可以使用?:/=+-*等在编译器展开.

1. const 成员变量 是不可以的, 因为: const是限定符, 只表示不能改变, 是成员变量声明.
1. 因为静态数据成员不属于类的任何一个对象，所以它们并不是在创建类的对象时被定义的。这意味着它们不是由类的构造函数初始化的。而且一般来说，我们不能在类的内部初始化静态成员。相反的，必须在类的外部定义和初始化每个静态成员。和其他对象一样，一个静态数据成员只能定义一次。
1. 静态成员的类内初始化:通常情况下，类的静态成员不应该在类的内部初始化。然而，我们可以为静态成员提供const整数类型的类内初始值，不过要求静态成员必须是字面值常量类型的constexpr（参见7.5.6节，第267页）。初始值必须是常量表达式，因为这些成员本身就是常量表达式，所以它们能用在所有适合于常量表达式的地方。如果某个静态成员的应用场景仅限于编译器可以替换它的值的情况，则一个初始化的const或constexpr static不需要分别定义。
1. 枚举类型:枚举属于字面值常量类型

### 在模板定义中，模板参数列表不能为空

### 模板的模板参数

template<typename T, template<typename> class CONT=std::vector>

class 不能写为typename
函数模板并不支持模板的模板参数

### 友元可以定义在类的内部

### 模版不定参数展开

支持定义多个类型

### sfinae 可以用于 模板类型, 函数参数, 返回值

### 函数不支持偏特化

### 当用int&替换T之后，所获得的T&看成与int&等价

### 在C++中已经有了一个好用的规则，就是如果派生类要使用基类的成员函数的话，可以通过using声明

### 如果编译器能在出现的时候知道它是一个类型，那么就不需要typename，如果必须要到实例化的时候才能知道它是不是合法，那么定义的时候就把这个名称作为变量而不是类型。

### 模板引用数组问题

对于非引用类型的参数，在实参演绎的过程中，会出现数组到指针（array-to-pointer）的类型转换（这种转型通常也被称为decay）

‘apple’和‘peach’具有相同的类型char const[6]；然而‘tomato’的类型则是：charconst[7]。

对于字符串，在实参演绎过程中，当且仅当参数不是引用时，才会出现数组到指针（array-to-pointer）的类型转换（称为decay）。

### 测试一下使用指针，引用的非类型参数

### ...的重载

### 只有当C是一个class类型的时候，身为成员指针的类型构造C::*才会是有效的

### 如何看模版展开后的代码

clang++ -Xclang -ast-print -fsyntax-only test.cpp

### deprecated 标记

 [[deprecated]]

 ### 待续

    auto s2 = sizeof(unsigned int (Derived3::*)()); // 可以用于比较虚表指针数量(MSVC特性, GCC不支持)
    boost::forward<Args>(get<IdxPack>(args_))... // 转发元组参数
    
### sfinae 重载

    template<typename Target = Derived>
    auto next(integral_constant<state::RUNNING>, Delta delta, void *data)
    -> decltype(std::declval<Target>().update(delta, data), void()) {
        static_cast<Target *>(this)->update(delta, data);
    }

    template<typename Target = Derived>
    auto next(integral_constant<state::SUCCEEDED>)
    -> decltype(std::declval<Target>().succeeded(), void()) {
        static_cast<Target *>(this)->succeeded();
    }

    template<typename Target = Derived>
    auto next(integral_constant<state::FAILED>)
    -> decltype(std::declval<Target>().failed(), void()) {
        static_cast<Target *>(this)->failed();
    }

    template<typename Target = Derived>
    auto next(integral_constant<state::ABORTED>)
    -> decltype(std::declval<Target>().aborted(), void()) {
        static_cast<Target *>(this)->aborted();
    }

    void next(...) const ENTT_NOEXCEPT {}    


### sfinae

    补充一下基于std::void_t的, 以及 

    template <class T>
    struct Void
    {
        typedef void Type;
    }; 
    

### 待研究


### 待研究

std::add_lvalue_reference_t
std::in_place_type
std::is_invocable_v
std::tuple_element_t
std::is_nothrow_move_constructible_v

member function的 const , const& 和 const&&



