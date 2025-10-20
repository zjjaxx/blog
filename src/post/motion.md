### [主要优势](https://motion.dev/docs/react#key-advantages)

此时它是您的项目的正确选择。

- **专为 React 打造。**其他动画库集成起来比较麻烦，而 Motion 的声明式 API 则像是 React 的自然延伸。动画可以直接与状态和属性关联。
- **硬件加速。Motion**利用与纯 CSS 相同的高性能浏览器动画，确保您的 UI 保持流畅和灵敏。您可以通过更简单、更富表现力的 API 获得 120fps 动画的强大功能。
- **为任何内容添加动画效果。CSS**有严格的限制。有些值无法添加动画效果，有些关键帧无法中断，有些交错必须硬编码。Motion 提供统一一致的 API，可处理从简单的过渡到高级滚动、布局和手势驱动效果的所有内容。
- **类似应用程序的手势。**标准 CSS`:hover`事件在触摸设备上并不可靠。Motion 提供强大的跨设备手势识别器，支持点击、拖动和悬停，让您轻松构建在任何设备上都感觉原生且直观的交互。

## 基本使用

```tsx
import * as motion from "motion/react-client";
function App() {
  return (
    <div className="h-full flex items-center justify-center">
      <motion.ul
        initial={{ scale: 0 }}
        className="h-20 w-20 rounded-md block bg-red-500"
        transition={{ duration: 1 }}
        animate={{ rotate: 360, scale: 1 }}
      />
    </div>
  );
}

export default App;
```

当组件进入页面时，它将自动动画到`animate`prop 中定义的值。

您可以通过 prop 提供动画值`initial`（否则这些值将从 DOM 中读取）。

### [悬停和点击动画](https://motion.dev/docs/react#hover-tap-animation)

