---
layout: post
title: 网络库相关
categories: [general]
tags: [socket, epoll]
---

## 感悟 ##
每次查网络库的bug都会走一些弯路，因为网络库已经经历了四五款产品，大家从心里上认为他是稳定的。
甚至每进行一些改动，都要回答，当时剑三为什么没有这样做-_-!!

## 当accept错误码为EMFILE时 ##

这几天在测试gateway的性能，当大量玩家登录时，会出现客户端connect成功，但服务端的epoll_wait没有响应。

增加了日志查这个问题，发现accept出现了失败的情况，错误码除了非堵塞的常出的EAGAIN、EWOULDBLOCK、EINTR之外，
出现了EMFILE（Too many open files），出现几次EMFILE之后，服务端的监听socket就不会触发epoll_wait了。

----------

这儿有两个问题：
### 为什么连接数会达到本进程设置的上限？ ###
同样是一套网络库，同样的的压力，《逍遥江湖》为什么不会？

是《天天爱萌仙》进程设置上的bug，先getrlimit再setrlimit，setrlimit设置的数值就是系统默认的数值。
    
    {% highlight C %}
    rlimit  resLimit;
    
    resLimit.rlim_cur = SHRT_MAX;
    resLimit.rlim_max = SHRT_MAX;
    
    nRetCode = getrlimit(RLIMIT_NOFILE, &resLimit); // bug行，去掉即修复
    XYLOG_FAILED_JUMP(nRetCode == 0); // bug行，去掉即修复
    
    nRetCode = setrlimit(RLIMIT_NOFILE, &resLimit);
    XYLOG_FAILED_JUMP(nRetCode == 0);
    {% endhighlight %}

修复该bug后，《卖个萌仙》的服务端需要以root权限启动了，遭到运营同学的反对，解决方案是，
运维把服务器的打开文件数的软硬限制调整到大于SHRT_MAX，然后服务端程序就可以不以root启动了，
《逍遥江湖》一直要以root启动的原因也应该是这个。

### 为什么epoll_wait没有响应？ ###

在[这个帖子](http://bbs.chinaunix.net/thread-1495863-1-1.html)中，有这样一个问题：

**在memcached里面有一段代码，当accept错误码为EMFILE时会调用listen(sfd,0),为什么要这样调用呢？**
    
    {% highlight C %}
    if ((sfd = accept(c->sfd, (struct sockaddr *)&addr, &addrlen)) == -1) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) {
            /* these are transient, so don't log anything */
            stop = true;
        } else if (errno == EMFILE) {
            accept_new_conns();
            stop = true;
        } else {
            perror("accept()");
            stop = true;
        }
        break;
    }
    
    void do_accept_new_conns(void) {
            update_event(next, 0);
            if (listen(next->sfd, 0) != 0) {
                perror("listen");
            }
    }
    {% endhighlight %}

**有一个回复如下：**

listen()有个队列(或者说内核里面有个队列),
就算服务端没有accept(),客户端也能connect()成功甚至能够发送数据.
一旦程序不能成功accept()队列中已有的连接(比如发生EMFILE),队列会很快变满(进行并发压力测试或者负载很高的情况下),
队列变满之后,监听套接字上便不会再次触发边沿事件,
也就是epoll的ET模式下的事件.
这种情况下即便程序关闭了一些套接字(比如由超时处理关闭)并能够再次进行accept(),
但是程序不会被通知进行accept(), 也就不能继续提供服务了.
所以这种情况要做一下处理.
我通常的做法是发生EMFILE之后定期的epoll_ctl(...MOD...)一下监听套接字以便再次触发.

**另外，**
[libev上相关的讨论](http://search.cpan.org/~mlehmann/EV-4.15/libev/ev.pod#The_special_problem_of_accept\(\)ing_when_you_can't)


## 当send错误码为EAGAIN时 ##