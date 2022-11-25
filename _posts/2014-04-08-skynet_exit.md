---
layout: post
title: 如何安全退出skynet
categories: [general]
tags: [summary]
---

云风有一篇blog讲述了这个问题：[如何安全的退出 skynet](http://blog.codingnow.com/2013/08/exit_skynet.html) 。

我讲讲我们项目实际用法：

## 常用的服务有哪些

- 对数据无修改的被动型服务
    - service服务
    - sharedatad服务
    - datacenterd服务
    - 配置表加载服务
    - webclient服务，用于解析大量http请求
    - 聊天服务（我们的聊天是不存盘的）
    - 组队服务（我们的组队是不存盘的）
    - 战斗服务（我们的战斗数据是存在玩家数据上的）
- 对数据有修改的服务
    - agent服务（存储玩家数据）
    - 玩家数据缓存服务
    - 邮箱服务
    - 好友服务
    - 公会服务
    - 拍卖行服务
- 管理类的服务
    - watchdog服务（管理agent）
    - 数据库服务（所有的数据存储需要通过该服务真正落地）

## 关闭流程

先调用watchdog服务的退出函数，watchdog服务会禁止新agent连接并关闭所有的agent。

当所有的agent关闭后，关闭对数据有修改的服务，如邮箱，好友，公会。

最后关闭数据库服务。

对于对数据无修改的被动型服务，任其自生自灭。

## 退出函数主要流程

1. 停止新消息处理、网络连接
1. 停止fork出的逻辑循环
1. 等待目前挂起的消息处理完成
1. 存盘
1. 退出服务

**这儿的难点是如何等待目前挂起的消息处理完成？**

我们采用了debug库，获取`session_id_coroutine`这个值，
并且做了白名单的过滤，参考代码如下：

{% highlight lua %}
-- ... 省略不重要的函数
local function get_suspend_session()
    local ret = {};

    local _, session_id_coroutine = get_upvalue(skynet.timeout, "session_id_coroutine");
    assert(session_id_coroutine)

    for k, v in pairs(session_id_coroutine) do
        ret[k] = get_suspend_function(v);
    end
    return ret;
end

local function filter_suspend_session(suspend_session) 
    local whitelist = {"@./lualib/sharedata.lua"}

    for k, session_v in pairs(suspend_session) do
        for _, whitelist_v in ipairs(whitelist) do
            if session_v.source == whitelist_v then
                suspend_session[k] = nil;
                break;
            end
        end
    end
end

local function wait_suspend_session_exit(timeout_second, disable_log)
    local timeout = skynet.now() + timeout_second * 100;
    while true do
        local suspend_session = get_suspend_session();
        filter_suspend_session(suspend_session);

        if not next(suspend_session) then
            return true;
        end
        
        if skynet.now() > timeout then
            if not disable_log then
                log_suspend_session(suspend_session);
            end
            return false, suspend_session;
        end

        skynet.sleep(1);
    end
end
{% endhighlight %}

