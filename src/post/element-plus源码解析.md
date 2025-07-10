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

  - 在setup钩子函数中初始化 children数组来收集el-tab-pane组件，初始化注册el-tab-pane组件的registerPane方法，初始化当前激活的modelValue,使用provide往子组件注入相关属性和方法

    ::: tip

    提供的响应式状态使后代组件可以由此和提供者建立响应式的联系。当提供 / 注入响应式的数据时，**建议尽可能将任何对响应式状态的变更都保持在供给方组件中**。这样可以确保所提供状态的声明和变更操作都内聚在同一个组件内，使其更容易维护。

    :::

    ```typescript
    provide(tabsRootContextKey, {
      props,// 组件属性
      currentName,//当前激活的modelValue
      registerPane,//注册el-tab-pane组件方法
      unregisterPane,//删除el-tab-pane组件方法
      nav$,// TabNav组件实例
    })
    ```

    ::: details

    深度解析useOrderedChildren
  
    在Tab组件中，虽然每个 tab-pane 在其 setup 函数中直接调用了 tabsRoot.registerPane(pane) ，但仍然需要排序的原因如下：
  
    1. 组件初始化顺序不一定等于渲染顺序 ：
       即使 tab-pane 按顺序调用 registerPane ，但由于Vue的响应式系统和组件生命周期的特性，组件的实际渲染顺序可能与初始化顺序不同 `tabs.tsx` 。
    2. 动态组件加载 ：
       当 tab-pane 包含异步组件或懒加载内容时，它们的加载完成时间可能不同，导致实际可用顺序与注册顺序不一致。
    3. 条件渲染的影响 ：
       如果 tab-pane 使用了 v-if 等条件渲染指令，它们的注册和显示状态可能会动态变化，需要排序来确保一致的展示顺序。
    4. 组件复用和重新排序 ：
       在复杂的应用场景中， tab-pane 可能会被动态添加、删除或重新排序，排序机制确保了即使在这些情况下，标签页仍然能够保持正确的显示顺序。
    5. useOrderedChildren 钩子的设计 ：
       从代码中可以看到， tabs 组件使用了 useOrderedChildren 钩子来管理 tab-pane ，这个钩子专门设计用于处理子组件的排序问题，确保即使在复杂的场景下，子组件也能按照正确的顺序展示。
       综上所述，即使 tab-pane 在 setup 函数中直接调用了 registerPane ，仍然需要排序机制来确保标签页按照正确的顺序显示，特别是在复杂的应用场景中。

    :::

  - 渲染el-tab-pane组件

<<<<<<< Updated upstream
=======
    ```tsx
       const panels = (
            <div class={ns.e('content')}>{renderSlot(slots, 'default')}</div>
          )
    ```
  
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

=======
  
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
>>>>>>> Stashed changes
