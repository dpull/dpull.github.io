---
layout: post
title: hive sql 耗时优化
categories: [general]
tags: []
---

最近在做一些数据分析工作，每个指标需要执行10条SQL语句，监控三个指标，耗时一小时左右，后来指标增加成五十多个，耗时变成了十多个小时，计算资源不够时会更久。

主要在两个方向优化：

1. 增加并行
1. 减少的数据量

## 增加并行

通过增加并行，可以同时执行多条SQL语句，达到优化时间的目的，hive 可并行的SQL语句有：

    FROM from_statement
    INSERT [OVERWRITE] TABLE tablename1[COLUMNLIST] select_statement1
    [INSERT [OVERWRITE] TABLE tablename2[COLUMNLIST] select_statement2] ...
    COLUMNLIST : (col1 { , coli }*)

    SELECT *
    FROM (
    select_statement
    UNION [ALL]
    select_statement
    ) unionResult

## 减少的数据量

通过并行并不能降低太多的时间，毕竟还有计算资源不足的问题，因为大部分的SQL语句都是在统计个数或者统计去重的个数，可以通过 'group by' 的方式降低数据量级，再通过并行的方式进行数据计算。

我尝试了以下几种办法，降低并行查询时的数据量级：

1. with语句

    with tmp as (select_statement)
    SELECT * FROM (
        select_statement from tmp
        union all
        select_statement from tmp
        union all
        select_statement from tmp
    )

这种方式是无效的，通过'explain'可以看出，这只是一个语法糖。

1. 视图

    create view tmp select_statement;
    SELECT * FROM (
        select_statement from tmp
        union all
        select_statement from tmp
        union all
        select_statement from tmp
    );
    drop view tmp;

这种方式是无效的，Hive不支持物化的视图，这个和使用with语句在时间消耗上没啥区别

1. 临时表

    create table tmp select_statement;
    SELECT * FROM (
        select_statement from tmp
        union all
        select_statement from tmp
        union all
        select_statement from tmp
    );
    drop table tmp;

这种方式是可以的，但是创建了一张临时表，有IO操作。
