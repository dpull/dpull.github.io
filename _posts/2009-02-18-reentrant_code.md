---
layout: post
title: 使用可重入函数进行更安全的信号处理
categories: [general]
tags: []
---

[原文](https://www.ibm.com/developerworks/cn/linux/l-reent.html)

在早期的编程中，不可重入性对程序员并不构成威胁；函数不会有并发访问，也没有中断。在很多较老的 C 语言实现中，函数被认为是在单线程进程的环境中运行。

不过，现在，并发编程已普遍使用，您需要意识到这个缺陷。本文描述了在并行和并发程序设计中函数的不可重入性导致的一些潜在问题。信号的生成和处理尤其增加了额外的复杂性。由于信号在本质上是异步的，所以难以找出当信号处理函数 触发某个不可重入函数时导致的 bug。

本文：

* 定义了可重入性，并包含一个可重入函数的 POSIX 清单。
* 给出了示例，以说明不可重入性所导致的问题。
* 指出了确保底层函数的可重入性的方法。
* 讨论了在编译器层次上对可重入性的处理。

## 什么是可重入性？
可重入（reentrant）函数可以由多于一个任务并发使用，而不必担心数据错误。相反， 不可重入（non-reentrant）函数不能由超过一个任务所共享，除非能确保函数的互斥 （或者使用信号量，或者在代码的关键部分禁用中断）。可重入函数可以在任意时刻被中断， 稍后再继续运行，不会丢失数据。可重入函数要么使用本地变量，要么在使用全局变量时 保护自己的数据。

**可重入函数：**

* 不为连续的调用持有静态数据。
* 不返回指向静态数据的指针；所有数据都由函数的调用者提供。
* 使用本地数据，或者通过制作全局数据的本地拷贝来保护全局数据。
* 绝不调用任何不可重入函数。

不要混淆可重入与线程安全。在程序员看来，这是两个独立的概念：函数可以是可重入的，是线程安全的，或者 二者皆是，或者二者皆非。不可重入的函数不能由多个线程使用。另外，或许不可能让某个 不可重入的函数是线程安全的。

IEEE Std 1003.1 列出了 118 个可重入的 UNIX® 函数，在此没有给出副本。参见[IEEE Std 1003.1](https://mirror.math.princeton.edu/pub/oldlinux/download/c953.pdf)。

出于以下任意某个原因，其余函数是不可重入的：

* 它们调用了 malloc 或 free。
* 众所周知它们使用了静态数据结构体。
* 它们是标准 I/O 程序库的一部分。

## 信号和不可重入函数

信号（signal） 是软件中断。它使得程序员可以处理异步事件。为了向进程发送一个信号， 内核在进程表条目的信号域中设置一个位，对应于收到的信号的类型。信号函数的 ANSI C 原型是：

{% highlight c %}
void (*signal (int sigNum, void (*sigHandler)(int))) (int);
{% endhighlight %}

或者，另一种描述形式：

{% highlight c %}
typedef void sigHandler(int);
SigHandler *signal(int, sigHandler *);
{% endhighlight %}

当进程处理所捕获的信号时，正在执行的正常指令序列就会被信号处理器临时中断。然后进程继续执行， 但现在执行的是信号处理器中的指令。如果信号处理器返回，则进程继续执行信号被捕获时正在执行的 正常的指令序列。

现在，在信号处理器中您并不知道信号被捕获时进程正在执行什么内容。如果当进程正在使用 malloc 在它的堆上分配额外的内存时，您通过信号处理器调用 malloc，那会怎样？或者，调用了正在处理全局数据结构的某个函数，而 在信号处理器中又调用了同一个函数。如果是调用 malloc，则进程会 被严重破坏，因为 malloc 通常会为所有它所分配的区域维持一个链表，而它又 可能正在修改那个链表。

甚至可以在需要多个指令的 C 操作符开始和结束之间发送中断。在程序员看来，指令可能似乎是原子的 （也就是说，不能被分割为更小的操作），但它可能实际上需要不止一个处理器指令才能完成操作。 例如，看这段 C 代码：

{% highlight c %}
temp += 1;
{% endhighlight %}

在 x86 处理器上，那个语句可能会被编译为：

{% highlight c %}
mov ax,[temp]
inc ax
mov [temp],ax
{% endhighlight %}

这显然不是一个原子操作。

这个例子展示了在修改某个变量的过程中运行信号处理器可能会发生什么事情：

清单 1. 在修改某个变量的同时运行信号处理器

{% highlight c %}
#include <signal.h>
#include <stdio.h>
struct two_int { int a, b; } data;
void signal_handler(int signum){
   printf ("%d, %d\n", data.a, data.b);
   alarm (1);
}
int main (void){
 static struct two_int zeros = { 0, 0 }, ones = { 1, 1 };
 signal (SIGALRM, signal_handler);
 data = zeros;
 alarm (1);
while (1)
  {data = zeros; data = ones;}
}
{% endhighlight %}

这个程序向 data 填充 0，1，0，1，一直交替进行。同时，alarm 信号 处理器每一秒打印一次当前内容（在处理器中调用 printf 是安全的，当信号发生时 它确实没有在处理器外部被调用）。您预期这个程序会有怎样的输出？它应该打印 0,0 或者 1,1。但是实际的输出 如下所示：

{% highlight c %}
0, 0
1, 1
(Skipping some output...)
0, 1
1, 1
1, 0
1, 0
...
{% endhighlight %}

在大部分机器上，在 data 中存储一个新值都需要若干个指令，每次存储一个字。 如果在这些指令期间发出信号，则处理器可能发现 data.a 为 0 而 data.b 为 1，或者反之。另一方面，如果我们运行代码的机器能够在一个 不可中断的指令中存储一个对象的值，那么处理器将永远打印 0,0 或 1,1。

使用信号的另一个新增的困难是，只通过运行测试用例不能够确保代码没有信号 bug。这一困难的原因在于 信号生成本质上异步的。

## 不可重入函数和静态变量

假定信号处理器使用了不可重入的 gethostbyname。这个函数 将它的值返回到一个静态对象中：

{% highlight c %}
static struct hostent host; /* result stored here*/
{% endhighlight %}

它每次都重新使用同一个对象。在下面的例子中，如果信号刚好是在 main 中调用 gethostbyname 期间到达，或者甚至在调用之后到达，而程序仍然在使用那个值，则 它将破坏程序请求的值。

清单 2. gethostbyname 的危险用法

{% highlight c %}
main(){
  struct hostent *hostPtr;
  ...
  signal(SIGALRM, sig_handler);
  ...
  hostPtr = gethostbyname(hostNameOne);
  ...
}
void sig_handler(){
  struct hostent *hostPtr;
  ...
  /* call to gethostbyname may clobber the value stored during the call
  inside the main() */
  hostPtr = gethostbyname(hostNameTwo);
  ...
}
{% endhighlight %}

不过，如果程序不使用 gethostbyname 或者任何其他在同一对象中返回信息 的函数，或者如果它每次使用时都会阻塞信号，那么就是安全的。

很多库函数在固定的对象中返回值，总是使用同一对象，它们全都会导致相同的问题。如果某个函数使用并修改了 您提供的某个对象，那它可能就是不可重入的；如果两个调用使用同一对象，那么它们会相互干扰。

当使用流（stream）进行 I/O 时会出现类似的情况。假定信号处理器使用 fprintf 打印一条消息，而当信号发出时程序正在使用同一个流进行 fprintf 调用。 信号处理器的消息和程序的数据都会被破坏，因为两个调用操作了同一数据结构：流本身。

如果使用第三方程序库，事情会变得更为复杂，因为您永远不知道哪部分程序库是可重入的，哪部分是不可重入的。 对标准程序库而言，有很多程序库函数在固定的对象中返回值，总是重复使用同一对象，这就使得那些函数 不可重入。

近来很多提供商已经开始提供标准 C 程序库的可重入版本，这是一个好消息。对于任何给定程序库，您都应该通读它所提供 的文档，以了解其原型和标准库函数的用法是否有所变化。

## 确保可重入性的经验
理解这五条最好的经验将帮助您保持程序的可重入性。

**经验 1**

返回指向静态数据的指针可能会导致函数不可重入。例如，将字符串转换为大写的 strToUpper 函数可能被实现如下：

清单 3. strToUpper 的不可重入版本

{% highlight c %}
char *strToUpper(char *str)
{
        /*Returning pointer to static data makes it non-reentrant */
       static char buffer[STRING_SIZE_LIMIT];
       int index;
       for (index = 0; str[index]; index++)
                buffer[index] = toupper(str[index]);
       buffer[index] = '\0';
       return buffer;
}
{% endhighlight %}

通过修改函数的原型，您可以实现这个函数的可重入版本。下面的清单为输出准备了存储空间：

清单 4. strToUpper 的可重入版本

{% highlight c %}
char *strToUpper_r(char *in_str, char *out_str)
{
        int index;
        for (index = 0; in_str[index] != '\0'; index++)
        out_str[index] = toupper(in_str[index]);
        out_str[index] = '\0';
        return out_str;
}
{% endhighlight %}

由进行调用的函数准备输出存储空间确保了函数的可重入性。注意，这里遵循了标准惯例，通过向函数名添加“_r”后缀来 命名可重入函数。

**经验 2**

记忆数据的状态会使函数不可重入。不同的线程可能会先后调用那个函数，并且修改那些数据时不会通知其他 正在使用此数据的线程。如果函数需要在一系列调用期间维持某些数据的状态，比如工作缓存或指针，那么 调用者应该提供此数据。

在下面的例子中，函数返回某个字符串的连续小写字母。字符串只是在第一次调用时给出，如 strtok 子例程。当搜索到字符串末尾时，函数返回 \0。函数可能如下实现：

清单 5. getLowercaseChar 的不可重入版本

{% highlight c %}
char getLowercaseChar(char *str)
{
        static char *buffer;
        static int index;
        char c = '\0';
        /* stores the working string on first call only */
        if (string != NULL) {
                buffer = str;
                index = 0;
        }
        /* searches a lowercase character */
        while(c=buff[index]){
         if(islower(c))
         {
             index++;
             break;
         }
        index++;
       }
      return c;
}
{% endhighlight %}

这个函数是不可重入的，因为它存储变量的状态。为了让它可重入，静态数据，即 index， 需要由调用者来维护。此函数的可重入版本可能类似如下实现：

清单 6. getLowercaseChar 的可重入版本

{% highlight c %}
char getLowercaseChar_r(char *str, int *pIndex)
{
        char c = '\0';
        /* no initialization - the caller should have done it */
        /* searches a lowercase character */
       while(c=buff[*pIndex]){
          if(islower(c))
          {
             (*pIndex)++; break;
          }
       (*pIndex)++;
       }
         return c;
}
{% endhighlight %}

**经验 3**

在大部分系统中，malloc 和 free 都不是可重入的， 因为它们使用静态数据结构来记录哪些内存块是空闲的。实际上，任何分配或释放内存的库函数都是不可重入的。这也包括分配空间存储结果的函数。

避免在处理器分配内存的最好方法是，为信号处理器预先分配要使用的内存。避免在处理器中释放内存的最好方法是， 标记或记录将要释放的对象，让程序不间断地检查是否有等待被释放的内存。不过这必须要小心进行，因为将一个对象 添加到一个链并不是原子操作，如果它被另一个做同样动作的信号处理器打断，那么就会“丢失”一个对象。不过， 如果您知道当信号可能到达时，程序不可能使用处理器那个时刻所使用的流，那么就是安全的。如果程序使用的是某些其他流，那么也不会有任何问题。

**经验 4**

为了编写没有 bug 的代码，要特别小心处理进程范围内的全局变量，如 errno 和 h_errno。 考虑下面的代码：

清单 7. errno 的危险用法

{% highlight c %}
if (close(fd) < 0) {
  fprintf(stderr, "Error in close, errno: %d", errno);
  exit(1);
}
{% endhighlight %}

假定信号在 close 系统调用设置 errno 变量 到其返回之前这一极小的时间片段内生成。这个生成的信号可能会改变 errno 的值，程序的行为会无法预计。

如下，在信号处理器内保存和恢复 errno 的值，可以解决这一问题：

清单 8. 保存和恢复 errno 的值

{% highlight c %}
void signalHandler(int signo){
  int errno_saved;
  /* Save the error no. */
  errno_saved = errno;
  /* Let the signal handler complete its job */
  ...
  ...
  /* Restore the errno*/
  errno = errno_saved;
}
{% endhighlight %}

**经验 5**

如果底层的函数处于关键部分，并且生成并处理信号，那么这可能会导致函数不可重入。通过使用信号设置和 信号掩码，代码的关键区域可以被保护起来不受一组特定信号的影响，如下：

保存当前信号设置。
用不必要的信号屏蔽信号设置。
使代码的关键部分完成其工作。
最后，重置信号设置。
下面是此方法的概述：

清单 9. 使用信号设置和信号掩码

{% highlight c %}
sigset_t newmask, oldmask, zeromask;
...
/* Register the signal handler */
signal(SIGALRM, sig_handler);
/* Initialize the signal sets */
sigemtyset(&newmask); sigemtyset(&zeromask);
/* Add the signal to the set */
sigaddset(&newmask, SIGALRM);
/* Block SIGALRM and save current signal mask in set variable 'oldmask'
*/
sigprocmask(SIG_BLOCK, &newmask, &oldmask);
/* The protected code goes here
...
...
*/
/* Now allow all signals and pause */
sigsuspend(&zeromask);
/* Resume to the original signal mask */
sigprocmask(SIG_SETMASK, &oldmask, NULL);
/* Continue with other parts of the code */
{% endhighlight %}

忽略 sigsuspend(&zeromask); 可能会引发问题。从消除信号阻塞到进程执行下一个 指令之间，必然会有时钟周期间隙，任何在此时间窗口发生的信号都会丢掉。函数调用 sigsuspend 通过重置信号掩码并使进程休眠一个单一的原子操作来解决这一问题。如果您能确保在此时间窗口中生成的信号不会有任何 负面影响，那么您可以忽略 sigsuspend 并直接重新设置信号。

## 在编译器层次处理可重用性
我将提出一个在编译器层次处理可重入函数的模型。可以为高级语言引入一个新的关键字： reentrant，函数可以被指定一个 reentrant 标识符，以此确保函数可重入，比如：

{% highlight c %}
reentrant int foo();
{% endhighlight %}

此指示符告知编译器要专门处理那个特殊的函数。编译器可以将这个指示符存储在它的符号表中，并在中间代码生成阶段 使用这个指示符。为达到此目的，编译器的前端设计需要有一些改变。此可重入指示符遵循这些准则：

1. 不为连续的调用持有静态数据。
1. 通过制作全局数据的本地拷贝来保护全局数据。
1. 绝对不调用不可重入的函数。
1. 不返回对静态数据的引用，所有数据都由函数的调用者提供。
2. 
准则 1 可以通过类型检查得到保证，如果在函数中有任何静态存储声明，则抛出错误消息。这可以在编译的语法分析 阶段完成。

准则 2，全局数据的保护可以通过两种方式得到保证。基本的方法是，如果函数修改全局数据，则抛出一个错误 消息。一种更为复杂的技术是以全局数据不被破坏的方式生成中间代码。可以在编译器层实现类似于前面经验 4 的方法。 在进入函数时，编译器可以使用编译器生成的临时名称存储将要被操作的全局数据，然后在退出函数时恢复那些数据。 使用编译器生成的临时名称存储数据对编译器来说是常用的方法。

确保准则 3 得到满足，要求编译器预先知道所有可重入函数，包括应用程序所使用的程序库。这些关于函数的 附加信息可以存储在符号表中。

最后，准则 4 已经得到了准则 2 的保证。如果函数没有静态数据，那么也就不存在返回静态数据的引用的问题。

提出的这个模型将简化程序员遵循可重入函数准则的工作，而且使用此模型可以预防代码出现无意的可重入性 bug。