`<motion />`[通过强大的手势动画](https://motion.dev/docs/react-gestures)扩展了 React 的事件系统。目前支持悬停、点击、聚焦和拖动。

```tsx
<motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className="h-20 w-20 rounded-md block bg-red-500"
  />
```

### [滚动动画](https://motion.dev/docs/react#scroll-animation)

```tsx
<motion.div
  initial={{ backgroundColor: "rgb(0, 255, 0)", opacity: 0 }}
  whileInView={{ backgroundColor: "rgb(255, 0, 0)", opacity: 1 }}
/>
```

而要将值直接链接到滚动位置，可以通过使用`MotionValue`s `useScroll`。

```tsx
 const { scrollYProgress } = useScroll({
    container:containerRef,
 })
return <motion.div style={{ scaleX: scrollYProgress }} />
```

### [布局动画](https://motion.dev/docs/react#layout-animation)

Motion 拥有业界领先的[布局动画](https://motion.dev/docs/react-layout-animations)引擎，支持使用变换在布局变化之间制作动画。

就像使用`layout`道具一样简单。

```tsx
  <div className="h-20 flex border-1 border-blue-400">
         {isOn && <div className="h-full w-1/2 bg-blue-400"></div>}
        <motion.div layout className="h-full flex-1 bg-red-400"></motion.div>
  </div>
```

或者在完全不同的元素之间进行动画处理， `layoutId`

```tsx
 <ul style={tabsContainer}>
      {tabs.map((item) => (
          <motion.li
              key={item.label}
              initial={false}
              animate={{
                  backgroundColor:
                      item === selectedTab ? "#eee" : "#eee0",
              }}
              style={tab}
              onClick={() => setSelectedTab(item)}
          >
              {`${item.icon} ${item.label}`}
              {item === selectedTab ? (
                  <motion.div
                      style={underline}
                      layoutId="underline"
                      id="underline"
                  />
              ) : null}
          </motion.li>
      ))}
  </ul>
```

### [退出动画](https://motion.dev/docs/react#exit-animations)

通过包装`motion`组件，`<AnimatePresence>`我们可以访问[退出动画](https://motion.dev/docs/react-animate-presence)。这使我们能够在元素从 DOM 中移除时为其设置动画。

```tsx
   <div className="h-20 flex border-1 border-blue-400">
        <AnimatePresence>
         {isOn && <motion.div exit={{ opacity: 0 }} transition={{ duration: 2 }} className="h-full w-1/2 bg-blue-400"></motion.div>}
        </AnimatePresence>
        <motion.div layout className="h-full flex-1 bg-red-400"></motion.div>
   </div>
```

## 动画

每个 HTML 和 SVG 元素都可以用组件来定义`motion`,这些组件与普通的静态组件完全相同，只是现在它们可以使用一堆[特殊的动画道具](https://motion.dev/docs/react-motion-component#props)。

```
<motion.div />
<motion.a href="#" />
<motion.circle cx={0} />
```

### [Transforms](https://motion.dev/docs/react-animation#transforms)

It supports the following special transform values:

- Translate: `x`, `y`, `z`
- Scale: `scale`, `scaleX`, `scaleY`
- Rotate: `rotate`, `rotateX`, `rotateY`, `rotateZ`
- Skew: `skew`, `skewX`, `skewY`
- Perspective: `transformPerspective`

### [支持的值类型](https://motion.dev/docs/react-animation#supported-value-types)

Motion 可以为以下任意值类型设置动画：

- 数字：`0`等`100`
- 包含数字的字符串：等`"0vh"`。`"10px"`
- 颜色：十六进制、RGBA、HSLA。
- 包含多个数字和/或颜色的复杂字符串（如`box-shadow`）。
- `display: "none"/"block"`和`visibility: "hidden"/"visible"`

### [动画 CSS 变量](https://motion.dev/docs/react-animation#animating-css-variables)

有时，使用 CSS 变量来为多个子元素设置动画会很方便：

```tsx
<motion.ul
  initial={{ '--rotate': '0deg' }}
  animate={{ '--rotate': '360deg' }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <li style={{ transform: 'rotate(var(--rotate))' }} />
  <li style={{ transform: 'rotate(var(--rotate))' }} />
  <li style={{ transform: 'rotate(var(--rotate))' }} />
</motion.ul>
```

### [CSS 变量作为动画目标](https://motion.dev/docs/react-animation#css-variables-as-animation-targets)

HTML`motion`组件接受带有 CSS 变量的动画目标：

```tsx
<motion.li animate={{ backgroundColor: "var(--action-bg)" }} />
```

### [过渡](https://motion.dev/docs/react-animation#transitions)

[您可以通过 prop](https://motion.dev/docs/react-transitions)[定义](https://motion.dev/docs/react-transitions)自己的动画。`transition`

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{ ease: "easeOut", duration: 2 }}
/>
```

transition`可以使用以下组件为许多组件设置[默认](https://motion.dev/docs/react-motion-config)值：`MotionConfig

```tsx
<MotionConfig transition={{ duration: 0.3 }}>
  <motion.div animate={{ opacity: 1 }} />
  // etc
```

### [关键帧](https://motion.dev/docs/react-animation#keyframes)

到目前为止，我们已经将动画道具（如`animate`和）设置`exit`为单个值，如`opacity: 0`。

当我们想要从当前值动画到新值时，这非常有用。但有时我们希望通过一系列**值**来制作动画。在动画术语中，这些被称为**关键帧**。

所有动画道具都可以接受关键帧数组：

```tsx
import * as motion from "motion/react-client"

export default function Keyframes() {
    return (
        <motion.div
            animate={{
                scale: [1, 2, 2, 1, 1],
                rotate: [0, 0, 180, 180, 0],
                borderRadius: ["0%", "0%", "50%", "50%", "0%"],
            }}
            transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.2, 0.5, 0.8, 1],
                repeat: Infinity,
                repeatDelay: 1,
            }}
            style={box}
        />
    )
}

/**
 * ==============   Styles   ================
 */

const box = {
    width: 100,
    height: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
}

```

### [手势动画](https://motion.dev/docs/react-animation#gesture-animations)

支持的手势有：

- `whileHover`
- `whileTap`
- `whileFocus`
- `whileDrag`
- `whileInView`

### [变体](https://motion.dev/docs/react-animation#variants)

对于简单的单元素动画来说，将其设置`animate`为目标非常有用。此外，还可以编排在整个 DOM 中传播的动画。我们可以使用变体来实现这一点。

变体是一组命名的目标。这些名称可以是任意的。

```tsx
const variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}
```

`motion`变体通过prop传递给组件`variants`：

```tsx
<motion.div variants={variants} />
```

现在，只要您可以定义动画目标，就可以通过标签引用这些变体：

```tsx
<motion.div
  variants={variants}
  initial="hidden"
  whileInView="visible"
  exit="hidden"
/>
```

您还可以通过数组定义多个变体：

```tsx
animate={["visible", "danger"]}
```

示例

```tsx
const [status, setStatus] = useState<"inactive" | "active" | "complete">(
  "inactive"
);

<motion.div
  animate={status} // pass in our React state!
  variants={{
    inactive: { scale: 0.9 color: "var(--gray-500)" },
    active: { scale: 1 color: "var(--blue-500)" },
    complete: { scale: 1 color: "var(--blue-500)" }
  }}
>
  <motion.svg
    path={checkmarkPath}
    variants={{
      inactive: { pathLength: 0 },
      active: { pathLength: 0 },
      complete: { pathLength: 1}
    }}
  />
</motion.div>
```

### [传播](https://motion.dev/docs/react-animation#propagation)

变体对于动画目标的复用和组合非常有用。但它对于在整个树中编排动画来说更加强大。

变体会向下流动，贯穿`motion`整个组件。因此，在本例中，当`ul`进入视口时，其所有具有“可见”变体的子项也会进行动画处理：

```tsx
const list = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}

const item = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -100 },
}

return (
  <motion.ul
    initial="hidden"
    whileInView="visible"
    variants={list}
  >
    <motion.li variants={item} />
    <motion.li variants={item} />
    <motion.li variants={item} />
  </motion.ul>
)
```

### [编排](https://motion.dev/docs/react-animation#orchestration)

默认情况下，子动画将与父动画同时启动。但通过变体，我们可以访问新的`transition`道具[和](https://motion.dev/docs/react-transitions#orchestration)。`when``delayChildren`

```tsx
const list = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      delayChildren: stagger(0.3), // Stagger children by .3 seconds
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren",
    },
  },
```

### [动态变体](https://motion.dev/docs/react-animation#dynamic-variants)

每个变体都可以定义为一个函数，当变体被激活时该函数就会解析。

```tsx
const variants = {
  hidden: { opacity: 0 },
  visible: (index) => ({
    opacity: 1,
    transition: { delay: index * 0.3 }
  })
}
```

这些函数提供了一个参数，该参数通过`custom`prop 传递：

```tsx
items.map((item, index) => <motion.div custom={index} variants={variants} />)
```

### [动画控制](https://motion.dev/docs/react-animation#animation-controls)

声明式动画是大多数 UI 交互的理想选择。但有时我们需要手动控制动画播放。

该[钩子](https://motion.dev/docs/react-use-animate)可用于：`useAnimate`

- 为任何 HTML/SVG 元素（不仅仅是`motion`组件）制作动画。
- 复杂的动画序列。
- `time`使用、、和其他播放`speed`控件控制动画。`play()``pause()`

```tsx
function MyComponent() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const controls = animate([
      [scope.current, { x: "100%" }],
      ["li", { opacity: 1 }]
    ])

    controls.speed = 0.8

    return () => controls.stop()
  }, [])

  return (
    <ul ref={scope}>
      <li />
      <li />
      <li />
    </ul>
  )
}
```

## 布局动画

::: tip

当组件重新渲染并且其布局发生变化时，会触发布局动画。

:::

要在组件上启用布局动画`motion`，只需添加该`layout`属性即可。现在，由于 React 渲染而发生的任何布局更改都将自动以动画形式呈现。

```tsx
<motion.div layout />
```

或者通过使用`layoutId`道具，可以匹配两个元素并在它们之间进行动画处理，以实现一些真正高级的动画。

::: tip

对于更高级的共享布局动画，`layoutId`允许您连接两个不同的元素。

当添加一个与`layoutId`现有组件匹配的道具的新组件时，它将自动从旧组件中动画出来。

```tsx
isSelected && <motion.div layoutId="underline" />
```

:::

```
"use client"

import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import { useState } from "react"

export default function SharedLayoutAnimation() {
    const [selectedTab, setSelectedTab] = useState(tabs[0])

    return (
        <div style={container}>
            <nav style={nav}>
                <ul style={tabsContainer}>
                    {tabs.map((item) => (
                        <motion.li
                            key={item.label}
                            initial={false}
                            animate={{
                                backgroundColor:
                                    item === selectedTab ? "#eee" : "#eee0",
                            }}
                            style={tab}
                            onClick={() => setSelectedTab(item)}
                        >
                            {`${item.icon} ${item.label}`}
                            {item === selectedTab ? (
                                <motion.div
                                    style={underline}
                                    layoutId="underline"
                                    id="underline"
                                />
                            ) : null}
                        </motion.li>
                    ))}
                </ul>
            </nav>
            <main style={iconContainer}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab ? selectedTab.label : "empty"}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={icon}
                    >
                        {selectedTab ? selectedTab.icon : "😋"}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}

/**
 * ==============   Styles   ================
 */

const container: React.CSSProperties = {
    width: 480,
    height: "60vh",
    maxHeight: 360,
    borderRadius: 10,
    background: "white",
    overflow: "hidden",
    boxShadow:
        "0 1px 1px hsl(0deg 0% 0% / 0.075), 0 2px 2px hsl(0deg 0% 0% / 0.075), 0 4px 4px hsl(0deg 0% 0% / 0.075), 0 8px 8px hsl(0deg 0% 0% / 0.075), 0 16px 16px hsl(0deg 0% 0% / 0.075), 0 2px 2px hsl(0deg 0% 0% / 0.075), 0 4px 4px hsl(0deg 0% 0% / 0.075), 0 8px 8px hsl(0deg 0% 0% / 0.075), 0 16px 16px hsl(0deg 0% 0% / 0.075)",
    display: "flex",
    flexDirection: "column",
}

const nav: React.CSSProperties = {
    background: "#fdfdfd",
    padding: "5px 5px 0",
    borderRadius: "10px",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottom: "1px solid #eeeeee",
    height: 44,
}

const tabsStyles: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    fontWeight: 500,
    fontSize: 14,
}

const tabsContainer: React.CSSProperties = {
    ...tabsStyles,
    display: "flex",
    width: "100%",
}

const tab: React.CSSProperties = {
    ...tabsStyles,
    borderRadius: 5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: "100%",
    padding: "10px 15px",
    position: "relative",
    background: "white",
    cursor: "pointer",
    height: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    userSelect: "none",
    color: "#0f1115",
}

const underline: React.CSSProperties = {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    background: "var(--accent)",
}

const iconContainer: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
}

const icon: React.CSSProperties = {
    fontSize: 128,
}

/**
 * ==============   Data   ================
 */

const allIngredients = [
    { icon: "🍅", label: "Tomato" },
    { icon: "🥬", label: "Lettuce" },
    { icon: "🧀", label: "Cheese" },
    { icon: "🥕", label: "Carrot" },
    { icon: "🍌", label: "Banana" },
    { icon: "🫐", label: "Blueberries" },
    { icon: "🥂", label: "Champers?" },
]

const [tomato, lettuce, cheese] = allIngredients
const tabs = [tomato, lettuce, cheese]

```

布局更改可以是任何事情，更改`width`/ `height`、网格列数、重新排序列表或添加/删除新项目

::: tip

传统上，动画布局速度较慢，但 Motion 使用 CSS`transform`属性执行所有布局动画，以实现最高的性能。

:::

如果您需要专门为布局动画设置过渡，同时为其他属性（如`opacity`）设置不同的过渡，则可以定义专用`layout`过渡。

```tsx
<motion.div
  layout
  animate={{ opacity: 0.5 }}
  transition={{
    ease: "linear",
    layout: { duration: 0.3 }
  }}
/>
```

### [可滚动元素内的动画](https://motion.dev/docs/react-layout-animations#animating-within-scrollable-element)

为了正确地在可滚动容器内实现布局动画，您必须`**layoutScroll**`向可滚动元素添加该属性。这样，Motion 就能考虑元素的滚动偏移。

```tsx
<motion.div layoutScroll style={{ overflow: "scroll" }} />
```

### [在固定容器内制作动画](https://motion.dev/docs/react-layout-animations#animating-within-fixed-containers)

为了正确地在固定元素内设置动画布局，我们需要为它们提供`layoutRoot`prop。

```tsx
<motion.div layoutRoot style={{ position: "fixed" }} />
```

### 多个布局动画

但是，当我们有两个或多个组件不同时重新渲染，但**又会**影响彼此的布局时会发生什么？

```tsx
function List() {
  return (
    <>
      <Accordion />
      <Accordion />
    </>  
  )
}
```

当一个重新渲染时，由于性能原因，另一个将无法检测到其布局的变化。

我们可以通过将布局更改包装在 中来同步多个组件之间的布局更改。

[LayoutGroup component](https://motion.dev/docs/react-layout-group)

```tsx
import { LayoutGroup } from "motion/react"

function List() {
  return (
    <LayoutGroup>
      <Accordion />
      <Accordion />
    </LayoutGroup>  
  )
}
```

## 滚动动画

滚动动画有两种类型：

- **滚动触发：**当元素进入视口时触发正常动画。
- **滚动链接：**值直接与滚动进度链接。

### [滚动触发的动画](https://motion.dev/docs/react-scroll-animations#scroll-triggered-animations)

滚动触发动画只是当元素进入或离开视口时触发的普通动画。

当元素进入视图时，Motion 提供设置动画目标或变体[的道具](https://motion.dev/docs/react-motion-component#whileinview)[。](https://motion.dev/docs/react-motion-component#whileinview)`whileInView`

```tsx
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
/>
```

### [一次性动画](https://motion.dev/docs/react-scroll-animations#one-time-animations)

通过[选项](https://motion.dev/docs/react-motion-component#viewport-1)，可以进行设置`viewport`[，](https://motion.dev/docs/react-motion-component#viewport-1)`once: true`这样一旦元素进入视口，它就不会以动画形式返回。

```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
/>
```

### [更改滚动容器](https://motion.dev/docs/react-scroll-animations#changing-scroll-container)

默认情况下，元素进入/离开**窗口**时将被视为在视口内。这可以通过提供`ref`另一个可滚动元素的 来更改。

```tsx
function Component() {
  const scrollRef = useRef(null)
  
  return (
    <div ref={scrollRef} style={{ overflow: "scroll" }}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ root: scrollRef }}
      />
    </div>
  )
}
```

### [滚动链接动画](https://motion.dev/docs/react-scroll-animations#scroll-linked-animations)

滚动链接动画是使用[运动值](https://motion.dev/docs/react-motion-value)和`useScroll`[钩子](https://motion.dev/docs/react-use-scroll)创建的。

useScroll`返回四个运动值，两个以像素为单位存储滚动偏移量（`scrollX`和），另外两个以介于和`scrollY`之间的值存储滚动进度。`0``1

这些运动值可以直接传递给特定样式。例如，传递`scrollYProgress`给`scaleX`进度条效果很好。

```tsx
const { scrollYProgress } = useScroll();

return (
  <motion.div style={{ scaleX: scrollYProgress }} />  
)
```

::: tip

由于`scrollY`是`MotionValue`，因此您可以使用一个巧妙的技巧来判断用户的滚动方向何时发生变化：

```tsx
const { scrollY } = useScroll()
const [scrollDirection, setScrollDirection] = useState("down")

useMotionValueEvent(scrollY, "change", (current) => {
  const diff = current - scrollY.getPrevious()
  setScrollDirection(diff > 0 ? "down" : "up")
})
```

:::



## 过渡

定义在两个值之间进行动画时使用的动画类型。

### [特定于值的转换](https://motion.dev/docs/react-transitions#value-specific-transitions)

当为多个值设置动画时，每个值都可以使用不同的过渡进行动画处理，并`default`处理所有其他值：

```tsx
// Motion component
<motion.li
  animate={{
    x: 0,
    opacity: 1,
    transition: {
      default: { type: "spring" },
      opacity: { ease: "linear" }
    }
  }}
/>

// animate() function
animate("li", { x: 0, opacity: 1 }, {
  default: { type: "spring" },
  opacity: { ease: "linear" }
})
```

### [过渡设置](https://motion.dev/docs/react-transitions#transition-settings)

#### [`type`](https://motion.dev/docs/react-transitions#type)

**默认值：**动态

`type`决定要使用的动画类型。可以是`"tween"`、`"spring"`或`"inertia"`。

#### [`ease`](https://motion.dev/docs/react-transitions#ease)

与补间动画一起使用的缓动函数。

- 缓动函数名称。

  - `"linear"`
  - `"easeIn"`，，`"easeOut"``"easeInOut"`
  - `"circIn"`，，`"circOut"``"circInOut"`
  - `"backIn"`，，`"backOut"``"backInOut"`
  - `"anticipate"`

  *我通常使用*`*"easeOut"*`*曲线来过渡进入和退出。开始时的加速会给用户一种响应式的感觉。我使用不超过*`*0.3*`*/*`*0.4*`*秒的持续时间来保持动画的快速性。*

- 四个数字组成的数组，用于定义三次贝塞尔曲线。例如`[.17,.67,.83,.67]`
- JavaScript[缓动函数](https://motion.dev/docs/easing-functions)，接受并返回一个值- 。`0``1`

### spring

#### [`bounce`](https://motion.dev/docs/react-transitions#bounce)

**默认：** `0.25`

`bounce`确定弹簧动画的“弹性”。

#### [`damping`](https://motion.dev/docs/react-transitions#damping)

**默认：** `10`

反作用力的强度。如果设置为 0，弹簧将无限振荡。

#### [`mass`](https://motion.dev/docs/react-transitions#mass)

**默认：** `1`

运动物体的质量。值越高，运动越迟缓。

#### [`stiffness`](https://motion.dev/docs/react-transitions#stiffness)

**默认：** `1`

弹簧的刚度。值越高，产生的运动越突然。

#### velocity

弹簧的初速度。



### 编排

#### [`delay`](https://motion.dev/docs/react-transitions#delay)

**默认：**`0`

将动画延迟此持续时间（以秒为单位）。

#### [`repeat`](https://motion.dev/docs/react-transitions#repeat)

**默认：**`0`

重复过渡的次数。设置为`Infinity`可实现永久动画。

```tsx
<motion.div
  animate={{ rotate: 180 }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

#### [`repeatType`](https://motion.dev/docs/react-transitions#repeattype)

**默认：**`"loop"`

如何重复动画。可以是：

- `loop`：从头开始重复动画。
- `reverse`：在向前和向后播放之间交替。
- `mirror`：每次迭代时切换动画原点和目标。

#### [`repeatDelay`](https://motion.dev/docs/react-transitions#repeatdelay)

**默认：**`0`

重复动画时，`repeatDelay`将设置每次重复之间等待的时间长度（以秒为单位）。

#### [`when`](https://motion.dev/docs/react-transitions#when)

**默认：**`false`

通过变体描述动画相对于其子动画的触发时间。

- `"beforeChildren"`：子动画将在父动画完成后播放。
- `"afterChildren"`：子动画完成后，父动画将会播放。

#### [`delayChildren`](https://motion.dev/docs/react-transitions#delaychildren)

**默认：**`0`

对于变体，`delayChildren`在父级上进行设置将使子级动画延迟此持续时间（以秒为单位）。

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.5
    }
  }
}

const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
}

return (
  <motion.ul
    variants={container}
    initial="hidden"
    animate="show"
  >
    <motion.li variants={item} />
    <motion.li variants={item} />
  </motion.ul>
)
```

使用该功能，我们可以在子级之间错开延迟。`stagger`

```tsx
const transition = {
  delayChildren: stagger(0.1)
}
```

默认情况下，延迟会从第一个子元素到最后一个子元素交错执行。通过使用`stagger`的`from`选项，我们可以从最后一个子元素、中心或特定索引处交错执行。

```tsx
const transition = {
  delayChildren: stagger(0.1, { from: "last" })
}
```

