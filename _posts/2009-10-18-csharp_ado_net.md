---
layout: post
title: ADO.NET 总结
categories: [general]
tags: [c#]
---

## 使用DbConnection要记得手工关闭 ##

上次不小心调用DbConnection后忘记手工关闭了，原以为它会和Stream一样，
在生命周期结束之后就会自己关闭掉，但事实证明，不是这样的，看MSDN是这样说的：

> **Close 方法回滚任何挂起的事务。然后，它将连接释放到连接池，或者在连接池被禁用的情况下关闭连接。**
> 应用程序可以多次调用 Close。不会生成任何异常。 
> 如果 DbConnection 超出范围，则不会将其关闭。因此，必须通过调用功能上等效的 Close 或 Dispose 显式关闭该连接。
> 如果将连接池值 Pooling 设置为 true 或 yes，则也会释放物理连接。

## 使用DbProviderFactories并扩充兼容mysql ##
ADO.NET2.0 为各种ADO.NET类引入了一个提供程序工厂的模型以及通用基类。

### ADO.NET通用接口的限制 ###
-  接口不易扩展 ADO.NET1.1无法创建某些类的实例
-  ADO.NET1.1无法判断可用的.NET数据提供程序。

#### 提供工厂模型如何解决上述限制 ####
-  通过抽象积累来扩展ADO,NET模型
-  使用DbProviderFactory类来创建对象

#### 提供程序工厂模型的限制 ####
-  许多查询结构都是数据库特有的
-  为参数化查询设置CommandText时，可能需要提供程序特有的代码
-  指定参数数据类型可能需要提供程序特有的代码

为了使开发的代码通用，不局限于特定的数据库，本次开发中决定使用DbProviderFactory+标准SQL，
以开发一个适用于mysql和sqlserver的封装，但DbProviderFactories
并没有提供对mysql的DbProviderFactory的支持，
所以需要扩充DbProviderFactories类兼容mysql, 而且在ADO.net
2.0中mysql和sqlserver的ParameterMarkerFormat都有bug，所以扩展类顺带解决这个bug

{% highlight c# %}
public static class DbProviderFactoryEx
{
    public static DbProviderFactory GetFactory(string providerName)
    {
        if (providerName == null)
            throw new ArgumentNullException("providerName");

        switch (providerName)
        {
            case "MySql.Data.MySqlClient":
                return new MySqlClientFactory();

            default:
                return DbProviderFactories.GetFactory(providerName);
        }
    }

    public static string GetParameterMarkerFormat(DbConnection connect)
    {
        if (connect == null)
            throw new ArgumentNullException("connect");

        Type type = connect.GetType();
        if (type == typeof(MySql.Data.MySqlClient.MySqlConnection))
            return MySqlParameterMarkerFormat;//mysql bug
        else
        if (type == typeof(System.Data.SqlClient.SqlConnection))
            return SqlServerParameterMarkerFormat;//ms bug

        connect.Open();
        string result = 
            connect.GetSchema("DataSourceInformation").Rows[0]["ParameterMarkerFormat"].ToString();
        connect.Close();
        return result;
    }

    public static readonly string SqlServerParameterMarkerFormat = "@{0}";
    public static readonly string MySqlParameterMarkerFormat = "?{0}";
}
{% endhighlight %}

## 开启sql2005远程连接功能 ##
连接到SQL Server 2005时，在默认的设置下SQL
Server不允许进行远程连接，需要自己手工开启，详细步骤如下： 

	开始 -->
	 所有程序 --> 
	  Microsoft SQL Server 2005 --> 
	   Configuration Tools --> 
	    SQL	Server Surface Area Configuration --> 
		 Surface Area Configuration for	Services and Connections --> 
		  MSSQLSERVER节点下的Database Engine 节点 -->
		   Remote Connections --> 
			Local and remote connections --> 
			 选择Using Tcp/Ip	only 或 Using both Tcp/Ip and named pipes
	
	开始 --> 
	 所有程序 --> 
	  Microsoft SQL Server 2005 --> 
	   Configuration Tools --> 
		SQL Server configuration Manager --> 
		 重启数据库服务.

## 使用MySql中文乱码问题 ##
### 有权限修改my.ini ###
    {% highlight ini %}
    [mysqld]
    default-character-set=utf8
    {% endhighlight %}
        

### 没有权限修改my.ini ###
假设数据库采用了默认编码latin1，经研究发现：

1. Select出的数据需要将其从拉丁文转化为GBK
1. 传入的SQL语句需要将其从GBK转化为拉丁文 

**实现：**

{% highlight c# %}
public static class DBHelper
{
   public static T Get<T>(DbDataRecord record, string field)
   {
       int num = record.GetOrdinal(field);
       if (record.IsDBNull(num))
           return default(T);

       return (T)record[num];
   }

   public static int? ToInt32(object value)
   {
       if (value == null)
           return null;

       return ((IConvertible)value).ToInt32(null);
   }

   public static void AddParameter(string name, object value, DbCommand cmd)
   {
       DbParameter para = cmd.CreateParameter();
       para.ParameterName = string.Format(ParameterMarkerFormat, name);
       if (value == null)
           para.Value = DBNull.Value;
       else
       para.Value = value;
       cmd.Parameters.Add(para);
   }


   public static String LatinToGBK(String str)
   {
       try
       {
           byte[] bytesStr = Encoding.GetEncoding("latin1").GetBytes(str);
           return Encoding.GetEncoding("GB2312").GetString(bytesStr);
       }
       catch
       {
           return str;
       }
   }

   public static String GBKToLatin(String str)
   {
       try
       {
           byte[] bytesStr = Encoding.GetEncoding("GB2312").GetBytes(str);
           return Encoding.GetEncoding("latin1").GetString(bytesStr);
       }
       catch
       {
           return str;
       }
   } 
   public static string ParameterMarkerFormat = 
       DbProviderFactoryEx.SqlServerParameterMarkerFormat;
}
{% endhighlight %}


**应用：**

{% highlight c# %}
// 处理DbDataReader
using (DbDataReader reader = cmd.ExecuteReader())
{
    foreach (DbDataRecord record in reader)
    {
        role.ID = DBHelper.Get<uint>(record, "ID");
        role.Name = DBHelper.LatinToGBK(DBHelper.Get<string>(record, "RoleName"));
        role.Account = DBHelper.LatinToGBK(DBHelper.Get<string>(record, "Account"));
        return true;
    }
}

// 处理DataTable
foreach (DataRow row in table.Rows)
{
    row["OperationType"] = DBHelper.LatinToGBK(row["OperationType"].ToString());
    row["OperationReason"] = DBHelper.LatinToGBK(row["OperationReason"].ToString());
}

// 传入的SQL语句
DbCommand cmd = conn.CreateCommand();
cmd.CommandText = "select * from role where rolename=?rolename";
DBHelper.AddParameter("rolename", DBHelper.GBK2Latin(name), cmd);   
{% endhighlight %}

## 避免SQL注入和特殊字符的一种方法 ##

避免SQL注入和特殊字符的办法有很多，不同数据库也有不同数据库的解决方案，ADO.NET中使用DbCommand.Parameters解决这个问题，为了了解他的原理，我查了一下.NET中SQLCommand的源代码和MySQL.NET中MySQLCommand的源代码。

.NET源代码超级难跟踪，貌似是用了SQL
Server独有的特性，把参数的名称、类型、把值的二进制都传给了SQL Server
API，具体没有跟到。

MySQL实现就很简单了，他会把字符串类型的参数value使用一个过滤数组来过滤，在过滤字符前面加上“\\”，我认为这是一种通用的做法，虽然效率上不如SQLCommand好，但是和容易移植更容易看懂！
使用PHP+MySQL做网站的同学也可以利用着类似的思想生成安全的SQL连接串，我看了PHPWind数据库处理函数，貌似并没有对所有的过滤字符进行处理，这就存在着一些安全隐患。
源代码

{% highlight c# %}
private static string stringOfBackslashChars = "\u005c\u00a5\u0160\u20a9\u2216\ufe68\uff3c";        
private static string stringOfQuoteChars = "\\u0027\\u00b4\\u02b9\\u02ba\\u02bb\\u02bc\\u02c8\\u02ca\\u02cb\\u02d9\\u0300\\u0301\\u2018\\u2019\\u201a\\u2032\\u2035\\u275b\\u275c\\uff07";    

public static string EscapeString(string value)        
{            
    StringBuilder sb = new StringBuilder();            
    foreach (char c in value)            
    {                
        if (stringOfQuoteChars.IndexOf(c) >= 0 || stringOfBackslashChars.IndexOf(c) >= 0)    
            sb.Append("\\");  

        sb.Append(c);            
    }            
    return sb.ToString();        
}
{% endhighlight %}
