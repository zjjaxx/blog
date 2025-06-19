## 原子化CSS的优势

- **您可以更快地完成工作**- 您无需花费任何时间来想出类名、决定选择器或在 HTML 和 CSS 文件之间切换，因此您的设计可以非常快速地完成。
- **进行更改感觉更安全**——向元素添加或删除实用程序类只会影响该元素，因此您不必担心意外破坏使用相同 CSS 的另一个页面。
- **维护旧项目更容易**——改变某些东西只是意味着在项目中找到该元素并更改类，而不是试图记住六个月内没有接触过的所有自定义 CSS 是如何工作的。
- **您的代码更具可移植性**- 由于结构和样式都位于同一位置，您可以轻松地复制和粘贴整个 UI 块，即使在不同的项目之间也是如此。
- **您的 CSS 停止增长**— 由于实用程序类具有很高的可重用性，因此您的 CSS 不会随着您向项目中添加的每个新功能而继续线性增长。

### [为什么不直接使用内联样式？](https://tailwindcss.com/docs/styling-with-utility-classes#why-not-just-use-inline-styles)

::: details

使用实用程序类比内联样式有许多重要的优势，例如：

- **使用约束进行设计**——使用内联样式，每个值都是一个神奇的数字。使用实用程序，您可以从[预定义的设计系统](https://tailwindcss.com/docs/theme)中选择样式，这使得构建视觉一致的UI变得更加容易。
- **悬停、聚焦和其他状态**- 内联样式无法针对悬停或聚焦等状态，但 Tailwind 的[状态变体](https://tailwindcss.com/docs/hover-focus-and-other-states)可以轻松地使用实用程序类来设置这些状态的样式。
- **媒体查询**——您不能在内联样式中使用媒体查询，但您可以使用 Tailwind 的[响应式变体](https://tailwindcss.com/docs/responsive-design)轻松构建完全响应的界面。

:::

## 原子化CSS解决方案以及对比

UnoCSS、Windi CSS 和 Tailwind CSS 都是现代原子化 CSS 解决方案，但在设计理念、性能、灵活性和生态上存在显著差异。以下是三者的核心区别及适用场景分析：

###  **一、核心定位与设计理念**

|     **框架**     |         **定位**          |                         **核心特点**                         |
| :--------------: | :-----------------------: | :----------------------------------------------------------: |
| **Tailwind CSS** | 完整的 Utility-First 框架 | 提供预设工具类，强调开箱即用和一致性设计系统，需通过配置文件定制主题。 |
|  **Windi CSS**   |     Tailwind 的替代品     | 兼容 Tailwind API，优化构建性能（按需生成样式），支持动态值（如`w-1/3`动态计算）。 |
|    **UnoCSS**    |      原子化 CSS 引擎      | 无预设工具类，通过规则（Rules）和预设（Presets）高度自定义生成逻辑，追求极致性能。 |

### **二、性能对比**

|    **指标**    |    Tailwind CSS    |     Windi CSS     |         UnoCSS         |
| :------------: | :----------------: | :---------------: | :--------------------: |
|  **按需生成**  |    ✅ (JIT 模式)    |   ✅ (原生支持)    |      ✅ (原生支持)      |
| **冷启动速度** | 较慢（需解析 AST） | 快（免 AST 解析） | ⚡ **极快**（正则匹配） |
| **生产包体积** | 中等（JIT 优化后） |        小         |  最小（仅生成使用类）  |
| **HMR 热更新** |        较快        |        快         |      ⚡ **毫秒级**      |

### **三、配置与扩展性**

|    **能力**    |     Tailwind CSS     |        Windi CSS        |            UnoCSS             |
| :------------: | :------------------: | :---------------------: | :---------------------------: |
| **语法兼容性** |       原生语法       |      兼容 Tailwind      | ✅ 通过预设支持 Tailwind/Windi |
| **自定义规则** |       需写插件       |        需写插件         |    ✅ 直接配置规则（Rules）    |
|  **主题系统**  | 完善（`theme` 配置） |      类似 Tailwind      |     ✅ 支持 CSS 变量或配置     |
|   **动态值**   |    有限（需插件）    | ✅ 支持（如`w-${size}`） |          ✅ 原生支持           |

### **四、生态与工具链**

|     **生态**     |     Tailwind CSS     |     Windi CSS     |       UnoCSS        |
| :--------------: | :------------------: | :---------------: | :-----------------: |
|  **文档与社区**  |   ⭐⭐⭐⭐⭐（最成熟）    | ⭐⭐（已停止维护）  |    ⭐⭐⭐（增长快）    |
| **VSCode 支持**  | 官方插件（智能提示） |     社区插件      |      官方插件       |
| **构建工具集成** |     PostCSS 插件     | Vite/Webpack 插件 | ⚡ **Vite 深度优化** |
|   **维护状态**   |       活跃更新       |   ❌ 已停止维护    |      活跃更新       |

> 💡 Windi CSS 于 2023 年停止维护，UnoCSS 是其“精神继承者”

###  **五、适用场景推荐**

|        **需求场景**        |   **推荐方案**   |                        **理由**                        |
| :------------------------: | :--------------: | :----------------------------------------------------: |
| 快速开发、重视文档与稳定性 | **Tailwind CSS** |          生态成熟，适合团队协作和标准化项目。          |
|    极致性能、高度定制化    |    **UnoCSS**    | 灵活生成规则，毫秒级 HMR，适合 Vite 项目或微前端场景。 |
|  兼容 Tailwind 且优化性能  |  **Windi CSS**   | 旧项目优化选择（注：已停止维护，建议迁移至 UnoCSS）。  |
| 需要图标集成或 CDN 运行时  |    **UnoCSS**    |      唯一支持纯 CSS 图标和动态运行时生成的引擎。       |

------

### **总结一句话选择指南**：

> 性能敏感或技术探索型项目**首选 UnoCSS**，而企业级产品可优先考虑 **Tailwind CSS 的生态保障**

## [postcss-preset-env](https://www.npmjs.com/package/postcss-preset-env) CSS兼容性插件

[PostCSS Preset Env](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env)可让您将现代 CSS 转换为大多数浏览器可以理解的内容，并根据您的目标浏览器或运行时环境确定所需的 polyfill。

::: details

[PostCSS Preset Env 的](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env)作用是获取来自 MDN 和 Can I Use 的支持数据，并根据[浏览器](https://github.com/browserslist/browserslist)列表判断是否需要进行这些转换。它还打包了[Autoprefixer](https://github.com/postcss/autoprefixer)并与其共享列表，因此只有在浏览器支持列表中需要时才会应用前缀。

:::

## css新特性

###  [@layer](https://www.zhangxinxu.com/wordpress/2022/05/css-layer-rule/)

`@layer` 是 CSS 原生特性，用于**分层管理样式优先级**，解决大型项目或第三方库的样式冲突问题

::: details

我们在实际开发的时候，经常会使用第三方组件。

但是这些组件虽然功能是我们需要的，但是 UI 样式却和产品的风格不一致，我们需要对这些组件的 UI 进行重置，换个肤，变个色什么的。

如何重置呢？

很简单，使用优先级更高的选择器进行覆盖即可。

然而，这样的代码又臭又长。

有些 Web 组件甚至还有 CSS reset 代码，而所有的 CSS 在同一个文档流中都公用同一个上下文（无论是 Shadow DOM 还是 iframe 都可以看成是一个独立的上下文），这就导致这些CSS代码会影响全局样式。

同一个 CSS 上下文中，有些 CSS 声明需要设置低优先级，且这种优先级不受选择器权重的影响。

`@layer` 规则就是解决上面这种场景应运而生的。

可以让 CSS 声明的优先级下降一整个级联级别。

:::

## Tailwind CSS

::: tip

Tailwind 的工作原理是扫描项目中的实用程序类，然后根据您实际使用的类生成所有必要的 CSS。

这可确保您的 CSS 尽可能小，并且还能实现[任意值](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)等功能。

[扫描哪些文件](https://tailwindcss.com/docs/detecting-classes-in-source-files#which-files-are-scanned)

Tailwind 将扫描项目中的每个文件以查找类名，但以下情况除外：

- `.gitignore`您的文件中的文件
- 二进制文件，例如图像、视频或 zip 文件
- CSS 文件
- 通用包管理器锁文件

[明确注册来源](https://tailwindcss.com/docs/detecting-classes-in-source-files#explicitly-registering-sources)

:::

### 编辑器设置

[VS Code 的 IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)通过为用户提供自动完成、语法突出显示和 linting 等高级功能增强了 Tailwind 开发体验。

- **自动完成**——为实用程序类以及[CSS 函数和指令](https://tailwindcss.com/docs/functions-and-directives)提供智能建议。
- **Linting** — 突出显示 CSS 和标记中的错误和潜在缺陷。
- **悬停预览**— 将鼠标悬停在实用程序类上时显示其完整的 CSS。
- **语法高亮**——以便正确高亮使用自定义 CSS 语法的 Tailwind 功能。

### prettier 美化

我们为 Tailwind CSS 维护一个官方的[Prettier 插件，它会按照我们](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)[推荐的类顺序](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier#how-classes-are-sorted)自动对您的类进行排序。

### 兼容性

::: tip

Tailwind CSS v4.0 是针对现代浏览器设计和测试的，该框架的核心功能具体取决于以下浏览器版本：

- **Chrome 111** *（2023 年 3 月发布）*
- **Safari 16.4** *（2023 年 3 月发布）*
- **Firefox 128** *（2024 年 7 月发布）*

由于 Tailwind 是为现代浏览器设计的，因此您实际上不需要用于嵌套或变量等内容的预处理器，而 Tailwind 本身会执行诸如捆绑导入和添加供应商前缀等操作。

:::

#### [Sass、Less 和 Stylus](https://tailwindcss.com/docs/compatibility#sass-less-and-stylus)

Tailwind CSS v4.0 是一款功能齐全的 CSS 构建工具，专为特定工作流程而设计，不适用于与 Sass、Less 或 Stylus 等 CSS 预处理器一起使用。

#### 变量

Tailwind 内部严重依赖 CSS 变量，因此如果您可以在项目中使用 Tailwind，那么您就可以使用原生 CSS 变量。

#### vue 中的style标签

如果您将 Tailwind 与这些工具一起使用，**我们建议您避免`<style>`在组件中使用块**，而直接在标记中使用实用程序类来设置样式，这是 Tailwind 的使用方式。

如果您确实使用了块，并且希望如下功能能够按预期工作，`<style>`请确保导入全局样式作为参考：

导入全局样式作为参考，以确保主题变量已定义

```vue
<template>
  <button><slot /></button>
</template>
<style scoped>
  @reference "../assets/main.css";
  button {
    @apply bg-blue-500;
  }
</style>
```

### 核心概念

::: tip

[语法详情链接](https://tailwindcss.com/docs/hover-focus-and-other-states)

:::

#### [悬停和焦点状态的样式](https://tailwindcss.com/docs/styling-with-utility-classes#styling-hover-and-focus-states)

要在悬停或聚焦等状态下设置元素的样式，请在任何实用程序前加上您想要定位的状态，例如`hover:bg-sky-700`：

#### [媒体查询和断点](https://tailwindcss.com/docs/styling-with-utility-classes#media-queries-and-breakpoints)

就像悬停和焦点状态一样，您可以通过在任何实用程序前加上要应用该样式的断点来在不同的断点处设置元素的样式：

```html
<div class="grid grid-cols-2 sm:grid-cols-3">
  <!-- ... -->
</div>
```

#### [瞄准黑暗模式](https://tailwindcss.com/docs/styling-with-utility-classes#targeting-dark-mode)

在黑暗模式下设置元素的样式只需将`dark:`前缀添加到要在黑暗模式激活时应用的任何实用程序即可：

#### [使用任意值](https://tailwindcss.com/docs/styling-with-utility-classes#using-arbitrary-values)

[Tailwind 中的许多实用程序由主题变量](https://tailwindcss.com/docs/theme)驱动，例如`bg-blue-500`、`text-xl`和`shadow-md`，它们映射到您的底层调色板、类型比例和阴影。

当您需要在主题之外使用一次性值时，请使用特殊的方括号语法指定任意值：

```html
<button class="bg-[#316ff6] ...">
  Sign in with Facebook
</button>
```

#### [复杂选择器](https://tailwindcss.com/docs/styling-with-utility-classes#complex-selectors)

有时您需要在多种条件下设置元素的样式，例如在暗模式下、在特定断点处、悬停时以及当元素具有特定数据属性时。

```html
<button class="dark:lg:data-current:hover:bg-indigo-600 ...">
  <!-- ... -->
</button>
```

#### [使用重要修饰符](https://tailwindcss.com/docs/styling-with-utility-classes#using-the-important-modifier)

当你确实需要强制特定的实用程序类生效并且没有其他方法来管理特殊性时，你可以`!`在类名末尾添加以进行所有声明`!important`：

```html
<div class="bg-teal-500 bg-red-500!">
  <!-- ... -->
</div>
```

#### [使用前缀选项](https://tailwindcss.com/docs/styling-with-utility-classes#using-the-prefix-option)

如果您的项目有与 Tailwind CSS 实用程序冲突的类名，您可以使用以下选项为所有 Tailwind 生成的类和 CSS 变量添加前缀`prefix`：

```css
@import "tailwindcss" prefix(tw);
```

#### 主题变量

::: tip

##### [为什么`@theme`不是`:root`？](https://tailwindcss.com/docs/theme#why-theme-instead-of-root)

由于主题变量的作用比常规 CSS 变量更多，Tailwind 使用特殊语法，以便始终明确定义主题变量。主题变量也必须在顶层定义

##### [使用主题变量](https://tailwindcss.com/docs/theme#using-your-theme-variables)

编译 CSS 时，所有主题变量都会转换为常规 CSS 变量：

```css
:root {
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}
```

##### [与实用程序类的关系](https://tailwindcss.com/docs/theme#relationship-to-utility-classes)

Tailwind 中的一些实用程序类（例如`flex`和 ）`object-cover`是静态的，并且在各个项目中始终相同。但许多其他类是由主题变量驱动的，并且仅因您定义的主题变量而存在。

:::

Tailwind 是一个用于构建自定义设计的框架，不同的设计需要不同的排版、颜色、阴影、断点等。

这些低级设计决策通常被称为*设计令牌*，在 Tailwind 项目中，您将这些值存储在*主题变量*中。

例如，您可以通过定义主题变量向项目添加新颜色，例如`--color-black-500`：

```css
@import 'tailwindcss';
@theme {
  --color-black-500: #232323;
}
```

现在您可以在 HTML 中使用

```html
<h1 class="bg-black-500 w-375 text-3xl font-bold text-white underline">Hello world!</h1>
```

Tailwind 还为您的主题变量生成常规 CSS 变量，以便您可以以任意值或内联样式引用您的设计令牌：

```html
<div style="background-color: var(--color-black-500)">
  <!-- ... -->
</div>
```

##### [主题变量命名空间](https://tailwindcss.com/docs/theme#theme-variable-namespaces)

| 命名空间           | 实用类                                               |
| ------------------ | ---------------------------------------------------- |
| `--color-*`        | 颜色实用程序，例如`bg-red-500`、、`text-sky-300`等等 |
| `--font-*`         | 字体系列实用程序，例如`font-sans`                    |
| `--text-*`         | 字体大小实用程序，例如`text-xl`                      |
| `--font-weight-*`  | 字体粗细实用程序，例如`font-bold`                    |
| `--tracking-*`     | 字母间距实用程序，例如`tracking-wide`                |
| `--leading-*`      | 行高实用程序，例如`leading-tight`                    |
| `--breakpoint-*`   | 响应式断点变体，例如`sm:*`                           |
| `--container-*`    | 容器查询变体`@sm:*`和大小实用程序`max-w-md`          |
| `--spacing-*`      | 间距和大小实用程序，例如`px-4`、`max-h-16`等等       |
| `--radius-*`       | 边框半径实用程序，例如`rounded-sm`                   |
| `--shadow-*`       | 盒子阴影实用程序，例如`shadow-md`                    |
| `--inset-shadow-*` | 插入框阴影实用程序，例如`inset-shadow-xs`            |
| `--drop-shadow-*`  | 阴影滤镜实用程序，例如`drop-shadow-md`               |
| `--blur-*`         | 模糊滤镜实用程序，例如`blur-md`                      |
| `--perspective-*`  | 透视实用程序，例如`perspective-near`                 |
| `--aspect-*`       | 宽高比实用程序，例如`aspect-video`                   |
| `--ease-*`         | 过渡时间函数实用程序，例如`ease-out`                 |
| `--animate-*`      | 动画实用程序，例如`animate-spin`                     |

##### 完全禁用默认主题并仅使用自定义值

```css
@import "tailwindcss";
@theme {
  --*: initial;
  --spacing: 4px;
  --font-body: Inter, sans-serif;
  --color-lagoon: oklch(0.72 0.11 221.19);
  --color-coral: oklch(0.74 0.17 40.24);
  --color-driftwood: oklch(0.79 0.06 74.59);
  --color-tide: oklch(0.49 0.08 205.88);
  --color-dusk: oklch(0.82 0.15 72.09);
}
```

##### 定义动画

```css
@import "tailwindcss";
@theme {
  --animate-fade-in-scale: fade-in-scale 0.3s ease-out;
  @keyframes fade-in-scale {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

### [屏幕适配](https://github.com/worldzhao/blog/issues/20)

### 
