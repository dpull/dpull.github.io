---
layout: post
title: 使用策略模式规划基础流程
categories: [general, dotnet]
tags: [csharp]
---

## 问题 ##
游戏中，通常会有很多通用的流程，
例如消耗代币（人民币）的流程，首先要看是否能购买，然后提醒消耗多少代币用于做什么，如果代币不够要显示去充值，购买成功后相应的回调。
消耗代币购买不同的物品时，提示是不同的，能否购买的条件是不同的。

对于这个需求，有一种实现是提供实现一个模块，通过配置表，根据不同的配置，组合起该功能，需求变更时，很容易出现已有功能出现问题，
实现不好的时候甚至会引来很多潜规则，导致很难维护，例如逍遥江湖中有一个模块叫 degree_ctrl，它的功能是管理玩家的次数，比如：玩家每天可以玩某个玩法几次，或者每天可以涨几次，但最多累计几次。
但后来这个简单的模块却充满了各种潜规则，首先vip会导致玩家最大次数不同，实现该功能的程序想，这也应当是次数管理模块支持的，
后来部分功能又增加了根据游戏开服时间增加次数，比如说开服一周以内，只能每天打一次战场，但开服两周后，能打两次战场，再后来又增加了一些补丁。
它已经不是最初设计的简单功能，配置很复杂，改动后极容易带来小问题。（题外话：自从我负责的上个项目起，该模块已经回归到最简，对于vip等功能，我建议是业务逻辑层通过多个key进行配置。）


## 我的思路 ##

对于消耗代币的流程，我认为用策略模式是一个不错的选择，定一些接口，根据不同的物品，选用不同的策略。
然后对于一些共性较大的物品，可以采用一个相同的策略，然后该策略通过查配置表的方式，返回不同的结果，当该物品不满足该策略的时候，把它移出该策略。

它和通常的实现有一个明显不同点是，它支持多种策略，没有必要写一个支持所有需求的通用策略，当一个物品的策略改变时，不建议修改通用策略，而是将其独立出来。

