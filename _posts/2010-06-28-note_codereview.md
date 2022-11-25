---
layout: post
title: 「note」代码审查，权利和责任
categories: [general, note]
tags: []
---

代码审查是保证项目健康发展的一个重要方面。它可以在缺陷进入产品之前就发现并改正它们，
从而使得人们从查找并改正问题的痛苦中解脱出来。代码审查代价也比较低。
假设你的团队想要实施代码审查，很重要的一点是把预期结果清晰地列出来。没有一些标准的话，
代码审查很容易变得有争议。以下内容是我在代码审查过程中看到的权利和义务。

## 参与者 ##
- 审查者 －审查代码的人（们）。他们的工作就是阅读代码，并提出意见。 
- 被审查者 －被审查代码的作者。他们负责对审查者的意见作出反馈，并修改错误。

## 必改问题 ##
审查者会对代码的很多方面提出意见。一些意见需要被审查者修改其代码。其它意见则只是建议。
必改问题包括：

- bugs － 代码没有达到预期结果。会崩溃，泄露内存，行为错误等等。
- 潜在的维护问题 －代码是正确的，但不容易维护。例如魔数，糟糕的变量名，缺少间接引用，缺少注释等等。
- 违反代码规范 －如果团队内有一套代码规范，那么就必须遵守它。任何不符之处必须修改。

## 建议 ##
其它内容则只是建议。审查者会提出意见，不过只是建议性的。被审查者没有必要去修改。这些内容包括：

- 架构方面的建议 －审查者认为有更好的办法来完整任务。被审查者在经过深思熟虑后，如果不同意的话可以拒绝。
- 风格问题 － 审查者从不会写成那个样子。真好玩。

## 代码的所有权 ##
在我的团队里是没有所谓代码所有权一说的。有些人会经常接触特定的代码，甚至是这些代码的最初创建者。
但这并没有给予他们对代码的特殊权利。人们也不必先获得代码最初作者的允许才能修改代码。
但如果修改之前不去咨询一下作者或者目前的维护者，那么就真是太傻了，
因为代码作者或维护者对代码很了解，咨询一下他们会使得修改更容易更好。
但修改者并无义务去遵循得到的建议。

*Steve Rowe发表于2008年8月13日 星期三*

# Code Review Rights and Responsibilities #
Code reviews are an important part of any project's health. They are
able to find and correct code defects before making it into the product
and thus spare everyone the pain of having to find them and take them
out. They are also relatively cheap. Assuming your team wants to
implement code reviews, it is important to lay out the expectations
clearly. Code reviews can be contentious without some guidelines. What
follows are the rights and responsibilities as I see them in the code
review process.

## Participants: ##
- Reviewer Person (or persons) reviewing the code.  It is their job to read the code in question and provide commentary on it.
- Reviewee Person whose code is being reviewed.  They are responsible for responding to the review and making necessary corrections.

## Must Fix Issues: ##

A reviewer may comment on many aspects of the code under review.  
Some of the comments will require the reviewee to change his code.  
Others will be merely recommendations. 
Must fix issues are:

- Bugs The code doesn't do what it was intended to do.  It will crash, leak memory, act erroneously, etc.
- Potential maintenance issues The code is not broken, but is written in such a way that it will be hard to maintain.  Examples might be magic numbers, poorly named variables, lack of indirection, lack of appropriate comments, etc.
- Coding standard violations If the group has a coding standard, it must be followed.  Deviations from it must be fixed when pointed out.

## Recommendations: ##

Other items are merely recommendations.  The reviewer can comment on them, but the comments are only advisory.  The reviewee is under no obligation to fix them.  These include:

- Architectural recommendations The reviewer thinks there is a better way to accomplish the goal.  Seriously consider changing these, but the reviewee can say no if he disagrees.
- Style issues The reviewer wouldn\'t have done it that way.  Fascinating.

## Code Ownership: ##
In my teams there is no ownership of code.  Some people touch certain pieces of code most often and may even have written the code initially.  That doesn\'t give them special rights to the code.  The person changing the code now does not need to get the initial writer's permission to make a change.  He would be a fool not to consult the author or current maintainer because they will have insights that will help make the fix easier/better, but he is under no obligation to act upon their advice. 

*Published Wednesday, August 13, 2008 10:55 AM by SteveRowe*
