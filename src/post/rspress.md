## 介绍

Rspress 是一个基于 [Rsbuild](https://rsbuild.dev/) 的静态站点生成器，基于 React 框架进行渲染，内置了一套默认的文档主题，你可以通过 Rspress 来快速搭建一个文档站点，同时也可以自定义主题，来满足你的个性化静态站需求，比如博客站、产品主页等。当然，你也可以接入官方提供的相应插件来方便地搭建组件库文档。

## 约定式路由

Rspress 使用的是文件系统路由，页面的文件路径会简单的映射为路由路径，这样会让整个项目的路由非常直观。

### 映射规则

Rspress 会自动扫描根目录和所有子目录，并将文件路径映射到路由路径。例如，如果你有以下的文件结构：

```
docs
├── foo
│   └── bar.md
└── foo.md
```

那么 `bar.md` 的路由路径会是 `/foo/bar`，`foo.md` 的路由路径会是 `/foo`。

具体映射规则如下：

| 文件路径        | 路由路径   |
| --------------- | ---------- |
| `index.md`      | `/`        |
| `/foo.md`       | `/foo`     |
| `/foo/bar.md`   | `/foo/bar` |
| `/zoo/index.md` | `/zoo/`    |

### 组件路由

在约定式路由中，除了 `.md(x)` 文件，还可以使用 `.tsx` 文件作为路由组件，在 `.tsx` 中默认导出一个组件，该组件会被自动注册到路由中。例如：

```tsx
export default () => {
  return <div>foo</div>;
};// 会显示该组件
```

当然，如果你想要定制布局，可以添加一个导出，声明布局类型，例如：

```tsx
export const frontmatter = {
  // 声明布局类型
  // 这里的 custom 布局中不会出现侧边栏
  pageType: 'custom',
};
```

### 自定义行为

如果要自定义路由行为，可以使用配置文件中的 `route` 字段。例如：

```ts
import { defineConfig } from 'rspress/config';

export default defineConfig({
  route: {
    // These files will be excluded from the routing (support glob pattern)
    exclude: ['component/**/*']
    // These files will be included in the routing (support glob pattern)
    include: ['other-dir/**/*'],
  }
});
```

### 最佳实践

我们推荐你将文档文件放在 `docs` 目录下，这样可以让你的项目更加清晰。而对于非文档内容，比如自定义组件、工具函数等，可以放到 `docs` 目录之外进行维护。比如：

```
docs
└── foo.mdx
src
├── components
│   └── CustomComponent.tsx
└── utils
    └── utils.ts
```

## 自动生成导航

在 Rspress 中，除了在配置文件中通过 `themeConfig` 声明 [nav](https://rspress.rs/zh/api/config/config-theme#nav) 和 [sidebar](https://rspress.rs/zh/api/config/config-theme#sidebar)， 你也可以通过声明 `_meta.json` 描述文件来自动化生成导航栏和侧边栏，我们更加推荐后者，因为可以使配置文件更加简洁和清晰。

::: tip

当配置文件 `rspress.config.ts` 中没有 `nav` 和 `sidebar` 配置的情况下，自动化导航栏/侧边栏才会生效。

:::

### 基础概念

Rspress 通过 `_nav.json` 生成导航栏，通过 `_meta.json` 生成侧边栏。导航级别的 `_nav.json` 位于文档根目录中，而侧边栏级别的 `_meta.json` 位于文档根目录的子目录中。比如:

```
docs
├── _nav.json // 导航栏级别
└── guides
    ├── _meta.json // 侧边栏级别
    ├── introduction.mdx
    └── advanced
        ├── _meta.json // 侧边栏级别
        └── plugin-development.md
```

### 导航栏级别配置

在导航栏级别的情况中，你可以在 `_nav.json` 中填入一个数组，其类型跟默认主题的 nav 配置完全一致，详情可以参考 [nav 配置](https://v2.rspress.rs/zh/api/config/config-theme#nav)。比如:

```json
[
  {
    "text": "Guide",
    "link": "/guides/introduction",
    "activeMatch": "^/guides/"
  }
]
```

### 侧边栏级别配置

在侧边栏级别的情况中，你可以在 `_meta.json` 中填入一个数组，数组每一项的类型如下:

```tsx
export type FileSideMeta = {
  type: 'file';
  name: string;
  label?: string;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};

export type DirSideMeta = {
  type: 'dir';
  name: string;
  label?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};

export type DirSectionHeaderSideMeta = Omit<DirSideMeta, 'type'> &
  Omit<SectionHeaderMeta, 'type'> & { type: 'dir-section-header' };

export type DividerSideMeta = {
  type: 'divider';
  dashed?: boolean;
};

export type SectionHeaderMeta = {
  type: 'section-header';
  label: string;
  tag?: string;
};

export type CustomLinkMeta =
  | {
      // file link
      type: 'custom-link';
      label: string;
      tag?: string;
      overviewHeaders?: number[];
      context?: string;
      link: string;
    }
  | {
      // dir link
      type: 'custom-link';
      label: string;
      tag?: string;
      overviewHeaders?: number[];
      context?: string;
      link?: string;
      collapsible?: boolean;
      collapsed?: boolean;
      items: _CustomLinkMetaWithoutTypeField[];
    };

export type SideMetaItem =
  | FileSideMeta
  | DirSideMeta
  | DirSectionHeaderSideMeta
  | DividerSideMeta
  | SectionHeaderMeta
  | CustomLinkMeta
  | string;
```

#### file

- 当类型为 `string` 时，表示该项是一个文件，文件名为该字符串，比如:

```json
["introduction"]
```

其中文件名可以带后缀，也可以不带后缀，比如 `introduction` 会被解析为 `introduction.mdx`。

- 当类型为对象形式时，你可以描述为一个文件、目录或者自定义链接。

在描述**文件**的情况下，类型如下:

```tsx
export type FileSideMeta = {
  type: 'file';
  name: string;
  label?: string;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};
```

其中，`name` 表示文件名，同时支持`带`/`不带`后缀，`label` 表示该文件在侧边栏中的显示名称，为可选值，如果未填则会自动取文档中的 h1 标题。`overviewHeaders` 表示该文件在预览页中展示的标题级别，为可选值，默认为 `[2]`。`context` 表示在生成侧边栏时在所在的 DOM 节点添加 `data-context` 属性的值。为可选值，默认不会添加。比如:

```json
{
  "type": "file",
  "name": "introduction",
  "label": "Introduction"
}
```

#### dir

在描述**目录**的情况下，类型如下:

```tsx
export type DirSideMeta = {
  type: 'dir';
  name: string;
  label?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  tag?: string;
  overviewHeaders?: number[];
  context?: string;
};
```

其中，`name` 表示目录名，`label` 表示该目录在侧边栏中的显示名称，`collapsible` 表示该目录是否可以折叠，`collapsed` 表示该目录是否默认折叠，`overviewHeaders` 表示该目录下的文件在预览页中展示的标题级别，为可选值，默认为 `[2]`，即 h2。`context` 表示在生成侧边栏时在所在的 DOM 节点添加 `data-context` 属性的值。为可选值，默认不会添加。比如:

```json
{
  "type": "dir",
  "name": "advanced",
  "label": "Advanced",
  "collapsible": true,
  "collapsed": false
}
```

