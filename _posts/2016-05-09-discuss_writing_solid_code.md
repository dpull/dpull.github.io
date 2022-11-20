---
layout: post
title: [note]《编程精粹：编写高质量C语言代码》讨论会
categories: [general]
tags: []
---

春节后，我们团队一起学完了《编程精粹：编写高质量C语言代码》，
今晚每人从书中抽三条结合项目中的代码进行分享，以下是部分例子的整理：

## 一开始就要阻止错误的发生
加载配置文件时对其进行检查，可以防止由于配置文件的错误产生的运行时发生错误。

比如商城配置文件的检查：

{% highlight lua %}
-- 代码略
{% endhighlight %}    

## 错误代码是否作为正常返回值的特殊情况而隐藏起来?
当可接受任务时返回null，否则返回失败原因，这个函数违反了以上规范。

{% highlight c# %}
public override string CanAccept (TaskSetting setting)
{
    var msg = base.CanAccept (setting);
    if(msg != null)
        return msg;
    
    if(!string.IsNullOrEmpty(setting.Degree) && DegreeCtrl.Instance.GetCurDegree(setting.Degree) <= 0)
        return "今天的任务已完成，下次再来吧";
    
    return null;
}
{% endhighlight %}

## 要使用断言对函数参数进行确认
以下是修改后的代码，原本没有`Debug.Assert`一行。

> 我认为这儿抛出异常比使用Assert更好。

{% highlight c# %}
public Player GetPlayer(int playerId)
{
    Debug.Assert(playerId > 0);

    var actor = GetActor(playerId);
    if (actor == null)
        return null;

    return actor as Player;
}
{% endhighlight %}        

## 消除所做的隐式假定，或者利用断言检查其正确性
这个错误很明显，当出错时返回了默认的值，让程序错误的运行下去。

{% highlight lua %}
local function GetActorId(camp, profession, isMale)
    for k, v in pairs(GD.Setting.PlayerModelSetting) do
        if v.Camp == camp and v.Profession == profession and v.IsMale == isMale then
            return v.ActorId;
        end
    end

    Log.Error("PlayerModelSetting 异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常异常");
    return "SiRenYao1";
end
{% endhighlight %}

## 对程序进行逐条跟踪 对每一条代码路径进行逐条的跟踪
最后一行的格式字符串写错了，因为没有逐条跟踪，导致错误被隐藏。

{% highlight c# %}
public static void CheckSetting()
{
    List<string> checkResult = new List<string>();
    
    foreach(var key in Settings)
    {
        SignInItemSetting setting = key.Value;
        
        if (string.IsNullOrEmpty(setting.SignInItemId))
            checkResult.Add(string.Format("RewardId:{0}\t RewardId is null or empty", key));

        if(ItemSetting.GetSetting(setting.ItemTemplateId) == null)
            checkResult.Add(string.Format("RewardId:{0}\t 物品表里不存在该物品:{2}", key, setting.ItemTemplateId));
    }
}
{% endhighlight %}

## 不要模棱两可,要明确地定义函数的参数
由注释可以看出，此处对错误的参数进行了支持。

{% highlight c# %}
// 富文本显示bug修改：当图片不存在时，显示代表图片的文字
// 代码略
{% endhighlight %}

    