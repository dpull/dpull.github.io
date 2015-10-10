---
layout: post
title: 修复rapidxml对wchar_t支持的bug
categories: [general, 3rdparty]
tags: [rapidxml]
---

rapidxml是性能非常好的xml库，但其对`wchar_t`的支持存在bug。

	
代码中存在着很多类似于`static_cast(ch)`的强制转换，
当ch为 `wchar\_t ch = L'稀'`时，强转为 `unsigned char`为 0，解析出错。

----------

修改如下：

```Diff
Index: rapidxml.hpp
===================================================================
@@ -330,8 +330,19 @@
             else
             {
                 for (const Ch *end = p1 + size1; p1 < end; ++p1, ++p2)
-                    if (lookup_tables<0>::lookup_upcase[static_cast<unsigned char>(*p1)] != lookup_tables<0>::lookup_upcase[static_cast<unsigned char>(*p2)])
-                        return false;
+				{
+					//for unicode character
+					if (*p1 > 0xFF || *p2 > 0xFF)
+					{
+						if (*p1 != *p2)
+							return false;
+					}
+					else
+					{
+						if (lookup_tables<0>::lookup_upcase[static_cast<unsigned char>(*p1)] != lookup_tables<0>::lookup_upcase[static_cast<unsigned char>(*p2)])
+							return false;
+					}
+				}
             }
             return true;
         }
@@ -1046,6 +1057,8 @@
         {
             if (name)
             {
+				if (!m_first_attribute)
+					return 0;
                 if (name_size == 0)
                     name_size = internal::measure(name);
                 for (xml_attribute<Ch> *attribute = m_last_attribute; attribute; attribute = attribute->m_prev_attribute)
@@ -1429,6 +1442,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 0;
+				}
                 return internal::lookup_tables<0>::lookup_whitespace[static_cast<unsigned char>(ch)];
             }
         };
@@ -1438,6 +1456,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
                 return internal::lookup_tables<0>::lookup_node_name[static_cast<unsigned char>(ch)];
             }
         };
@@ -1447,6 +1470,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
                 return internal::lookup_tables<0>::lookup_attribute_name[static_cast<unsigned char>(ch)];
             }
         };
@@ -1456,6 +1484,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
                 return internal::lookup_tables<0>::lookup_text[static_cast<unsigned char>(ch)];
             }
         };
@@ -1465,6 +1498,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
                 return internal::lookup_tables<0>::lookup_text_pure_no_ws[static_cast<unsigned char>(ch)];
             }
         };
@@ -1474,6 +1512,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
                 return internal::lookup_tables<0>::lookup_text_pure_with_ws[static_cast<unsigned char>(ch)];
             }
         };
@@ -1484,7 +1527,12 @@
         {
             static unsigned char test(Ch ch)
             {
-                if (Quote == Ch('\''))
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
+				if (Quote == Ch('\''))
                     return internal::lookup_tables<0>::lookup_attribute_data_1[static_cast<unsigned char>(ch)];
                 if (Quote == Ch('\"'))
                     return internal::lookup_tables<0>::lookup_attribute_data_2[static_cast<unsigned char>(ch)];
@@ -1498,6 +1546,11 @@
         {
             static unsigned char test(Ch ch)
             {
+				//for unicode character
+				if (ch > 0xFF)
+				{
+					return 1;
+				}
                 if (Quote == Ch('\''))
                     return internal::lookup_tables<0>::lookup_attribute_data_1_pure[static_cast<unsigned char>(ch)];
                 if (Quote == Ch('\"'))
@@ -1654,6 +1707,9 @@
                                 src += 3;   // Skip &#x
                                 while (1)
                                 {
+									//for unicode character
+									if (*src > 0xFF)
+										break;
                                     unsigned char digit = internal::lookup_tables<0>::lookup_digits[static_cast<unsigned char>(*src)];
                                     if (digit == 0xFF)
                                         break;
@@ -1668,6 +1724,9 @@
                                 src += 2;   // Skip &#
                                 while (1)
                                 {
+									//for unicode character
+									if (*src > 0xFF)
+										break;
                                     unsigned char digit = internal::lookup_tables<0>::lookup_digits[static_cast<unsigned char>(*src)];
                                     if (digit == 0xFF)
                                         break;
```
