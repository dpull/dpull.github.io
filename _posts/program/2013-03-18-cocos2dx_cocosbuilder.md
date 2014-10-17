---
layout: post
title: CocosBuilder使用和实现
categories: [general, cocos2dx]
tags: [cocos2dx, cocosbuilder]
---

`CocosBuilder` 版本:3.0 Alpha X(2.1版本Publish的文件Cocos2dx2.1.1不支持)

`Cocos2dx` 版本:2.1.1 和 2.1.2

> 用代码编写复杂的界面耗时耗力耗心的工作。
> 若是策划不停地改设计，想死的心都有了。
> 所以需要一个所见即所得的编辑器。

----------

## 为什么选用CocosBuilder？ ##
2013年4月：
选用CocosBuilder遭到了我们特效同学和UI同学的反对，从windows转到mac上，各种不适应。
但Cocostudio还没有正式版，只有选择CocosBuilder，自己开发成本太高了。

2013年11月：
Cocostudio出了正式版，请特效同学和UI同学评估Cocostudio，
两人得出的结论依旧是Cocostudio只能用于简单的小游戏，
对于由多个子界面拼起来的复杂界面，Cocostudio不擅长。
Cocostudio虽然支持骨骼动画，序列帧动画，但用起来复杂，制作demo有余，批量制作不行。

## CocosBuilder功能及实现 ##

