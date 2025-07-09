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

