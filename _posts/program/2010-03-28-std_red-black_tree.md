---
layout: post
title: 算法导论 红黑树
categories: [general]
tags: []
---

组内培训，讲红黑树，找出 **《算法导论》**
，啃了一个周末，其中插入结点很简单，删除结点有点复杂，
但跟着算法导论上一步一步来没有什么问题。不想备份blog的图片，所以没有把图片上传。
可直接察看
[ppt](https://docs.google.com/presentation/d/1CABjz*\ 10jImXXTAjjeZYN9ps4jQ98GJZMrcfQ5QjSAE/edit#slide=id.i0)。

----------

## 红黑树性质 ##

1. **每个节点或是红的,或是黑的**
1. **根节点是黑的**
1. **每个叶结点(NIL)都是黑的**
1. **如果一个结点是红的,则它的两个儿子都是黑的**
1. **对每个结点,从该节点到其子孙结点的所有路径上包含相同数目的黑结点**

> **从某个结点x出发(不包括该结点)到达一个叶结点的任意一条路径上,黑色结点的个数成为该结点x的黑高度，用bh(x)表示。**
> 
> **引理：一颗有n个内节点的红黑树的高度之多为2lg(n+1)**

## 插入不变式 ##

1. 结点z是红色。
1. 如果p[z]是根，则p[z]是黑色。
1. 如果有红黑树的性质被破坏，则至多只有一个被破坏，并且不是性质2)就是性质4)。如果违反性质2)，则发生的原因是z是根而且是红的。如果违反性质4)，则原因是z和p[z]都是红色的，则p[p[z]]必然是黑色的。

针对违反性质4)

1. z的叔叔y是红色的
1. z的叔叔y是黑色的，而且z是右孩子
1. z的叔叔y是黑色的，而且z是左孩子

z的叔叔y是黑色的。这两种情况是通过z是p[z]的左孩子还是右孩子来区别。在情况2中，结点z是他的父亲的右孩子。我们立即使用一个左旋来将此情况转变为情况3，此时结点z成为左孩子。因为z和p[z]都是红色的，所以所做的旋转对结点的黑高度和性质5)都无影响。在情况3中，要改变某些结点的颜色，并作一次右旋以保持性质5。这样，由于在一行中不在有两个连续的红色结点，因而，所有的处理完毕，无需再次执行while循环。

## 二叉查找树删除 ##

-  二叉查找树删除（删除结点z） 
   如果z没有子女，则修改其父结点p[z],使NIL为其子女； 
   如果结点z只有一个子女，则可以通过在其子结点与父结点间建立一条链来删除z；
   如果结点z有两个子女，先删除z的后继y，再用y的内容替代z的内容。

-  后继
   二叉树中，如果所有的关键字均不相同，则某一结点x的后继既具有大于key[x]中的关键字中最小者的那个结点。

## 红黑树删除 ##

    RB-DELETE(T,z)
        if left[z] = nil[T] or right[z] = nil[T] then y ← z
        else y ← TREE-SUCCESSOR(z)
        
        if left[y] ≠ nil[T] then x ← left[y]
        else x ← right[y]

        p[x] ← p[y]

        if p[y] = nil[T] then root[T] ←  x
        else if y = left[p[y]] then left[p[y]] ← x
        else right[p[y]] ← x
        
        if y ≠ z then key[z] ← key[y]
        copy y’s satellite data into z

        if color[y] = BLACK then RB-DELETE-FIXUP(T, x)

        return y
        
1. 如果被删除的结点是红色的,则当结点被删除后,红黑性质仍然得以保持,理由如下:
   1. 树中各结点的黑高度都没有变化
   1. 不存在两个相邻的红色结点
   1. 因为如果该节点是红的,就不可能是根,所以跟仍然是黑色的
