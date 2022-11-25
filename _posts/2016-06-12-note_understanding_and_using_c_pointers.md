---
layout: post
title: 《深入理解C指针》
categories: [general, note]
tags: []
---

端午假期读了这本《深入理解C指针》。

## 字面量
声明字符串的方式有三种：字面量、字符数组、字符指针。

使编译器能够为相同字符串创建单个副本，从而得到较小的程序，这种优化称为字面量池。
字面量池是只读的，可以使用 `-fwritable-strings` 命令关闭字面量池，就能读写字面量了。

## 强别名

强别名不允许一种类型的指针成为另一种类型的指针的别名。

{% highlight c %}
/*
GCC的O2默认开启了 -fstrict-aliasing
可以使用 -fno-strict-aliasing 关闭掉，
注意，只能在O2及其以上开启或关闭。
*/
int32_t test(int32_t* num1, int16_t *num2)
{
    *num1 = 1;
    *num2 = *num1 + 2;
    return *num1;
}

int main()
{
    int32_t num = atoi(argv[1]);                    /*O2        O0  */
    printf("test(num):%d\n", test(&num, &num));     /*1         3   */
    printf("num:%d\n", num);                        /*3         3   */
    return 0;
}
{% endhighlight %}

在开启强别名的时候，test的返回值计算进行了优化，
忽略了 `*num2 = *num1 + 2`。

避免强别名可以有以下几种方法：

1. 使用联合体
1. 关闭强别名
1. 使用char指针

## restrict 关键字
C编译器默认假设指针有别名，
用`restrict`关键字可以在声明指针时告诉编译器这个指针没有别名，
这样就允许编译器产生更高效的代码。

如果使用了别名，那么执行代码会导致未定义的行为，
**编译器不会因为破坏别名假设而提供任何警告信息**。

{% highlight c %}
int test(int* restrict num1, int* restrict num2)
{    
    *num1 = 1;
    *num2 = *num2 + 2; 
    return *num1; 
}

int main(int argc, const char * argv[])
{
    int num = atoi(argv[1]);                        /*有        无restrict  */
    printf("test(num):%d\n", test(&num, &num));     /*1         3   */
    printf("num:%d\n", num);                        /*3         3   */
    return 0;
}
{% endhighlight %}

## sizeof('A')

{% highlight c %}
int main(int argc, const char * argv[])
{
    char ch = 'A';
    printf("ch %u\n", sizeof(ch)); /* 1 */
    printf("A %u\n", sizeof('A')); /* 4 */
    return 0;
}
{% endhighlight %}

字符常量是单引号引起来的字符序列。
字符常量通常由一个字符组成，也可以包含多个字符，比如转义字符。
在C中，它们的类型是int。
这个看似异常的现象乃语言设计者有意为之。
