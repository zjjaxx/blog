
## 创建Tween补间动画的常用方法

- [gsap.to()](https://gsap.com/docs/v3/GSAP/gsap.to())
- [gsap.from()](https://gsap.com/docs/v3/GSAP/gsap.from())
- [gsap.fromTo()](https://gsap.com/docs/v3/GSAP/gsap.fromTo())

简单示例

```js
let tween = gsap.to(".class", {rotation: 360, duration: 5, ease: "elastic"});

//now we can control it!
tween.pause();
tween.seek(2); //跳转到指定时间点​
tween.progress(0.5);// 设置动画完成进度的百分比（0 到 1 之间）
tween.play();
...

```

### 动态控制多个元素动画

```js

gsap.to(".class", {
  x: 100, //normal value
  y: function(index, target, targets) { //function-based value
    return index \* 50;
  },
  duration: 1
});

```

### 可以使用相对值

使用`"+="`或`"-="`前缀表示相对值。例如，`gsap.to(".class", {x:"-=20"});`会将补间开始时的像素值**减少**`x`20 像素。会将补间开始时的像素值**增加**20。要以相对方式使用变量，只需添加或前缀，例如。`{x:"+=20"}``"+="``"-="``{x: "+=" + yourVariable}`

### 串联多个补间动画

```js
let tl = gsap.timeline(); //create the timeline
tl.to(".class1", { x: 100 }) //start sequencing
  .to(".class2", { y: 100, ease: "elastic" })
  .to(".class3", { rotation: 180 });
```

#### 全局默认值

```js
var tl = gsap.timeline({defaults: {duration: 1}});

//no more repetition of duration: 1!
tl.to(".green", {x: 200})
  .to(".purple", {x: 200, scale: 0.2})
  .to(".orange", {x: 200, scale: 2, y: 20});
```

#### **分步暂停的时间轴**

通过 `addPause()` 在每段动画后插入暂停点，时间轴默认自动暂停，等待用户触发下一步：

```js
let tl = gsap.timeline({ paused: true }); // 初始为暂停状态

// 分步定义动画并插入暂停点
tl.to(".class1", { x: 100 })
  .addPause()  // 第一段动画结束后暂停
  .to(".class2", { y: 100, ease: "elastic" })
  .addPause()  // 第二段动画结束后暂停
  .to(".class3", { rotation: 180 });
```

创建控制器函数

定义 `next()` 函数，通过 `play()` 方法触发下一段动画：

```js
function next() {
  if (tl.paused()) { // 仅在暂停状态下触发
    tl.play();       // 播放到下一个暂停点
  }
}
```

如果您需要编写多个补间动画来为一个目标添加动画效果,更加推荐使用关键帧的写法

```js
// timeline
let tl = gsap.timeline();
tl.to(".box", {
    x: 100
  })
  .to(".box", {
    y: 100
  })
  .to(".box", {
    x: 0
  })
  .to(".box", {
    y: 0
  });

// Array-based keyframes
gsap.to(".box", {
  keyframes: {
    x: [0, 100, 100, 0, 0],
    y: [0, 0, 100, 100, 0],
    ease: "power1.inOut"
  },
  duration: 2
});
```

只需定义一个值数组，它们就会在补间指定的时间内均匀分布。

#### 对象关键帧 

关键帧数组用对象的写法

```js
gsap.to(".elem", {
 keyframes: [
  {x: 100, duration: 1, ease: 'sine.out'}, // finetune with individual eases
  {y: 200, duration: 1, delay: 0.5}, // create a 0.5 second gap
  {rotation: 360, duration: 2, delay: -0.25} // overlap by 0.25 seconds
 ],
 ease: 'expo.inOut' // ease the entire keyframe block，覆盖内部每一个关键帧的的默认值
});
```

#### 百分比关键帧 

这种熟悉的语法让从 CSS 移植动画变得轻而易举！

```js
gsap.to(".elem", {
 keyframes: {
  "0%":   { x: 100, y: 100},
  "75%":  { x: 0, y: 0, ease: 'sine.out'}, // finetune with individual eases
  "100%": { x: 50, y: 50 },
   easeEach: 'expo.inOut' // ease between keyframes
 },
 ease: 'none' // ease the entire keyframe block
 duration: 2,
})
```

#### **与其他缓动属性的区别**

|      属性       |         作用范围         |           优先级           |           示例场景           |
| :-------------: | :----------------------: | :------------------------: | :--------------------------: |
| **`easeEach`**  |     关键帧之间的过渡     | 被单个关键帧的 `ease` 覆盖 | 统一所有关键帧过渡的缓动节奏 |
|   **`ease`**    | 单个关键帧内部的属性变化 |         优先级最高         |  精细调整某一阶段的特殊效果  |
| **外层 `ease`** |   整个动画块的宏观节奏   |    最低（被前两者覆盖）    |   全局动画的加速/减速控制    |

### 有四种类型的补间：

- `gsap.to()`- 这是最常见的补间动画类型。`.to()`补间动画将从元素的当前状态开始，并**按照补间动画中定义的值进行动画。**

- `gsap.from()`- 就像向后一样`.to()`，它**从补间中定义的值开始动画**，并以元素的当前状态结束。

- `gsap.fromTo()` -**您定义 起始值\*和结束\**值\* 。**

- `gsap.set()` **立即设置属性**（无动画）。本质上是一个零持续时间的`.to()`补间动画

### GSAP 提供了transforms 的**简写**

```css
transform: rotate(360deg) translateX(10px) translateY(50%)
```

上一行 CSS 代码可以这样写。

```js
{ rotation: 360, x: 10, yPercent: 50 }
```

以下是简写变换和一些其他常用属性的列表。

| GSAP                          | Description or equivalent CSS       |
| ----------------------------- | ----------------------------------- |
| x: 100                        | transform: translateX(100px)        |
| y: 100                        | transform: translateY(100px)        |
| xPercent: 50                  | transform: translateX(50%)          |
| yPercent: 50                  | transform: translateY(50%)          |
| scale: 2                      | transform: scale(2)                 |
| scaleX: 2                     | transform: scaleX(2)                |
| scaleY: 2                     | transform: scaleY(2)                |
| rotation: 90                  | transform: rotate(90deg)            |
| rotation: "1.25rad"           | Using Radians - no CSS alternative  |
| skew: 30                      | transform: skew(30deg)              |
| skewX: 30                     | transform: skewX(30deg)             |
| skewY: "1.23rad"              | Using Radians - no CSS alternative  |
| transformOrigin: "center 40%" | transform-origin: center 40%        |
| opacity: 0                    | adjust the elements opacity         |
| autoAlpha: 0                  | shorthand for opacity & visibility  |
| duration: 1                   | animation-duration: 1s              |
| repeat: -1                    | animation-iteration-count: infinite |
| repeat: 2                     | animation-iteration-count: 2        |
| delay: 2                      | animation-delay: 2                  |
| yoyo: true                    | animation-direction: alternate      |

除了这些，还可以变换、颜色、填充、边框半径，GSAP 都能为它们制作动画！只需记住将属性设置为驼峰式大小写即可 - 例如`background-color`变成`backgroundColor`。

***GSAP 甚至不需要 DOM 元素来为属性设置动画。您可以定位任何对象的任何属性，甚至可以像这样创建的任意属性：***

***GSAP 通常以这种方式用于在 Three.js、HTML canvas 和 Pixi.js 中制作动画：\***

```js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#28a92b";

let position = { x: 0, y: 0 };

function draw() {
  // erase the canvas
  ctx.clearRect(0, 0, 300, 300);
  // redraw the square at it's new position
  ctx.fillRect(position.x, position.y, 100, 100);
}

//animate x and y of point
gsap.to(position, { 
  x: 200, 
  y: 200, 
  duration: 4,
  // unlike DOM elements, canvas needs to be redrawn and cleared on every tick
  onUpdate: draw 
});
```

## 交错动画

如果一个补间动画有多个目标，你可以轻松地在每个动画的开始之间添加一些延迟

```js
gsap.to('.box', {
    y: 100,
    stagger: 0.1 // 0.1 seconds between when each ".box" element starts animating
});
```

`stagger: 0.1`每个补间动画的开始时间之间间隔 0.1 秒。负值则效果相同，但顺序相反，即最后一个元素最先开始。

[查看更多高级选项](https://gsap.com/resources/getting-started/Staggers)

## 回调函数

- **onComplete**：动画完成时调用。
- **onStart**：动画开始时调用
- **onUpdate**：每次动画更新时调用（动画处于活动状态时的每一帧）。
- **onRepeat**：每次动画重复时调用。
- **onReverseComplete**：当动画反转并再次开始时调用。

## 插件

### ScrollTrigger

ScrollTrigger 可以把gsap和滚动事件结合实现滚动动画

高级配置

```js
let tl = gsap.timeline({
    // yes, we can add it to an entire timeline!
    scrollTrigger: {
        trigger: '.container',
        pin: true, // pin the trigger element while active
        start: 'top top', // when the top of the trigger hits the top of the viewport
        end: '+=500', // end after scrolling 500px beyond the start
        scrub: 1, // smooth scrubbing, takes 1 second to "catch up" to the scrollbar
        snap: {
            snapTo: 'labels', // snap to the closest label in the timeline
            duration: { min: 0.2, max: 3 }, // the snap animation should be at least 0.2 seconds, but no more than 3 seconds (determined by velocity)
            delay: 0.2, // wait 0.2 seconds from the last scroll event before doing the snapping
            ease: 'power1.inOut' // the ease of the snap animation ("power3" by default)
        }
    }
});

// add animations and labels to the timeline
tl.addLabel('start')
    .from('.box p', { scale: 0.3, rotation: 45, autoAlpha: 0 })
    .addLabel('color')
    .from('.box', { backgroundColor: '#28a92b' })
    .addLabel('spin')
    .to('.box', { rotation: 360 })
    .addLabel('end');
```

- trigger 表示触发的元素
- pin 表示sticky效果
- start 描述trigger中的元素**和****滚动条**上必须相遇才能启动 动画。例如，`"top center"`表示*“当trigger的顶部触及滚动条的中心时”*（默认情况下，滚动条为视口）。`"bottom 80%"`表示*“当触发器的底部触及视口顶部下方 80% 处时”（假设垂直滚动）。您可以使用诸如“top”、“bottom”、“center”（或“left”和“right”）之类的关键字，*或诸如`horizontal: true`“80%”之类的百分比，或诸如“100px”之类的像素值。百分比和像素始终相对于滚动条的顶部/左侧。您甚至可以使用复杂的相对值，例如，`"top bottom-=100px"`表示*“当触发器的顶部触及视口/滚动条底部上方 100px 处时”。*

- end  endTrigger **（**如果未定义触发器，则为触发器）和**scroller（**滚动条）上必须相遇才能结束 ScrollTrigger 的位置。例如，`"bottom center"`表示*“当 endTrigger 的底部触及 scroller 的中心时”*。`"center 100px"`表示*“当 endTrigger 的中心距离 scroller 顶部向下 100px 时”*（假设垂直滚动）。您可以使用诸如“top”、“bottom”、“center”（或“left”和“right” `horizontal: true`）之类的关键字，或诸如“80%”之类的百分比，或诸如“100px”之类的像素值。百分比和像素始终相对于元素/视口的顶部/左侧。您还可以定义单个相对值，例如“+=300”，表示*“超出起始位置 300px”*，或“+=100%”表示*“超出起始位置的 scroller 高度”。*`"max"`是一个特殊关键字，表示最大滚动位置。
- scrub 将动画进度直接链接到滚动条，使其像一个滑块一样运行。您可以应用平滑处理，使播放头需要一点时间才能跟上滚动条的位置！它可以是以下任意值**布尔值**-`scrub: true`将动画的进度直接链接到 ScrollTrigger 的进度。**数字**- 播放头“追赶”所需的时间（以秒为单位），因此`scrub: 0.5`动画的播放头需要 0.5 秒才能追赶上滚动条的位置。这对于平滑动画非常有用。
- snap \- 允许您在用户***停止滚动后***捕捉到特定的进度值（介于 0 和 1 之间）。因此，将以 0.1 的增量（10%、20%、30% 等）捕捉。只会让它停留在其中一个特定的进度值上。可以是以下任意值……`snap: 0.1``snap: [0, 0.1, 0.5, 0.8, 1]`***页面滚动条会慢慢滚动吸附到该进度点***  当snap值为`labels`时，捕捉到时间轴上最近的标签（当然，动画必须是带有标签的时间轴）

#### 更加高级的自定义滚动动画

```js
ScrollTrigger.create({
    trigger: '#id',
    start: 'top top',
    endTrigger: '#otherID',
    end: 'bottom 50%+=100px',
    onToggle: (self) => console.log('toggled, isActive:', self.isActive),
    onUpdate: (self) => {
        console.log(
            'progress:',
            self.progress.toFixed(3),
            'direction:',
            self.direction,
            'velocity',
            self.getVelocity()// 滚动速度
        );
    }
});
```

### ScrollSmoother

ScrollSmoother 为基于 ScrollTrigger 的页面添加了垂直平滑滚动效果。与大多数平滑滚动库不同，ScrollSmoother 采用**原生**滚动——它不会添加“假”滚动条，同时它可以给元素定义半速滚动来添加视差效果，也可以设置元素滞后

#### 使用

```html
<body>
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <!--- ALL YOUR CONTENT HERE --->
    </div>
  </div>
  <!-- position: fixed elements can go outside --->
</body>
```

必须在滚动内容上嵌套这2层wrapper容器

在PC端会设置`smooth-wrapper `为`position: fixed`占满视口，而子元素的`smooth-content`的transform滚动

```js
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
gsap.registerPlugin(ScrollTrigger, ScrollSmoother)
```

```js
  ScrollSmoother.create({
    smooth: 2,
    effects: true,
    normalizeScroll: true,
  })
```

- `normalizeScroll： true` 功能可防止 [大多数] 移动浏览器地址栏隐藏/显示（调整视口大小），停止滚动行为，并解决多线程同步挑战！

## 使用技巧

1. `ScrollTrigger.create`和`clip-path`根据滚动进度来动态裁剪

2. 可以使用`clip-path`+`position:absolute`覆盖来动态给车模换肤

3. `clip-path`动态变化时必须使用同一单位和节点数一致，否则动画会突变
4. `gsap.timeline`可以动态拼接点击动画
5. 变速红包雨还是使用帧动画比较方便