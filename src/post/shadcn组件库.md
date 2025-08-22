## 简介

与其他组件库相比，Shadcn UI 提供了几个好处。

- 是一个基于tailwindcss的css原子化组件库

- 易用性：使用复制和粘贴或 CLI 安装方法可以轻松访问其组件.
- 灵活和可扩展性：Shadcn UI 只会下载需要使用的组件在源码中，并且开发者可以灵活定制和修改。

## 安装

### 安装tailwindcss相关依赖库

和tailwindcss官网一致，只是多了配置tsconfig的`@`路径别名配置

### 运行脚手架初始化项目

```bash
pnpm dlx shadcn@latest init
```

- 生成一份组件库全局配置JSON

  components.json

  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "",
      "css": "src/index.css",
      "baseColor": "neutral",
      "cssVariables": true,
      "prefix": ""
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    },
    "iconLibrary": "lucide"
  }
  ```

- 安装了以下依赖

  - *class-variance-authority* 

    通过 CVA，开发者能以声明式方式管理复杂 UI 样式，显著提升代码可维护性。用于组件库开发

  - *clsx*

    接受任意数量的 `ClassValue`类型参数（如 `'flex'`, `{ active: true }`, `['p-4', 'm-2']`），

    将输入参数转换为类名字符串（如 `'flex p-4 active'`）

  - *tailwind-merge*

    合并类名字符串，解决 Tailwind 类冲突（如 `p-4`和 `p-6`冲突时保留后者）

  - Lucide-react

    Lucide-react 是 **开源矢量图标库 Lucide 的 React 组件封装**，提供 1500+ 高质量 SVG 图标，支持动态调整样式、按需加载和深度定制

  - tw-animate-css 

    tw-animate-css 是 **专为 Tailwind CSS 设计的轻量级动画库**，提供声明式动画工具，支持按需加载和深度定制

- 在根样式文件中添加样式

  ```css
  @custom-variant dark (&:is(.dark *));
  ```

  **`@custom-variant`**：Tailwind CSS 的指令，用于定义自定义变体（Variant）。**`dark`**：自定义变体的名称，后续通过 `dark:`前缀调用。**`&:is(.dark \*)`**：CSS 选择器，匹配所有 **带有 `.dark`类的元素的后代元素**

  ::: tip

  在源码中书写的样式会经过vite的tailwindcss插件扫描转化成css样式，该指令同理也会被转化

  比如`dark:bg-black`会被转化为 

  ```css
  .dark\:bg-black {
      &:is(.dark *) {
        background-color: var(--color-black);
      }
    }
  ```

  当同时满足以下两个条件时生效：

  - 元素本身添加了 `.dark:bg-black`类
  - 该元素被包裹在带有 `.dark`类的父容器内

  背景色变为 `--color-black`变量值（纯黑）

  :::
