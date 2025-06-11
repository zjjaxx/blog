## 目录结构

### `.vitepress` 

`.vitepress` 目录是 VitePress 配置文件、开发服务器缓存、构建输出和可选主题自定义代码的位置。

默认情况下，VitePress 将其开发服务器缓存存储在 `.vitepress/cache` 中，并将生产构建输出存储在 `.vitepress/dist` 中。如果使用 Git，应该将它们添加到 `.gitignore` 文件中。也可以手动[配置](https://vitepress.dev/zh/reference/site-config#outdir)这些位置。

#### 配置文件

配置文件 (`.vitepress/config.js`) 让你能够自定义 VitePress 站点的各个方面，最基本的选项是站点的标题和描述：

```js
export default {
  // 站点级选项
  title: 'VitePress',
  description: 'Just playing around.',

  themeConfig: {
    // 主题级选项
     nav: [// 导航栏
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
		// 内容区的左边导航栏
    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],
		// 导航栏右侧链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
}
```

### 源文件

`.vitepress` 目录之外的 Markdown 文件被视为**源文件**

VitePress 使用 **基于文件的路由**：每个 `.md` 文件将在相同的路径被编译成为 `.html` 文件。例如，`index.md` 将会被编译成 `index.html`，可以在生成的 VitePress 站点的根路径 `/` 进行访问。

*** 默认文件路径和路由一一对应，。但是，可以通过 [`srcDir`](https://vitepress.dev/zh/reference/site-config#srcdir) 配置选项对其进行配置***

配置效果为

```
src/index.md            -->  /index.html (可以通过 / 访问)
src/getting-started.md  -->  /getting-started.html
```

## markdown扩展

### 页面中的跳转

在页面之间链接时，可以使用绝对路径和相对路径。请注意，虽然 `.md` 和 `.html` 扩展名都可以使用，但最佳做法是省略文件扩展名，以便 VitePress 可以根据配置生成最终的 URL。

```markdown
[Getting Started](./getting-started)
```

### frontmatter

可以自定义页面配置，可以使用 frontmatter 配置来覆盖站点级别或主题级别的配置选项

- title

​		浏览器标签页的标题

- titleTemplate

  标题的后缀

- 仅默认主题

  - layout(默认doc)
    - `doc`——它将默认文档样式应用于 markdown 内容。
    - `home`——首页特殊布局。可以添加额外的选项，例如 `hero` 和 `features`，以快速创建漂亮的落地页。
    - `page`——表现类似于 `doc`，但它没有任何样式

  - navbar（默认true）

    是否显示[导航栏](https://vitepress.dev/zh/reference/default-theme-nav)。

  - sidebar（默认true）

    是否显示 [侧边栏](https://vitepress.dev/zh/reference/default-theme-sidebar).

  -  aside（默认true）

    定义侧边栏组件在 `doc` 布局中的位置。

    将此值设置为 `false` 可禁用侧边栏容器。
    将此值设置为 `true` 会将侧边栏渲染到右侧。
    将此值设置为 `left` 会将侧边栏渲染到左侧。

  - outline（默认值：`2`）

    大纲中显示的标题级别。类型：`number | [number, number] | 'deep' | false`

  - pageClass

    将额外的类名称添加到特定页面。

    ```yaml
    ---
    pageClass: custom-page-class
    ---
    ```

    然后可以在 `.vitepress/theme/custom.css` 文件中自定义该特定页面的样式：

    ```css
    .custom-page-class {
      /* 特定页面的样式 */
    }
    ```

### 目录表 

**输入**

```
[[toc]]
```

### 自定义容器

自定义容器可以通过它们的类型、标题和内容来定义。

```markdown
::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::
```

可以通过在容器的 "type" 之后附加文本来设置自定义标题。

````markdown
::: danger STOP
危险区域，请勿继续
:::

::: details 点我查看代码
```js
console.log('Hello, VitePress!')
```
:::
````

此外，可以通过在站点配置中添加以下内容来全局设置自定义标题，如果不是用英语书写，这会很有帮助：

```js
// config.ts
export default defineConfig({
  // ...
  markdown: {
    container: {
      tipLabel: '提示',
      warningLabel: '警告',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详细信息'
    }
  }
  // ...
})
```

`raw`

这是一个特殊的容器，可以用来防止与 VitePress 的样式和路由冲突。这在记录组件库时特别有用

```markdown
::: raw
Wraps in a `<div class="vp-raw">`
:::
```

### 代码块中聚焦

在某一行上添加 `// [!code focus]` 注释将聚焦它并模糊代码的其他部分。

此外，可以使用 `// [!code focus:<lines>]` 定义要聚焦的行数。

**输入**

````markdown
```js
export default {
  data () {
    return {
      msg: 'Focused!' // [!code focus]
    }
  }
}
```
````

### 代码块中的颜色差异

在某一行添加 `// [!code --]` 或 `// [!code ++]` 注释将会为该行创建 diff，同时保留代码块的颜色。

**输入**

````markdown
```js
export default {
  data () {
    return {
      msg: 'Removed' // [!code --]
      msg: 'Added' // [!code ++]
    }
  }
}
```
````

### 导入代码片段

可以通过下面的语法来从现有文件中导入代码片段：

```markdown
<<< @/filepath
```

也可以使用 [VS Code region](https://code.visualstudio.com/docs/editor/codebasics#_folding) 来只包含代码文件的相应部分。可以在文件目录后面的 `#` 符号后提供一个自定义的区域名：

**输入**

```markdown
<<< @/snippets/snippet-with-region.js#snippet{1}
```

数字表示第几行高亮

源文件

```js
// #region snippet
function foo() {
  // ..
}
// #endregion snippet

export default foo
```

也可以像这样在大括号内(`{}`)指定语言：

### 代码组

可以像这样对多个代码块进行分组：

**输入**

````markdown
::: code-group

```js [config.js]
/**
 * @type {import('vitepress').UserConfig}
 */
const config = {
  // ...
}

export default config
```

```ts [config.ts]
import type { UserConfig } from 'vitepress'

const config: UserConfig = {
  // ...
}

export default config
```

:::
````

也可以在代码组中[导入代码片段](https://vitepress.dev/zh/guide/markdown#import-code-snippets)：

## public 目录

可以将这些文件放置在[源目录](https://vitepress.dev/zh/guide/routing#source-directory)的 `public` 目录中。例如，如果项目根目录是 `./docs`，并且使用默认源目录位置，那么 public 目录将是 `./docs/public`。

请注意，应使用根绝对路径来引用放置在 `public` 中的文件——例如，`public/icon.png` 应始终在源代码中使用 `/icon.png` 引用。

## 在 Markdown 使用 Vue

在 VitePress 中，每个 Markdown 文件都被编译成 HTML，而且将其作为 [Vue 单文件组件](https://cn.vuejs.org/guide/scaling-up/sfc.html)处理。这意味着可以在 Markdown 中使用任何 Vue 功能，包括动态模板、使用 Vue 组件或通过添加 `<script>` 标签为页面的 Vue 组件添加逻辑。

### `<script>` 和 `<style>`

Markdown 文件中的根级 `<script>` 和 `<style>` 标签与 Vue SFC 中的一样，包括 `<script setup>`、`<style module>` 等。这里的主要区别是没有 `<template>` 标签

还可以访问 VitePress 的运行时 API，例如 [`useData` 辅助函数](https://vitepress.dev/zh/reference/runtime-api#usedata)，它提供了当前页面的元数据：

### 使用组件

可以直接在 Markdown 文件中导入和使用 Vue 组件。

```vue
<script setup>
import CustomComponent from '../../components/CustomComponent.vue'
</script>

# Docs

This is a .md using a custom component

<CustomComponent />

## More docs

...
```

### 使用 CSS 预处理器

```vue
<style lang="sass">
.title
  font-size: 20px
</style>
```

### 注册全局组件

`.vitepress/theme/index.js`

```typescript
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 注册自定义全局组件
    app.component('MyGlobalComponent' /* ... */)
  }
} satisfies Theme
```