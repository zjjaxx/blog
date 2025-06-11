
## z-index 与层叠上下文

### 相关资料

[当元素祖先的 `transform`、`perspective`、`filter` 或 `backdrop-filter` 属性非 `none` 时，容器由视口改为该祖先](https://developer.mozilla.org/zh-CN/docs/Web/CSS/position)

推荐看[[[张鑫旭-《深入理解CSS中的层叠上下文和层叠顺序》](https://link.juejin.cn/?target=https%3A%2F%2Fwww.zhangxinxu.com%2Fwordpress%2F2016%2F01%2Funderstand-css-stacking-context-order-z-index%2F)](https://link.juejin.cn/?target=https%3A%2F%2Fwww.zhangxinxu.com%2Fwordpress%2F2016%2F01%2Funderstand-css-stacking-context-order-z-index%2F)](https://link.juejin.cn/?target=https%3A%2F%2Fwww.zhangxinxu.com%2Fwordpress%2F2016%2F01%2Funderstand-css-stacking-context-order-z-index%2F)

**首先要理解2个概念**

1. 层叠上下文，英文称作”stacking context”. 是HTML中的一个三维的概念,在三维空间中指代Z轴的概念

2. “层叠水平”英文称作”stacking level”，决定了同一个层叠上下文中元素在z轴上的显示顺序，普通元素的层叠水平优先由层叠上下文决定，因此，层叠水平的比较只有在当前层叠上下文元素中才有意义。***需要注意的是，诸位千万不要把层叠水平和CSS的z-index属性混为一谈。没错，某些情况下z-index确实可以影响层叠水平，但是，只限于定位元素以及flex盒子的孩子元素；而层叠水平所有的元素都存在。***

在同一个层叠上下文中的显示顺序如下图所示

![排序](https://image.zhangxinxu.com/image/blog/201601/2016-01-09_211116.png)

另外加上2个准则就能判断同一层叠上下文中显示的先后顺序

1. **谁大谁上**
2. **后来居上**

**层叠上下文的创建**

有3种类型：拿科举举例

1. **皇亲国戚**派：页面根元素天生具有层叠上下文，称之为“根层叠上下文”。
2. **科考入选**派：z-index值为数值的定位元素的传统层叠上下文。
3. **其他当官途径**：其他CSS3属性。

**根层叠上下文**
指的是页面根元素，也就是滚动条的默认的始作俑者`<html>`元素。这就是为什么，绝对定位元素在`left`/`top`等值定位的时候，如果没有其他定位元素限制，会相对浏览器窗口定位的原因。

**定位元素与传统层叠上下文**

普通元素设置`position`属性为**非**`static`值并设置`z-index`属性为具体数值，产生层叠上下文。

**CSS3与新时代的层叠上下文**

1. `z-index`值不为`auto`的`flex`项(父元素`display:flex|inline-flex`).
2. 元素的`opacity`值不是`1`.
3. 元素的`transform`值不是`none`.
4. 元素`mix-blend-mode`值不是`normal`.
5. 元素的`filter`值不是`none`.
6. 元素的`isolation`值是`isolate`.
7. `will-change`指定的属性值为上面任意一个。
8. 元素的`-webkit-overflow-scrolling`设为`touch`.

### 面试回答

**层叠上下文**就是对HTML 元素的一个三维构想，元素在Z轴上按优先级排列

在同一个层叠上下文中的显示顺序如下图所示

![排序](https://image.zhangxinxu.com/image/blog/201601/2016-01-09_211116.png)

另外加上2个准则就能判断同一层叠上下文中显示的先后顺序

1. **谁大谁上**
2. **后来居上**

**层叠上下文的创建**

**根层叠上下文**
指的是页面根元素，也就是滚动条的默认的始作俑者`<html>`元素。这就是为什么，绝对定位元素在`left`/`top`等值定位的时候，如果没有其他定位元素限制，会相对浏览器窗口定位的原因。

**定位元素与传统层叠上下文**

普通元素设置`position`属性为**非**`static`值并设置`z-index`属性为具体数值，产生层叠上下文。

**CSS3与新时代的层叠上下文** 常见的有

1. `z-index`值不为`auto`的`flex`项(父元素`display:flex|inline-flex`).
2. 元素的`opacity`值不是`1`.
3. 元素的`transform`值不是`none`.
4. 元素的`filter`值不是`none`.
5. `will-change`指定的属性值为上面任意一个。

## [[[CSS-水平居中、垂直居中、水平垂直居中](https://segmentfault.com/a/1190000014116655)](https://segmentfault.com/a/1190000014116655)](https://segmentfault.com/a/1190000014116655)

1. 如何是行内元素 textAlign
2. position absolute + transfrom/margin:auto/margin 负距离
3. flex
4. table-cell 不常用

## 面试官：请说说什么是BFC？大白话讲清楚

### 相关资料

常规流 块盒

1. 水平方向，撑满整个包含块宽度，垂直方向上，依次摆放
2. 垂直方向上相邻的元素，margin会合并
3. 父子关系的情况下，可能会产生margin塌陷
4. 父子关系的情况下，父元素无视浮动元素会产生高度塌陷
5. 兄弟关系的情况下，正常元素可能会被浮动元素覆盖

区块格式化上下文

1. 开启BFC的区域，是一块独立的渲染区域
2. 隔绝了内部和外部的联系，内部渲染不会影响到外部
3. 当然，不同的BFC区域，渲染时也是互不干扰

开启BFC能解决什么问题

1.  开启BFC，其子元素不会再产生margin塌陷问题
2. 开启BFC，就算子元素浮动，自身高度也不会坍塌
3. 开启BFC，自己不会被其他浮动元素所覆盖

开启BFC常用方法

1. 浮动元素，float值不为none
2. 绝对定位 元素 ，position的值为absolute或者fixed
3. 行内块元素 display的值为inline-block
4. display 为table-cell、table-caption、table等等
5. overflow值不为visible或则clip的块级元素
6. display值为flow-root
7. 弹性元素display的值为flex或则inline-flex元素的直接子元素

[[[BFC详解](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_display/Block_formatting_context)](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_display/Block_formatting_context)](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_display/Block_formatting_context)

### 面试回答

通常，我们会为定位和清除浮动创建新的 BFC，而不是更改布局，因为它将

- 包含内部浮动。
- 排除外部浮动。
- 阻止[外边距重叠](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing)。

开启BFC常用方法

1. 浮动元素，float值不为none
2. 绝对定位 元素 ，position的值为absolute或者fixed
3. 行内块元素 display的值为inline-block
4. display 为table-cell、table-caption、table等等
5. overflow值不为visible或则clip的块级元素
6. display值为flow-root
7. 弹性元素display的值为flex或则inline-flex元素的直接子元素

## 如何画一个正方形/长宽固定的长方形

[[[aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio#browser_compatibility)](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio#browser_compatibility)](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio#browser_compatibility)

## 有没有使用过 css variable，它解决了哪些问题

[[[CSS变量](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)

1. 它包含的值可以在整个文档中重复使用
2. 另一个好处是语义化的标识

## 在日常开发中如何让图片保持缩放比例正常显示

有2个属性能够设置图片

1. background- size
2. object-fit

[[A Deep Dive Into object-fit And background-size In CSS](https://www.smashingmagazine.com/2021/10/object-fit-background-size-css/)](https://www.smashingmagazine.com/2021/10/object-fit-background-size-css/)



## [[搞懂＞＞＞、/deep/、::v-deep、::v-deep()和:deep()的区别与用法](https://juejin.cn/post/7413669480624357386)](