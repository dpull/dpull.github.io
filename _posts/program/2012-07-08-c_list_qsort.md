---
layout: post
title: 单链表快排
categories: [general]
tags: [c]
---

----------
	
    {% highlight c %}
    // 头文件
    #pragma once
    
    struct ListNode
    {
        int   m_nValue;
        ListNode* m_pNext;
    };
    
    ListNode* QuickSortList(ListNode* pList)
    
    // 源文件
    void QuickSort(ListNode* pHeadNode, ListNode* pTailNode)
    {
        if (pHeadNode->m_pNext == pTailNode || pHeadNode->m_pNext->m_pNext == pTailNode)
            return;
    
        ListNode* pPivot = pHeadNode->m_pNext;
        ListNode* pLeft = pHeadNode;
        ListNode* pRight = pPivot;
        ListNode* pCurNode = pPivot->m_pNext;
    
        while (pCurNode != pTailNode)
        {
            if (pCurNode->m_nValue < pPivot->m_nValue)
            {
                pLeft->m_pNext = pCurNode;
                pLeft = pLeft->m_pNext;
            }
            else
            {
                pRight->m_pNext = pCurNode;
                pRight = pRight->m_pNext;
            }
            pCurNode = pCurNode->m_pNext;
        }
    
        pLeft->m_pNext = pPivot;
        pRight->m_pNext = pTailNode;
    
        QuickSort(pHeadNode, pPivot);
        QuickSort(pPivot, pTailNode);
    }
    
    ListNode* QuickSortList(ListNode* pList)
    {
        ListNode headNode;
    
        headNode.m_pNext = pList;
        QuickSort(&headNode, NULL);
    
        return headNode.m_pNext;
    }
    {% endhighlight %}