---
layout: post
title: Gtest and GMock
categories: [general, 3rdparty]
tags: [gtest]
---

> 在系统测试阶段找出并修正错误，要比开发者自己完成这一工作多付出 2 倍的努力。而当系统已经交付使用之后找出并修正一个错误，要比系统测试阶段多付出 9 倍的努力。因此，请坚持让开发者进行单元测试吧。    
> *—— Larry Bernstein ，贝尔通信研究院*

C++单元测试框架, [项目主页](http://code.google.com/p/googletest/)

## 断言 Assertions ##

Gtest提供一整套预定义的断言。断言分为两类：名称以`ASSERT_`开头的断言和名称以`EXPECT_`开头的断言。

    * ASSERT_* 断言失败时会终止当前函数，并记录文件名，行号和某些定制的信息。
    * EXPECT_* 断言当失败时仅作记录，继续执行当前函数

断言宏后可以使用输出操作符<<进行相关用例的描述。
	
{% highlight c++ %}
ASSERT_TRUE(ExecuteMgr.Save(szFileName)) << "保存XXXX文件";
EXPECT_TRUE(IsExecuteToday(szFileName)) << "检查文件内容";
{% endhighlight %}

断言宏有Bool检查，整型检查、浮点型检查、字符串检查(char*)、异常检查等

## 事件 Test Events ##
测试执行前通常有一些测试准备工作，执行后有一些清理工作，或者想在用例执行过程中，共享一些数据，这些可以放在事件回调中来做。

1. Global事件，在所有用例执行前和后执行
1. TestSuite事件，在该TestSuite执行前和后执行
1. TestCase事件，在该TestCase执行前和后执行

### 全局事件 ###
	
{% highlight c++ %}
class FooEnvironment : public testing::Environment
{
public:
	virtual void SetUp(){ }
	virtual void TearDown(){ }
};
{% endhighlight %}

### TestSuite事件 ###
{% highlight c++ %}
class FooTest : public testing::Test 
{
protected:
	static void SetUpTestCase(){ }
	static void TearDownTestCase(){ }
};
{% endhighlight %}
		
### TestCase事件 ###

{% highlight c++ %}
class FooCalcTest:public testing::Test
{
protected:
	virtual void SetUp(){}
	virtual void TearDown(){ }
};
{% endhighlight %}
		
## 死亡测试 Death Tests ##
程序宕机处理模块能捕获程序的 除0、非法地址访问、未捕获异常、Abort等程序异常问题，但这个应当怎么来进行单元测试？
死亡测试可以搞定。

{% highlight c++ %}
#define DUMP_TEST_STRING "Success"
#define ASSERT_DUMP_TEST(statement) ASSERT_DEATH(statement, DUMP_TEST_STRING)

class DumperTest : public testing::Test
{
public:
	void SetUp() 
	{
		Dumper::GetInstance().Init();
		Dumper::GetInstance().SetExitProcessOnExceptionFlag(true);
		Dumper::GetInstance().SetOnMiniDumpCreateCallBack(CheckDumper);	
	}

	void TearDown() 
	{
		Dumper::GetInstance().UnInit();
	}	

	static void CheckDumper(int nCaptureSucceed, const char szCrashReporterFile[])
	{
		ASSERT_TRUE(nCaptureSucceed);
		ASSERT_TRUE(File::Exists(szCrashReporterFile));

		fputs(DUMP_TEST_STRING, stderr);
		fflush(stderr);

		File::Delete(szCrashReporterFile);
	}
};

TEST_F(DumperTest, Test_Exit)
{
	ASSERT_DUMP_TEST(exit(3));
}

TEST_F(DumperTest, Test_Abort)
{
	ASSERT_DUMP_TEST(abort());
}

TEST_F(DumperTest, Test_printf_NULL)
{
	ASSERT_DUMP_TEST(printf(NULL));
}
{% endhighlight %}

## 参数化测试 Type-Parameterized Tests ##

比如游戏中的IB商城，通常分为绑金区和金币区，其测试用例有很多相同的，这时候就可以使用参数化测试。
	
{% highlight c++ %}
    class BuyItemTest : public::testing::TestWithParam<int> // 参数化类型的TestSuite
    {
    
    };
    
    TEST_P(BuyItemTest, ItemNotExist) // 使用TEST_P标示为参数化类型的TestCase
    {
    	int nZoneId =  GetParam(); // 使用GetParam获取参数
    	ASSERT_TRUE(Buy(nZoneId, nItemId));
    }
    
    INSTANTIATE_TEST_CASE_P(TrueReturn, BuyItemTest, testing::Values(0, 1));
    // 设定参数
    // 参数1 是测试案例的前缀，可以任意取。 
    // 参数2 是测试案例的名称，需要和之前定义的参数化的类的名称相同，如：BuyItemTest 
    // 参数3 是可以理解为参数生成器，上面的例子使用test::Values表示使用括号内的参数。
{% endhighlight %}

## 参数生成器 ##

函数                                                	| 说明
Range(begin, end[, step])                           | 范围在begin~end之间，步长为step，不包括end
Values(v1, v2, ..., vN)                             | v1,v2到vN的值
ValuesIn(container) and ValuesIn(begin, end)        | 从一个C类型的数组或是STL容器，或是迭代器中取值
Bool()	                                            | 取false 和 true 两个值

## GTest的扩展版GMock ##
[Gmock](http://code.google.com/p/googlemock/)是一套用来模拟类的库，也就是提供单元测试上所需要桩函数。

### Main函数 ###

{% highlight c++ %}
int _tmain(int argc, _TCHAR* argv[])
{
    testing::InitGoogleMock(&argc, argv); 

    return RUN_ALL_TESTS(); 
}
{% endhighlight %}

### 创建mock类 ###

{% highlight c++ %}
class XRoleManager
{
public:
    MOCK_METHOD1(GetRole, XRole* (DWORD dwID)); // 模拟 XRole* GetRole(DWORD dwID);
};
{% endhighlight %}
        

`MOCK_METHOD1` 说明函数拥有一个参数，`GetRole`是函数名，`XRole*`是返回值，`(DWORD dwID)`是参数。

### 实现桩函数 ###

{% highlight c++ %}
EXPECT_CALL(*g_pRoleMgr, GetRole(_)).WillOnce(Return(NULL)); // 期望只执行一次，这一次返回NULL
EXPECT_CALL(*g_pRoleMgr, GetRole(_)).WillRepeatedly(Return(NULL)); // 总是返回为NULL
EXPECT_CALL(*g_pRoleMgr, GetRole(_)).WillRepeatedly(Invoke(GetRole)); // 总是使用指定的GetRole函数模拟该成员函数
{% endhighlight %}

### 使用桩函数 ###
对于全局变量或者函数参数变量的虚函数,桩函数很容易替换上,但对于成员变量,很难搞,要通过模板或者基类指针来替换