[官方文档](https://github.com/cocos2d/CocosBuilder/blob/master/Documentation/4c.%20Connecting%20with%20cocos2d-x.md)

- Using Custom Classes 编辑器支持Node设置 `Custom class`，如将其设置为 `HelloCocosBuilderLayer`。
代码中需将`HelloCocosBuilderLayer` 对应的CCNodeLoader注册，存放在`CCNodeLoaderLibrary::mCCNodeLoaders`，其中包含了多个默认支持的类型和自定义的类型。

    {% highlight C++ %}
    /* Create an autorelease CCNodeLoaderLibrary. */
    CCNodeLoaderLibrary * ccNodeLoaderLibrary = CCNodeLoaderLibrary::newDefaultCCNodeLoaderLibrary();
    ccNodeLoaderLibrary->registerCCNodeLoader("HelloCocosBuilderLayer", HelloCocosBuilderLayerLoader::loader());
    {% endhighlight %}

----------

    {% highlight C++ %}
    class HelloCocosBuilderLayerLoader : public cocos2d::extension::CCLayerLoader {
       public:
           // 用于创建一个自身的实例，保存为一个CCLayerLoader。
           CCB_STATIC_NEW_AUTORELEASE_OBJECT_METHOD(HelloCocosBuilderLayerLoader, loader); 
    
       protected:
           // 用于创建一个类型为HelloCocosBuilderLayer的CCNode。
           CCB_VIRTUAL_NEW_AUTORELEASE_CREATECCNODE_METHOD(HelloCocosBuilderLayer);
    };
    {% endhighlight %}

----------

    {% highlight C++ %}
    cocos2d::extension::CCBReader * ccbReader = new cocos2d::extension::CCBReader(ccNodeLoaderLibrary);
    
    /* Read a ccbi file. */
    CCNode * node = ccbReader->readNodeGraphFromFile("ccb/HelloCocosBuilder.ccbi", this);
    {% endhighlight %}

读取ccbi文件，生成CCNode。

CCBFile控件用来嵌入另外一个ccbi文件，比如将导航栏做成一个单独的ccbi文件，多个文件引入。
	
    {% highlight C++ %}
    class HelloCocosBuilderLayer
        : public cocos2d::CCLayer
        , public cocos2d::extension::CCBSelectorResolver
        , public cocos2d::extension::CCBMemberVariableAssigner
        , public cocos2d::extension::CCNodeLoaderListener   
    {}；
    {% endhighlight %}

- Edit Custom Property 对于 `Custom class` 可设置 `Custom Property` 。
  当设置这些属性需重载`CCBMemberVariableAssigner::onAssignCCBCustomProperty`方法。

- Linking Member Variables点开`Don't assign`下拉列表
	+ `Doc root var`将自身赋值给root node的某个变量
	+ `Owner var`将自身赋值给owner node的某个变量

	> 当设置这些变量时root node或owner node需重载`CCBMemberVariableAssigner::onAssignCCBMemberVariable`方法
	> 
	> **root node是调用`CCBReader::readNodeGraphFromFile`时的第一个读取到的第一个CCNode**
	> 
	> **owner node 是`CCBReader::readNodeGraphFromFile(const char* pCCBFileName, CCObject* pOwner)`设置的pOwner**

- Adding Callbacks to CCControl

	`Selecctor` 用于事件回调
	
	`Target` 用于指定响应的对象。Document root 和 Owner
	
	`复选框` 响应的事件
	
	Target需要实现`CCBSelectorResolver::onResolveCCBCCControlSelector`。
	
	事件响应函数原型：`void (CCObject::*SEL_CCControlHandler)(CCObject*, CCControlEvent);`

- CCBReader默认的回调函数

	除了使用root node或owner node重载一些类实现回调功能外，CCBReader还支持默认的回调函数，通过构造函数设置。

        {% highlight C++ %}
        // 构造函数：(目标节点如果包含响应函数,优先目标节点)
        CCBReader(
           CCNodeLoaderLibrary * pCCNodeLoaderLibrary, // CCB类型转换为C++类型
           CCBMemberVariableAssigner * pCCBMemberVariableAssigner, // 当指定的target不存在处理函数时, 变量赋值的处理函数
           CCBSelectorResolver * pCCBSelectorResolver, // 按钮或菜单事件响应函数
           CCNodeLoaderListener * pCCNodeLoaderListener // 当节点加载完成时, 回调函数(注意:是每一个节点,并非一个文件)
        ); 
        
        // 设置资源文件根目录
        void setCCBRootPath(const char* pCCBRootPath);  
        {% endhighlight %}

> 构造函数的参数 ``pCCBSelectorResolver`` 类中函数的返回函数指针要是target的成员函数，感觉实现的不完备。

## 动画实现 ##
[官方文档](https://github.com/cocos2d/CocosBuilder/blob/master/Documentation/6.%20Working%20with%20Animations.md)

-  `Timeline`用来设计一组动画，可以通过名字运行动画。可将一个
   `Timeline` 设为 `Autoplay`，将在加载完成后自动运行（动画编辑框左上角）

-  `Chained Timeline` 设定当前选中的`Timeline`执行完成后，继续执行的`Timeline`，可设为自己，那么将循环执行。（动画编辑框右上角）

时间有限，仅记录几个关键词::
	
    {% highlight C++ %}
    CCBReader::mActionManager 类型 CCBAnimationManager，init时创建, 
    
    CCBReader::mActionManagers 类型 CCDictionary readFileWithCleanUp时创建 ``key`` Node指针 ``value`` mActionManager， 用于给根节点setUserObject，其值为对应的
        
    CCBReader::mAnimatedProps 类型 CCDictionary readNodeGraph中read属性前创建，用于parseProperties，然后释放
    
    CCBAnimationManager::setRootNode CCB文件的第一个节点
    
    CCBAnimationManager::mSequences 存放CCB文件的Timeline (CCBSequence)  CCBReader::readSequences()
    
    CCBAnimationManager::mNodeSequences ``key`` Node指针 ``value`` CCDictionary<key frame 类型, CCBSequenceProperty> key frame 类型 rotation visible position scale...
    
    CCActionInterval* CCBAnimationManager::getAction
        "rotation"      CCBRotateTo 
        "opacity"       CCFadeTo 
        "color"         CCTintTo 
        "visible"       CCSequence::createWithTwoActions(CCDelayTime::create(duration), CCShow::create())
        "displayFrame"  CCSequence::createWithTwoActions(CCDelayTime::create(duration), CCBSetSpriteFrame::create((CCSpriteFrame *)pKeyframe1->getValue()));
        "position"      CCMoveTo
        "scale"         CCScaleTo
        
    CCActionInterval* CCBAnimationManager::getEaseAction
        CCBKeyframeEasingLinear     pAction 
        kCCBKeyframeEasingInstant   CCBEaseInstant::create(pAction)
        kCCBKeyframeEasingCubicIn   CCEaseIn::create(pAction, fEasingOpt)
        kCCBKeyframeEasingCubicOut  CCEaseOut::create(pAction, fEasingOpt)
        ...
    
    CCBAnimationManager::runAction
        CCNode->runAction(CCFiniteTimeAction); 
        
    CCBAnimationManager::setDelegate
    CCBAnimationManager::setAnimationCompletedCallback  
    
    CCBAnimationManager::runAnimationsForSequenceNamedTweenDuration(const char *pName, float fTweenDuration);
    CCBAnimationManager::runAnimationsForSequenceNamed(const char *pName);
    CCBAnimationManager::runAnimationsForSequenceIdTweenDuration(int nSeqId, float fTweenDuraiton); 如果fTweenDuration大于0，则CCNode->runAction(CCFiniteTimeAction)的参数CCFiniteTimeAction会添加一个CDelayTime::create(timeFirst)
    {% endhighlight %}

## CCBFile控件的实现 ##
CCBFile控件用来引用另外一个CCB文件

    {% highlight C++ %}
    CCBReader::readNodeGraph
        // Read properties
        ccNodeLoader->parseProperties(node, pParent, this);         
            CCNodeLoader::parsePropTypeCCBFile ==> 加载文件并创建CCNode，将其设为CCBFile::mCCBFileNode
            
        // Handle sub ccb files (remove middle node)
        if (dynamic_cast<CCBFile*>(node)) { ... } ==> 将CCBFile的属性和动作设定在CCBFile::mCCBFileNode上。  
    {% endhighlight %}

> 要设置被引用的根layer的Content Size
> 该版本的CCBReader存在bug，会将引用的CCB文件ignoreAnchorPointForPosition设置为false。
                
    
    {% highlight C++ %}
    // CCBReader.cpp 642行是多余的，
    // 因为ccbFileNode的ignoreAnchorPointForPosition没有被赋值，
    // 会把原本的embeddedNode的ignoreAnchorPointForPosition给覆盖掉
    embeddedNode->ignoreAnchorPointForPosition(ccbFileNode->isIgnoreAnchorPointForPosition()); 
    {% endhighlight %}

## 创建不同分辨率的layer如何编辑和使用 ##
[官方文档](https://github.com/cocos2d/CocosBuilder/blob/master/Documentation/5.%20Working%20with%20Multiple%20Resolutions.md)

*Options When Loading ccbi-files*

The resolution sizes are not saved in the ccbi-files, by default the
screen size is used as the parent size when the files are loaded. If you
have used a custom size you may need to pass this size to the loader. To
do this you will need to use the nodeGraphFromFile:owner:parentSize: or
sceneWithNodeGraphFromFile:owner:parentSize: methods.

分辨率大小没有存在ccbi-file中，默认情况下，在这些文件加载时，屏幕尺寸会用于父尺寸。
如果有使用了自定义尺寸，就需要将尺寸传给loader。
为此，需要调用nodeGraphFromFile:owner:parentSize: or sceneWithNodeGraphFromFile:owner:parentSize: 方法

    {% highlight C++ %}
    CGSize mySize = CGSizeMake(100.0f, 100.0f);
    CCNode* myNode = [CCBReader nodeGraphFromFile:@"myNode.ccbi" owner:NULL parentSize:mySize];
    {% endhighlight %}
     
Before loading your ccbi-files you can set the resolution scale you want
to use. The default resolution scale is 1 for iPhone and 2 for iPad, but
sometimes it can be useful to use other scale factors.

加载ccbi-files前，可以设置想要使用的分辨率缩放因子。
iphone的默认因子是1，ipad是2，但有时可能其它因子更合适。

    {% highlight C++ %}
    [CCBReader setResolutionScale: 2.5f];
    {% endhighlight %}


>这个接口cocos2dx没有实现，但可以使用CCEGLView::setDesignResolutionSize间接实现此功能。

*Useful Tips!*

-  It is always better to design for multiple resolutions from the start
   in a project, rather then trying to convert an existing layout to fit
   different devices.

-  最好在项目开始就为多分辨率做好设计，而不是试图转换已有的布局，来适应不同设备

-  If you are planning on using letter boxing, the multiply by
   resolution scale option can be very useful.

-  如果计划使用字母盒（letter boxing），分辨率缩放因子会很有用

-  Combine setting the anchor point of an object with the relative
   positioning options to pin nodes to corners or sides of the screen.

-  可以通过设定对象的锚点，并与相对定位选项结合起来，可以将节点固定到屏幕的角落或边上

-  You can achieve very complex behaviors for the multiple resolutions
   by nesting different positioning and size options.

-  通过将不同的定位和尺寸选项嵌套起来，可以在不同的分辨率下获得非常复杂的效果

-  Don't be afraid to experiment with the different options, it can be
   complex at first sight, but once you get the hang of it you will have
   many options for laying out your scenes.

-  没事多试试不同的选项。刚开始看可能比较复杂，但一旦掌握了，你就爽了

## Smart Sprite Sheet ##
当在资源文件夹上选择了Smart Sprite Sheet选项后，会根据Publish
Setting中的手机类型（如iPhone(1X)）将图片进行打包存放于发布目录不同的文件夹中。

如：

aa（ResourceDir）文件夹设置为Smart Sprite Sheet，在iPhone(1X)模式发布在
PublishDir-iphone.plist

bb（ResourceDir） 文件夹设置为Smart Sprite Sheet，在iPhone(1X)模式发布在
PublishDir-iphone.plist

**iOS**

	iPhone(1X) resources-iphone
	iPhone retina(2X) resources-iphonehd
	iPad(2X) resources-ipad
	iPad retina(2X) resources-ipadhd

**Android**

	xsmall(0.5X) resources-xsmall
	small(1X) resources-small
	medium(1.5X) resources-medium
	large(2X) resources-large
	xlarge(4X) resources-xlarge

程序中通过CCFileUtils::addSearchResolutionsOrder("resources-iphone")增加资源路径。

**优点：**

无缝的拼接资源，可以一开始是散包的资源，制作好后自动转化为资源

**缺点：**

1. 程序要设置为Publish方式，脚本和配置文件不会自动发布，需要引用原来的
1. 要将整合在一起的文件放在同一文件夹中

不采用这种方式，采用TexturePackerGUI合包

**优点：**

资源不需要再次发布，对文件的存放位置没有太大的要求

**缺点：**

1. 需要两个工具配合制作（先用TexturePackerGUI打好包，然后用CocosBuilder拼界面）
1. 美术资源需要提交到另外一个目录，由策划统一生成plist

## CocosBuilder与现有UI的整合 ##

重定义类型的实现,比如说将CCBuilder中的CCNode重新定义为XNode,其继承于CCNode,然后将其添加luna扩展。
使用AssignCCBMemberVariable增加脚本标示。将脚本扩展和实例连接起来。

本来打算用CCBReader四参的构造函数来支持，这样就不需要使用多重继承（很讨厌多重继承）。但是：

1. mCCBSelectorResolver 存在返回的函数指针必须是target的函数指针
1. mCCNodeLoaderListener 会在每个节点创建完成时都回调一次
1. 如果用CCLayer做根节点，会导致实现中特例化这个控件，可能会发生解析上错乱的问题，不如再增加一个XPanel的自定义类型。
1. 使用自定义类型的根节点，还可以支持添加一些自定义属性，不过最好别用这个。

## 经验总结 ##
-  Publish 前要记得 Save 和 Clean
-  Save最好的方式是Close当前文件，我发生了把每个文件挨个Save了，但是Publish出来的文件不对，全关闭时才发现有文件没有保存。
-  如果使用XLabelTTF最好不要放大，字体会糊，直接把字体设大
-  有时候会使用CCB做为主界面,然后再CCNodeLoaderListener回调中动态添加一些CCB子界面进去,

   -  坑1:这时候根CCB尚没有将UserObject设置为CCBAnimationManager
   -  坑2:稍后CCB会将所有子节点UserObject设为NULL,如果非CCB文件中的子CCB,其动作将会消失

-  当有Timeline动画的时候，不要删除与动画有关的节点，Cocos2dx当前版本的CCBAnimationManager::mNodeSequences中存的CCNode都没有增加引用计数，绕过去的法子是如果动作是绑在CCNode上的，则将其子节点清空。

	>1. 关键帧回调没有传递关键帧的名称，导致无法实现脚本扩展（已修改其实现）   
	>1. Button或者Menu的触摸事件的获得回调函数的方法没有传递子节点名，无法创建一些模板点击事件。（小问题，不修改了）  
	>1. CCNodeLoaderListener::onNodeLoaded调用时帧动画尚没有初始化完成，若再其回调中创建了有动画的子节点，会被清除掉。（大坑，要注意代码的实现流程）
	>1. 进行lua绑定时进行多次类型转化，由于luna不是继承类型的，所以实现起来比较恶心
	>1. 将引用的CCB文件ignoreAnchorPointForPosition设置为false的bug（本不想改的，但策划和美术都中招后，决心改了）

## 解决不同分辨率的问题 ##
1. 界面按照960\*640设计，但尽量使用百分比位置和百分比大小，善用中心做锚点。
1. 资源设计为1136\*720，要求资源在960\* 640,1136\*640,960\*720,这三个分辨率表现为可接受的。
1. 将屏幕缩放为恰好包含960\*640的分辨率，如 `iphone4s`：960\* 640
   ``iphone5`` ：1136\*640 ``ipad`` ：960\*720

## CCLabelTTF的字体名字 ##
> 在地海世界，一个充满著岛屿、海洋、魔法的奇幻世界，万物皆有真名。而当知晓了某物／人之真名，便能成为其主人。 
> *--《地海巫师》（A Wizard of Earthsea）*

使用Cocosbuilder的时候，有使用UserFonts的选项，可以选择ttf文件，但是选择后在模拟器上没有效果，调试后发现了一个注释：
    
    {% highlight C++ %}
    // On iOS custom fonts must be listed beforehand in the App info.plist (in order to be usable) and referenced only the by the font family name itself when
    // calling [UIFont fontWithName]. Therefore even if the developer adds 'SomeFont.ttf' or 'fonts/SomeFont.ttf' to the App .plist, the font must
    // be referenced as 'SomeFont' when calling [UIFont fontWithName]. Hence we strip out the folder path components and the extension here in order to get just
    // the font family name itself. This stripping step is required especially for references to user fonts stored in CCB files; CCB files appear to store
    // the '.ttf' extensions when referring to custom fonts.
    {% endhighlight %}
        
然后经过一番尝试和研究，简单记录一下CCLabelTTF关于字体方面的坑。

1. 将ttf字体的英文名修改为字体名，不知道ttf字体的英文名，则先执行下一步，因为设置字体的英文名为文件名是为了支持CocosBuilder。
1. XCode工程设置的Targets->Info属性页, 右键添加新行，选择Font provided by application，将字体路径添加到其子项中。
1. 如果不知道该字体的英文名，可在main.m中添加如下代码，输出程序的字体英文名

    {% highlight C++ %}
    #ifdef COCOS2D_DEBUG
       NSArray* familyNames = [[NSArray alloc] initWithArray:[UIFont familyNames]];
       NSArray* fontNames;
    
       NSInteger indFamily, indFont;
    
       for (indFamily=0; indFamily<[familyNames count]; ++indFamily)
       {
           NSLog(@"Family name: %@", [familyNames objectAtIndex:indFamily]);
    
           fontNames = [[NSArray alloc] initWithArray: [UIFont fontNamesForFamilyName: [familyNames objectAtIndex:indFamily]]];        
           for (indFont=0; indFont<[fontNames count]; ++indFont)
           {
               NSLog(@"    Font name: %@", [fontNames objectAtIndex:indFont]);
           }
       }
    #endif
    {% endhighlight %}