---
layout: post
title: 变量声明
categories: [general]
tags: [c]
---

有一道思科的面试题
		
{% highlight c %}
    const int x = 5; 
    int main() 
    { 
        int x = x; 
        printf("%d\n",x); 
        return 0; 
    } 
    // 输出是 1994628660 
    // 随机结果 
    
    const int x = 5; 
    int main() 
    { 
        int x[x]; 
        printf("%d\n",sizeof(x)/sizeof(int)); 
        return 0; 
    } 
    // 该题输出为 5. 
{% endhighlight %}
        

这道题主要考查的是C++标准，Point of declaration一节

==========

## Point of declaration ##

> 1 The point of declaration for a name is immediately after its complete
> declarator (clause 8) and before its initializer (if any), except as
> noted below. [Example: int x = 12; { int x = x; } Here the second x is
> initialized with its own (indeterminate) value. ]
> 
> 2 [Note: a nonlocal name remains visible up to the point of declaration
> of the local name that hides it.[Example: const int i = 2; { int i[i]; }
> declares a local array of two integers. ] ]
> 
> 3 The point of declaration for an enumerator is immediately after its
> enumerator-definition. [Example: const int x = 12; { enum { x = x }; }
> Here, the enumerator x is initialized with the value of the constant x,
> namely 12. ]
> 
> 4 After the point of declaration of a class member, the member name can
> be looked up in the scope of its class. [Note: this is true even if the
> class is an incomplete class. For example, struct X { enum E { z = 16 };
> int b[X::z]; // OK }; —end note]
> 
> 5 The point of declaration of a class first declared in an
> elaborated-type-specifier is as follows: — for an
> elaborated-type-specifier of the form class-key identifier ; the
> elaborated-type-specifier declares the identifier to be a class-name in
> the scope that contains the declaration, otherwise — for an
> elaborated-type-specifier of the form class-key identifier if the
> elaborated-type-specifier is used in the decl-specifier-seq or
> parameter-declaration-clause of a function defined in namespace scope,
> the identifier is declared as a class-name in the namespace that
> contains the declaration; otherwise, except as a friend declaration, the
> identifier is declared in the small- est non-class,
> non-function-prototype scope that contains the declaration. [Note: if
> the elaborated- type-specifier designates an enumeration, the identifier
> must refer to an already declared enum-name. If the identifier in the
> elaborated-type-specifier is a qualified-id, it must refer to an already
> declared class-name or enum-name. See 3.4.4. ]
> 
> 6 [Note: friend declarations refer to functions or classes that are
> members of the nearest enclosing namespace, but they do not introduce
> new names into that namespace (7.3.1.2). Function declarations at block
> scope and object declarations with the extern specifier at block scope
> refer to delarations that are members of an enclosing namespace, but
> they do not introduce new names into that scope. ]
> 
> 7 [Note: For point of instantiation of a template, see 14.6.4.1 . ]
