---
layout: post
title: Unreal多线程模型
categories: [general]
tags: [unreal, thread]
---

FRunnableThread
FRunnableThreadPThread
FForkableThread
FFakeThread

* 可单线程/多线程切换
    * FAsyncWriter::FAsyncWriter(FArchive&, FAsyncWriter::EThreadNameOption) [Engine/Source/./Runtime/Core/Private/Misc/OutputDeviceFile.cpp:193]
    * FTaskGraphCompatibilityImplementation::StartReserveWorkers
    * FHttpThread::StartThread() [Engine/Source/./Runtime/Online/HTTP/Private/HttpThread.cpp:65]
    * FOnlineSubsystemNull::Init() [Engine/Source/./../Plugins/Online/OnlineSubsystemNull/Source/Private/OnlineSubsystemNull.cpp:285]
    * FMessageBus::FMessageBus(FString, TSharedPtr<IAuthorizeMessageRecipients, (ESPMode)1> const&) [Engine/Source/./Runtime/Messaging/Private/Bus/MessageBus.cpp:25]

* 池
    * FQueuedThread::Create(FQueuedThreadPoolBase*, unsigned int, EThreadPriority, char16_t const*) [Engine/Source/./Runtime/Core/Private/HAL/ThreadingBase.cpp:1003]
    * FFileIoStore::Initialize(TSharedRef<FIoDispatcherBackendContext const, (ESPMode)1>) [Engine/Source/./Runtime/PakFile/Private/IoDispatcherFileBackend.cpp:1254]
    * FIoDispatcherImpl::StartThread() [Engine/Source/./Runtime/Core/Private/IO/IoDispatcher.cpp:611]
    * FFileTransferRunnable::FFileTransferRunnable(TSharedPtr<FMessageEndpoint, (ESPMode)1>&) [Engine/Source/./Developer/ProfilerService/Private/ProfilerServiceFileTransfer.cpp:21]
    * FImageWriteQueue::RecreateThreadPool() [Engine/Source/./Runtime/ImageWriteQueue/Private/ImageWriteQueue.cpp:299]
