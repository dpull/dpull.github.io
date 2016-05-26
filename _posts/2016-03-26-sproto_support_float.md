---
layout: post
title: Sproto增加浮点数支持
categories: [general]
tags: []
---

[Sproto](https://github.com/cloudwu/skynet/wiki/Sproto) 默认不支持浮点数，
但我们项目在一个模块用到了，而且调用频率还挺高，作为一个懒人，我不想扩展Sproto库:

1. 可能引入bug
1. 更新skynet新版本的时候也麻烦

因为使用频率挺高，使用转为字符串再转回来性能损失挺大，想想直接转为int比较好，
这个方案的前提是客户端和服务端都采用相同的[浮点数标准，如IEEE754](./2011-09-28-std_float)和字节序。

代码如下:
    
{% highlight c %}
static bool check_support() {
    assert(sizeof(int64_t) == sizeof(double)); /*double must be 64bit*/
    assert(0x3ff0000000000000 == ((union float_number){1.0}).i); /*check little-endian and IEEE 754*/
    return true;
}

static int lua_encode_float(lua_State* L) {
    assert(check_support());
    
    union float_number number;
    number.d = lua_tonumber(L, 1);
    lua_pushinteger(L, number.i);
    return 1;
}

static int lua_decode_float(lua_State* L) {
    assert(check_support());
    
    union float_number number;
    number.i = lua_tointeger(L, 1);
    lua_pushnumber(L, number.d);
    return 1;
}
{% endhighlight %}
    
用纯lua也能实现（`string.pack`），但会有临时字符串产生。

C#的BitConverter提供了这个的功能：

{% highlight c# %}
public static double TransferToFloat(this long value)
{
    return BitConverter.Int64BitsToDouble(value);
}

public static long TransferToInt64(this double value)
{
    return BitConverter.DoubleToInt64Bits(value);
}
{% endhighlight %}
