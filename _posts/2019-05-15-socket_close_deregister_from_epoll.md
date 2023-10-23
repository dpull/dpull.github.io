---
layout: post
title: close socket时是否需要从epoll中取消注册?
categories: [general]
tags: [socket, epoll]
---

在[epoll文档](https://man7.org/linux/man-pages/man7/epoll.7.html) 中，有如下问答：

> Q: Will closing a file descriptor cause it to be removed from all epoll interest lists?
> 
> A: Yes, but be aware of the following point.  A file descriptor is a reference to an open file description (see open(2)). Whenever a file descriptor is duplicated via dup(2), dup2(2), fcntl(2) F_DUPFD, or fork(2), a new file descriptor referring to the same open file description is created.  An open file description continues to exist until all file descriptors referring to it have been closed.
> 
> A file descriptor is removed from an interest list only after all the file descriptors referring to the underlying open file description have been closed. This means that even after a file descriptor that is part of an interest list has been closed, events may be reported for that file descriptor if other file descriptors referring to the same underlying file description remain open.  
         
由此可知，如果文件描述符全部关闭，内核会自动从 epoll 中取消注册。
但如果使用 dup 或者 fork 等函数产生过引用，则进程关闭 socket 不会自动取消注册。这时候可能会出现 epoll_wait 函数返回已经被关闭的 socket。
为了避免这种情况，通用的做法是明确地从 epoll 中取消注册 socket。