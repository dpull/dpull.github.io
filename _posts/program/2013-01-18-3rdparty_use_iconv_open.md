---
layout: post
title: iconv对windows unicode支持的问题
categories: [general, 3rdparty]
tags: [iconv]
---

`iconv_open` 提供了两个参数`char`，`wchar_t`,用来根据本地设置决定to或者from的编码。
不过在windows下，如果参数为`wchar_t`，返回-1（失败），（版本libiconv-1.9.2），
翻看代码后得知，原来其对windows支持有问题。

----------

windows的`wchar_t`对应的编码为`UTF-16LE`，在libiconv对应为`ei_utf16le`。
	
    {% highlight C %}
    char stringpool_str544[sizeof("UTF-16LE")];
    {(int)(long)&((struct stringpool_t *)0)->stringpool_str544, ei_utf16le}, 
    {% endhighlight %}    

然而libiconv在windows下把`wchar_t`解析为`ei_ucs2internal`
	
    {% highlight C %}
    char stringpool_str350[sizeof("WCHAR_T")]; 
     {(int)(long)&((struct stringpool_t *)0)->stringpool_str350, ei_local_wchar_t}, 
     
        if (ap->encoding_index == ei_local_wchar_t) {
    #if __STDC_ISO_10646__
          if (sizeof(wchar_t) == 4) {
            to_index = ei_ucs4internal;
            break;
          }
          if (sizeof(wchar_t) == 2) {
            to_index = ei_ucs2internal;
            break;
          }
          if (sizeof(wchar_t) == 1) {
            to_index = ei_iso8859_1;
            break;
          }
    #endif
    #if HAVE_MBRTOWC
          to_wchar = 1;
          tocode = locale_charset();
          continue;
    #endif
          goto invalid;
        }
    {% endhighlight %}    

**补充：**
libiconv在windows下把`char`使用`locale_charset`确定其编码，所以一定要`setlocale(LC_CTYPE,"");`

    {% highlight C %}
    char stringpool_str37[sizeof("CHAR")];
     {(int)(long)&((struct stringpool_t *)0)->stringpool_str37, ei_local_char},
    
        if (ap->encoding_index == ei_local_char) {
          tocode = locale_charset();
          /* Avoid an endless loop that could occur when using an older version
             of localcharset.c. */
          if (tocode[0] == '\0')
            goto invalid;
          continue;
        }
    {% endhighlight %}    