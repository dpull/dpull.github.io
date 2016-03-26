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

因为使用频率挺高，使用转为字符串再转回来性能损失挺大，想想直接转为int比较好，代码如下:

    static int lua_encode_float(lua_State* L) {
        assert(sizeof(int64_t) == sizeof(double));
        
        double d = lua_tonumber(L, 1);
        int64_t i;
        memcpy(&i, &d, sizeof(i));
        lua_pushinteger(L, i);
        return 1;
    }

    static int lua_decode_float(lua_State* L) {
        assert(sizeof(int64_t) == sizeof(double));
        
        int64_t i = lua_tointeger(L, 1);
        double d;
        memcpy(&d, &i, sizeof(d));
        lua_pushnumber(L, d);
        return 1;
    }
    
用纯lua也能实现（`string.pack`），但会有临时字符串产生。


Unity的C#版本无法用指针，要产生临时数组了，代码如下：

	public static long EncodeFloat(double number)
	{
		var data = BitConverter.GetBytes(number);
		return BitConverter.ToInt64(data, 0);
	}

	public static double DecodeFloat(long number)
	{
		var data = BitConverter.GetBytes(number);
		return BitConverter.ToDouble(data, 0);
	}







