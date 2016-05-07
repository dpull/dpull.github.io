---
layout: post
title: docker初体验
categories: [general]
tags: []
---

## 为何用docker

一直以来我们是一台服务器部署一套服务端，
最近有需求要服务器运行多个服务端，
我不想增加运维人员的学习成本（其实是不想自找麻烦，他们配错了，我擦屁股）。

docker正好能解决这个问题，于是决定趁五一假期期间，学习部署一下。

教程：[Docker —— 从入门到实践](https://www.gitbook.com/book/yeasy/docker_practice/details)

## 安装 docker 和 docker镜像

参考教程 [Installation on CentOS](https://docs.docker.com/engine/installation/linux/centos/) 安装docker，官方下载镜像太慢了，可以使用国内的镜像库加速，如阿里云。

## 部署思路
在一台机器上部署一个数据库的容器和多个服务器容器。
服务器容器通过[容器互联](https://yeasy.gitbooks.io/docker_practice/content/network/linking.html)连接数据库容器。
服务器容器通过[端口映射](https://yeasy.gitbooks.io/docker_practice/content/network/port_mapping.html)保证外网可访问。

### 服务端容器
因为还在开发期，频繁更新，所以没有将服务端内置于镜像中，而是通过[数据卷](https://yeasy.gitbooks.io/docker_practice/content/data_management/volume.html)的方式挂载上。

## 遇到的问题

[Centos 7 docker 启动容器iptables报No chain/target/match by that name](http://www.lxy520.net/2015/09/24/centos-7-docker-qi-dong-bao/)


## 常用命令
{% highlight shell %}
sudo service docker restart
sudo docker run centos:7 ls
sudo docker ps -a
docker rm $(docker ps -a -q)
sudo docker run -d -p 5555:7777 -v /root/code/DSF:/opt/dsf --name server1 centos:7 /opt/dsf/Server/run.sh
iptables -L -n
vi /etc/sysconfig/iptables
{% endhighlight %}