1. 如果被删除的结点是黑色的，则会产生三个问题。
   要删除的结点y，如果y有个不是NIL的孩子，则x为y的唯一孩子；如果y没有孩子，则x为NIL，把x的父节点(原来是y)赋值为y的父节点
   1. 如果y原来是根结点，而y的一个红色的孩子成为了新的根，这就违反了性质2)。
   1. 如果x和p\ `y <现在也是p[x]>`__\ 都是红的，就违反了性质4)。
   1. 删除y将导致先前包含y的任何路径上黑结点个数少1。因此，性质5)被y的一个祖先破坏了。补救这个问题的一个办法就是把结点x视为还有额外的一重黑色。也就是说，如果将任意包含结点x的路径上黑结点的个数加1，则这种假设下，性质5)成立。当将黑节点y删除时，将其黑色“下推”至其子节点。现在问题就变为结点x可能既不是红，也不是黑，从而违反了性质1)。结点x是双重黑色或红黑，这就分别给包含x的路径上黑结点的贡献2个或1个。x的color属性仍然是red(如果x是红黑的)或者black(如果x是双重黑色)。换言之，一个结点额外的黑色反映在x指向它，而不是他的color属性。

## 删除算法 ##

    RB-DELETE-FIXUP(T, x)
    while x ≠ root[T] and color[x] = BLACK do 
        if x = left[p[x]] then 
            w ← right[p[x]]
        if color[w] = RED then 
            color[w] ← BLACK  Case1
            color[p[x]] = RED  Case1
            LEFT-ROTATE(T,p[x])  Case1
            w ← right[p[x]]   Case1
        if color[right[w]] = BLACK and color[right[w]= BLACK then 
            color[w] ← RED   Case2
            x ← p[x]    Case2
        else if color[right[w]] = BLACK then 
            color[left[w]] ← BLACK Case3
            color[w] ← RED   Case3
            RIGHT-ROTATE(T,w) Case3
            w ← right[p[x]]  Case3
            color[w] ← color[p[x]]  Case4
            color[p[x]] ←  BLACK  Case4
            color[right[w]] ← BLACK  Case4
            LEFT-ROTATE(T,p[x])    Case4
            x ← root[T]    Case4
        else (same as then clause with “right”      and “left” exchanged)
            color[x] ← BLACK

第1-22行中while循环的目的是将额外的黑色沿树上移，直到：

1. x指向一个红黑结点，将x(单独)着为黑色。
1. X指向根，这时可以简单地消除那个额外的黑色，或者
1. 作必要的旋转和颜色修改

**情况1：x的兄弟w是红色的**

-  因为w必须有黑色的孩子，我们可以改变w和p[x]颜色，再对p[x]做一次左旋，从而红黑性质得以继续保持。现在，x的新兄弟是旋转之前w的某个孩子，其颜色为黑色。这样，我们已经将情况1)转化为情况2)3)或4)了。

**情况2：x的兄弟w是黑色的，而且w的两个孩子都是黑色的**

-  因为w也是黑色的，故从x和w上去掉一重黑色，从而x只有一重黑色而w为红色。为了补偿从x和w中去掉一重黑色，我们想在原来是红色或者黑色的p[x]内新增一重额外的黑色。通过以p[x]为新结点x来恢复while循环。注意如果从情况1进入情况2，则新结点x是红黑色的，因为原来的p[x]是红色的。因此，新结点x的color属性的值c为red，并且在测试循环条件后循环结束。然后新结点x在第23行中被（单独）着为黑色。

**情况3：x的兄弟w是黑色的，w的左孩子是红色的，右孩子是黑色的**

-  可以交换w和其左孩子left[w]的颜色，并对w进行右旋，而红黑性质仍然保持。现在x的新兄弟w是一个有红色右孩子的黑节点，这样我们从情况3转换成情况4

**情况4：x的兄弟w是黑色的，而且w的右孩子是红色的**

-  通过做某些颜色修改并对p[x]做一次左旋，可以去掉x的额外黑色来把它变成单独黑色，而不破坏红黑性质。将x置为根后，当while循环测试其循环条件时循环结束。
