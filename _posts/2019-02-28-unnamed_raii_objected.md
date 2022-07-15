---
layout: post
title: 未命名对象的析构时机
categories: [general]
tags: []
---

这两天查到了一个RAII用错的bug, 记录一下. 错误代码如下:

{% highlight cpp %}
#define SCOPED_SCENE_READ_LOCK(pxScene) physx::PxSceneReadLock(*pxScene, __FILE__, __LINE__)
{% endhighlight %}

这段代码本意是使用宏封装读写锁, 利用RAII特性, 当作用域结束的时自动释放掉锁.

但宏中没写变量名, 成了一个未命名对象, 其生命周期是声明后立即释放, 未达到给代码块加锁的目的.

以下是验证代码:

{% highlight cpp %}
struct test_obj {
        test_obj(const char *s) {
                printf("test_obj constructor:%s\n", s);
        }

        ~test_obj() {
                printf("test_obj destructor\n");
        }
};

void test_unnamed() {
        test_obj("test_unnamed");
        printf("test_unnamed\n");
}

void test_named() {
        test_obj o("test_named");
        printf("test_named\n");
}
{% endhighlight %}

当执行`test_unnamed`时, 输出为:

{% highlight bash %}
test_obj constructor:test_unnamed
test_obj destructor
test_unnamed
{% endhighlight %}

当执行`test_named`时, 输出为:

{% highlight bash %}
test_obj constructor:test_named
test_named
test_obj destructor
{% endhighlight %}

## 避免方法

VS下会提示[C26444](https://docs.microsoft.com/en-us/cpp/code-quality/c26444)的警告