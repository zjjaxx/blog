## element-plus安装

### 跳过PUPPETEER安装

```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
```

## 调试

### 生成sourcemap

在`internal/build/build.config.ts`配置中设置`sourcemap:true`

执行

```bash
pnpm build
pnpm build:theme
```

### 运行dev

在源码上设置断点

新建`javaScript Debug Terminal`

```bash
pnpm dev
```

## [vue中的渲染函数 & JSX](https://cn.vuejs.org/guide/extras/render-function.html)

### 基本用法

:::  tip

`h()` 是 **hyperscript** 的简称——意思是“能生成 HTML (超文本标记语言) 的 JavaScript”。这个名字来源于许多虚拟 DOM 实现默认形成的约定。一个更准确的名称应该是 `createVNode()`，但当你需要多次使用渲染函数时，一个简短的名字会更省力

:::

Vue 提供了一个 `h()` 函数用于创建 vnodes：

```vue
import { ref, h } from 'vue'

export default {
  props: {
    /* ... */
  },
  setup(props) {
    const count = ref(1)

    // 返回渲染函数
    return () => h('div', props.msg + count.value)
  }
}
```

::: warning

Vnodes 必须唯一,组件树中的 vnodes 必须是唯一的。下面是错误示范：

```typescript
function render() {
  const p = h('p', 'hi')
  return h('div', [
    // 啊哦，重复的 vnodes 是无效的
    p,
    p
  ])
}
```

如果你真的非常想在页面上渲染多个重复的元素或者组件，你可以使用一个工厂函数来做这件事。比如下面的这个渲染函数就可以完美渲染出 20 个相同的段落：

```typescript
function render() {
  return h(
    'div',
    Array.from({ length: 20 }).map(() => {
      return h('p', 'hi')
    })
  )
}
```

:::

### JSX / TSX

::: tip

调用h函数生成vnode写法复杂，所以就有了jsx/tsx写法，更加的直观和语义化，同理vue的template模版语法也是类似效果

:::

