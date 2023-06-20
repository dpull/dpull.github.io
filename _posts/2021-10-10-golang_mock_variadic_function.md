---
layout: post
title: gomock 可变参函数匹配
categories: [general]
tags: [golang]
---

{% highlight go %}
type test interface {
	sum(title string, arg ...int)
}
{% endhighlight %}

对于可变参函数sum，如果无法确定参数的个数，可以使用一个gomock.Any()进行匹配。这样做可以使测试用例适用于不同个数的参数情况:

{% highlight go %}
func TestCall0(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mti := NewMocktest(ctrl)
	mti.EXPECT().sum(gomock.Any(), gomock.Any()).Times(3)

	mti.sum("s")
	mti.sum("s", 1)
	mti.sum("s", 1, 2)
}
{% endhighlight %}

如果能确定参数的个数或具体的值，则可以使用精确匹配:

{% highlight go %}
func TestCall1(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mti := NewMocktest(ctrl)
	mti.EXPECT().sum(gomock.Any()).Times(1)
	mti.EXPECT().sum(gomock.Any(), gomock.Any()).Times(1)
	mti.EXPECT().sum(gomock.Any(), gomock.Any(), gomock.Any()).Times(1)

	mti.sum("s")
	mti.sum("s", 1)
	mti.sum("s", 1, 2)
}
{% endhighlight %}

gomock还支持部分精确匹配和部分模糊匹配，这种情况下可以使用一个gomock.Any()作为通配符来匹配部分值:

{% highlight go %}
func TestCall2(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mti := NewMocktest(ctrl)
	mti.EXPECT().sum(gomock.Any()).Times(1)
	mti.EXPECT().sum(gomock.Any(), gomock.Any()).Times(2)

	mti.sum("s")
	mti.sum("s", 1)
	mti.sum("s", 1, 2)
}

func TestCall3(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mti := NewMocktest(ctrl)
	mti.EXPECT().sum(gomock.Any(), gomock.Any()).Times(2)
	mti.EXPECT().sum(gomock.Any(), gomock.Any(), gomock.Any()).Times(1)

	mti.sum("s")
	mti.sum("s", 1)
	mti.sum("s", 1, 2)
}
{% endhighlight %}