[JSX](https://facebook.github.io/jsx/) 是 JavaScript 的一个类似 XML 的扩展，有了它，我们可以用以下的方式来书写代码：

```tsx
const vnode = <div id={dynamicId}>hello, {userName}</div>
```

::: tip

Vue 的类型定义也提供了 TSX 语法的类型推导支持。当使用 TSX 语法时，确保在 `tsconfig.json` 中配置了 `"jsx": "preserve"`，这样的 TypeScript 就能保证 Vue JSX 语法转换过程中的完整性。

:::

#### 渲染插槽

在渲染函数中，插槽可以通过 `setup()` 的上下文来访问。每个 `slots` 对象中的插槽都是一个**返回 vnodes 数组的函数**：

```vue
export default {
  props: ['message'],
  setup(props, { slots }) {
    return () => [
      // 默认插槽：
      // <div><slot /></div>
      h('div', slots.default()),

      // 具名插槽：
      // <div><slot name="footer" :text="message" /></div>
      h(
        'div',
        slots.footer({
          text: props.message
        })
      )
    ]
  }
}
```

等价 JSX 语法：

```tsx
// 默认插槽
<div>{slots.default()}</div>

// 具名插槽
<div>{slots.footer({ text: props.message })}</div>
```

##### 传递插槽

向组件传递子元素的方式与向元素传递子元素的方式有些许不同。我们需要传递一个插槽函数或者是一个包含插槽函数的对象而非是数组，插槽函数的返回值同一个正常的渲染函数的返回值一样——并且在子组件中被访问时总是会被转化为一个 vnodes 数组。

```tsx
// 单个默认插槽
h(MyComponent, () => 'hello')

// 具名插槽
// 注意 `null` 是必需的
// 以避免 slot 对象被当成 prop 处理
h(MyComponent, null, {
    default: () => 'default slot',
    foo: () => h('div', 'foo'),
    bar: () => [h('span', 'one'), h('span', 'two')]
})
```

等价 JSX 语法：

```tsx
// 默认插槽
<MyComponent>{() => 'hello'}</MyComponent>

// 具名插槽
<MyComponent>{{
  default: () => 'default slot',
  foo: () => <div>foo</div>,
  bar: () => [<span>one</span>, <span>two</span>]
}}</MyComponent>
```

插槽以函数的形式传递使得它们可以被子组件懒调用。这能确保它被注册为子组件的依赖关系，而不是父组件。这使得更新更加准确及有效。

##### 作用域插槽

为了在父组件中渲染作用域插槽，需要给子组件传递一个插槽。注意该插槽现在拥有一个 `text` 参数。该插槽将在子组件中被调用，同时子组件中的数据将向上传递给父组件

```tsx
// 父组件
export default {
  setup() {
    return () => h(MyComp, null, {
      default: ({ text }) => h('p', text)
    })
  }
}
```

记得传递 `null` 以避免插槽被误认为 prop：

```tsx
// 子组件
export default {
  setup(props, { slots }) {
    const text = ref('hi')
    return () => h('div', null, slots.default({ text: text.value }))
  }
}
```

等同于 JSX：

```tsx
<MyComponent>{{
  default: ({ text }) => <p>{ text }</p>  
}}</MyComponent>
```



## tabs组件原理

使用案例

```vue
<template>
  <div class="play-container">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="User" name="first">User</el-tab-pane>
      <el-tab-pane label="Config" name="second">Config</el-tab-pane>
      <el-tab-pane label="Role" name="third">Role</el-tab-pane>
      <el-tab-pane label="Task" name="fourth">Task</el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TabsPaneContext } from 'element-plus'
const activeName = ref('first')
const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>
```

- el-tabs作为父组件来管理整个tabs组件

  - 在setup钩子函数中初始化 children数组来收集el-tab-pane组件，注册el-tab-pane组件的registerPane方法，当前激活的modelValue,使用provide往子组件注入相关属性

    ::: tip

    提供的响应式状态使后代组件可以由此和提供者建立响应式的联系。当提供 / 注入响应式的数据时，**建议尽可能将任何对响应式状态的变更都保持在供给方组件中**。这样可以确保所提供状态的声明和变更操作都内聚在同一个组件内，使其更容易维护。

    :::

    ```
    provide(tabsRootContextKey, {
      props,// 组件属性
      currentName,//当前激活的modelValue
      registerPane,//注册el-tab-pane组件方法
      unregisterPane,//删除el-tab-pane组件方法
      nav$,// TabNav组件实例
    })
    ```

  - 渲染el-tab-pane组件

    ```tsx
       const panels = (
            <div class={ns.e('content')}>{renderSlot(slots, 'default')}</div>
          )
    ```

    - 生成el-tab-pane组件实例，执行el-tab-pane组件的setup钩子函数

    - 获取当前实例、获取插槽

    - inject获取注入的父组件内容

    - 初始化active计算属性表示当前el-tab-pane是否激活(通过判断currentName 和props.name属性是否相等)

    - 通过active计算属性来初始化loaded属性表示是否加载

    - 初始化shouldBeRender计算属性来判断组件是否应该被渲染（通过!props.lazy || loaded.value || active.value来判断）

    - 初始化el-tab-pane组件信息

      ```typescript
      const pane = reactive({
        uid: instance.uid,// 组件唯一ID
        getVnode: () => instance.vnode,// 组件的vnode
        slots,// 插槽
        props,// 组件属性
        paneName,// props.name属性
        active,//当前el-tab-pane是否激活
        index,
        isClosable,
        isFocusInsidePane,
      })
      ```

    - 调用registerPane方法注册el-tab-pane组件

      ```typescript
      tabsRoot.registerPane(pane)
      ```

  - 渲染tab-nav组件

    ```tsx
    const tabNav = () => (
          <TabNav
            ref={nav$}
            currentName={currentName.value}
            editable={props.editable}
            type={props.type}
            panes={panes.value}
            stretch={props.stretch}
            onTabClick={handleTabClick}
            onTabRemove={handleTabRemove}
          />
        )
    const header = (
        <div
          class={[
            ns.e('header'),
            isVertical.value && ns.e('header-vertical'),
            ns.is(props.tabPosition),
          ]}
        >
          {createVNode(PanesSorter, null, {
            default: tabNav,
            $stable: true,
          })}
          {newButton}
        </div>
      )
    ```

    - inject获取注入的父组件内容
