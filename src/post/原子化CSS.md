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

Autoprefixer 和 postcss-preset-env 是前端开发中常用的两个 PostCSS 插件，但它们的定位和功能存在显著差异。以下是两者的核心区别及适用场景分析：

------

### 一、核心功能对比

| **功能维度**   | **Autoprefixer**                              | **postcss-preset-env**                            |
| :------------- | :-------------------------------------------- | :------------------------------------------------ |
| **核心目标**   | 自动添加浏览器前缀                            | 现代 CSS 特性转换 + 自动添加前缀                  |
| **主要能力**   | 根据浏览器支持情况添加 `-webkit`/`-moz`等前缀 | 转换现代 CSS 语法（如变量、嵌套）并自动处理兼容性 |
| **依赖关系**   | 独立插件                                      | 内置 Autoprefixer，整合其他 PostCSS 插件          |
| **配置复杂度** | 需单独配置浏览器列表                          | 通过 Browserslist 统一配置，支持多工具共享        |
| **适用场景**   | 仅需处理浏览器前缀                            | 需要转换现代语法（如 CSS Grid、自定义属性）       |

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

::: warning

必须在css中导入`tailwindcss`，否则vscode插件不生效

:::

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

#### 响应式

[移动优先](https://tailwindcss.com/docs/responsive-design#working-mobile-first)

Tailwind 使用移动优先断点系统，类似于您在 Bootstrap 等其他框架中使用的系统。

这意味着不带前缀的实用程序（如`uppercase`）在所有屏幕尺寸上都会生效，而带前缀的实用程序（如）仅在指定的断点*及以上*`md:uppercase`才会生效。

[瞄准移动屏幕](https://tailwindcss.com/docs/responsive-design#targeting-mobile-screens)

这种方法最常让人感到惊讶的是，为了给移动设备设计样式，你需要使用实用程序的无前缀版本，而不是`sm:`带前缀的版本。不要把 理解`sm:`为“在小屏幕上”，而要理解为“在小*断点处*”。

##### [定位断点范围](https://tailwindcss.com/docs/responsive-design#targeting-a-breakpoint-range)

默认情况下，规则所应用的样式`md:flex`将在该断点处应用，并在更大的断点处保持应用。

如果您只想在特定断点范围处于活动状态时应用实用程序*，*请将响应式变体`md`与`max-*`变体堆叠在一起，以将该样式限制在特定范围内：

```html
<div class="md:max-xl:flex">
  <!-- ... -->
</div>
```

| 断点前缀 | 最小宽度             | CSS                               |
| -------- | -------------------- | --------------------------------- |
| `sm`     | 40rem *（640像素）*  | `@media (width >= 40rem) { ... }` |
| `md`     | 48rem *（768像素）*  | `@media (width >= 48rem) { ... }` |
| `lg`     | 64rem *（1024像素）* | `@media (width >= 64rem) { ... }` |
| `xl`     | 80rem *（1280像素）* | `@media (width >= 80rem) { ... }` |
| `2xl`    | 96rem *（1536像素）* | `@media (width >= 96rem) { ... }` |

Tailwind`max-*`为每个断点生成相应的变体，因此开箱即用，有以下变体可用：

| 变体      | 媒体查询                         |
| --------- | -------------------------------- |
| `max-sm`  | `@media (width < 40rem) { ... }` |
| `max-md`  | `@media (width < 48rem) { ... }` |
| `max-lg`  | `@media (width < 64rem) { ... }` |
| `max-xl`  | `@media (width < 80rem) { ... }` |
| `max-2xl` | `@media (width < 96rem) { ... }` |

##### [容器查询](https://tailwindcss.com/docs/responsive-design#container-queries)

[容器查询](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)是一项现代 CSS 功能，它允许您根据父元素的大小（而不是整个视口的大小）来设置样式。它允许您构建更加可移植和可复用的组件，因为它们可以根据组件的实际可用空间进行更改。

使用`@container`类将元素标记为容器，然后使用类似`@sm`和的变体`@md`根据容器的大小设置子元素的样式：

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row">
    <!-- ... -->
  </div>
</div>
```

[容器查询范围](https://tailwindcss.com/docs/responsive-design#container-query-ranges)

```html
<div class="@container">
  <div class="flex flex-row @sm:@max-md:flex-col">
    <!-- ... -->
  </div>
</div>
```

##### [命名容器](https://tailwindcss.com/docs/responsive-design#named-containers)

对于使用多个嵌套容器的复杂设计，您可以使用 来命名容器，并使用和 等`@container/{name}`变体来定位特定容器：`@sm/{name}``@md/{name}`

```html
<div class="@container/main">
  <!-- ... -->
  <div class="flex flex-row @sm/main:flex-col">
    <!-- ... -->
  </div>
</div>
```

##### [使用任意值](https://tailwindcss.com/docs/responsive-design#using-arbitrary-container-query-values)

对于您不想添加到主题的一次性容器查询大小，请使用类似`@min-[475px]`和的变体：`@max-[960px]`

```html
<div class="@container">
  <div class="flex flex-col @min-[475px]:flex-row">
    <!-- ... -->
  </div>
</div>
```

##### [集装箱尺寸参考](https://tailwindcss.com/docs/responsive-design#container-size-reference)

默认情况下，Tailwind 包含的容器尺寸范围从 16rem *（256px）*到 80rem *（1280px）*：

| 变体   | 最小宽度             | CSS                                 |
| ------ | -------------------- | ----------------------------------- |
| `@3xs` | 16rem *（256像素）*  | `@container (width >= 16rem) { … }` |
| `@2xs` | 18rem *（288像素）*  | `@container (width >= 18rem) { … }` |
| `@xs`  | 20rem *（320像素）*  | `@container (width >= 20rem) { … }` |
| `@sm`  | 24rem *（384像素）*  | `@container (width >= 24rem) { … }` |
| `@md`  | 28rem *（448像素）*  | `@container (width >= 28rem) { … }` |
| `@lg`  | 32rem *（512像素）*  | `@container (width >= 32rem) { … }` |
| `@xl`  | 36rem *（576px）*    | `@container (width >= 36rem) { … }` |
| `@2xl` | 42rem *（672px）*    | `@container (width >= 42rem) { … }` |
| `@3xl` | 48rem *（768像素）*  | `@container (width >= 48rem) { … }` |
| `@4xl` | 56rem *（896px）*    | `@container (width >= 56rem) { … }` |
| `@5xl` | 64rem *（1024像素）* | `@container (width >= 64rem) { … }` |
| `@6xl` | 72rem *（1152像素）* | `@container (width >= 72rem) { … }` |
| `@7xl` | 80rem *（1280像素）* | `@container (width >= 80rem) { … }` |

::: tip

[语法详情链接](https://tailwindcss.com/docs/hover-focus-and-other-states)

:::

#### [悬停和焦点状态的样式](https://tailwindcss.com/docs/styling-with-utility-classes#styling-hover-and-focus-states)

要在悬停或聚焦等状态下设置元素的样式，请在任何实用程序前加上您想要定位的状态，例如`hover:bg-sky-700`：

#### 特殊选择器

##### :has()

使用此`has-*`变体可以根据其子元素的状态或内容来设置元素的样式：

```html
<label
  class="has-checked:bg-indigo-50 has-checked:text-indigo-900 has-checked:ring-indigo-200 dark:has-checked:bg-indigo-950 dark:has-checked:text-indigo-200 dark:has-checked:ring-indigo-900 ..."
>
  <svg fill="currentColor">
    <!-- ... -->
  </svg>
  Google Pay
  <input type="radio" class="checked:border-indigo-500 ..." />
</label>

```

你可以使用`has-*`伪类（例如 `@ `has-[:focus]`ElementById`）来根据子元素的状态设置元素的样式。你也可以使用元素选择器（例如 `@ElementById``has-[img]`或 `@ `has-[a]`ElementById`）来根据子元素的内容设置元素的样式。

##### group

如果需要根据父元素的子元素来设置目标元素的样式，可以使用类名标记父元素`group`，然后使用`group-has-*`变体来设置目标元素的样式：

```html
<div class="group ...">
  <img src="..." />
  <h4>Spencer Sharp</h4>
  <svg class="hidden group-has-[a]:block ..."><!-- ... --></svg>
  <p>Product Designer at <a href="...">planeteria.tech</a></p>
</div>
```

这种模式适用于每个伪类变体，例如`group-focus`，，`group-active`甚至`group-odd`。

```html
<a href="#" class="group ...">
  <div>
    <svg class="stroke-sky-500 group-hover:stroke-white ..." fill="none" viewBox="0 0 24 24">
      <!-- ... -->
    </svg>
    <h3 class="text-gray-900 group-hover:text-white ...">New project</h3>
  </div>
  <p class="text-gray-500 group-hover:text-white ...">Create a new project from a variety of starting templates.</p>
</a>
```

###### [区分嵌套组](https://tailwindcss.com/docs/hover-focus-and-other-states#differentiating-nested-groups)

*在嵌套分组时，您可以根据特定*父分组的状态来设置某些元素的样式，方法是使用类为父分组指定一个唯一的分组名称`group/{name}`，并在变体中使用类似这样的类来包含该名称`group-hover/{name}`：

```html
<ul role="list">
  {#each people as person}
    <li class="group/item ...">
      <!-- ... -->
      <a class="group/edit invisible group-hover/item:visible ..." href="tel:{person.phone}">
        <span class="group-hover/edit:text-gray-700 ...">Call</span>
        <svg class="group-hover/edit:translate-x-0.5 group-hover/edit:text-gray-500 ..."><!-- ... --></svg>
      </a>
    </li>
  {/each}
</ul>
```



##### peer

当您需要根据*同级*元素的状态来设置某个元素的样式时，请使用类名标记同级元素`peer`，并使用`peer-*`类似以下的变体`peer-invalid`来设置目标元素的样式：

```html
<form>
  <label class="block">
    <span class="...">Email</span>
    <input type="email" class="peer ..." />
    <p class="invisible peer-invalid:visible ...">Please provide a valid email address.</p>
  </label>
</form>
```

::: tip

需要注意的是，由于CSS 中[后续兄弟元素组合器的](https://developer.mozilla.org/en-US/docs/Web/CSS/Subsequent-sibling_combinator)`peer`工作方式，该标记只能用于*之前的兄弟元素：*

```html
<label>
  <span class="peer-invalid:text-red-500 ...">Email</span>
  <input type="email" class="peer ..." />
</label>
```

不行，只有之前的兄弟姐妹才能被标记为同级。

:::

如果需要根据兄弟元素的后代元素来设置目标元素的样式，可以使用类名标记兄弟元素`peer`，然后使用`peer-has-*`变体来设置目标元素的样式：

```html
<div>
  <label class="peer ...">
    <input type="checkbox" name="todo[1]" checked />
    Create a to do list
  </label>
  <svg class="peer-has-checked:hidden ..."><!-- ... --></svg>
</div>
```

当使用多个对等节点时，您可以通过为*特定*对等节点指定一个唯一的类名`peer/{name}`，并使用该类在变体中包含该名称，从而根据特定对等节点的状态设置样式，例如`peer-checked/{name}`：

##### [数据属性](https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes)

使用该`data-*`变体可以根据[数据属性](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)有条件地应用样式。

```html
<!-- Will apply -->
<div data-active class="border border-gray-300 data-active:border-purple-500">
  <!-- ... -->
</div>
<!-- Will not apply -->
<div class="border border-gray-300 data-active:border-purple-500">
  <!-- ... -->
</div>
```

如果需要检查特定值，可以使用任意值：

```html
<!-- Will apply -->
<div data-size="large" class="data-[size=large]:p-8">
  <!-- ... -->
</div>
<!-- Will not apply -->
<div data-size="medium" class="data-[size=large]:p-8">
  <!-- ... -->
</div>
```



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

主题变量不仅仅是*CSS*变量 - 它们还连接到实用程序类。

当您想要定义一个不打算连接到实用程序类的变量时，可以使用`:root`

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

##### [自定义主题](https://tailwindcss.com/docs/theme#customizing-your-theme)

用于`@theme`定义新的主题变量并扩展默认主题：

```css
@import "tailwindcss";
@theme {
  --font-script: Great Vibes, cursive;
}
```

##### [覆盖默认主题](https://tailwindcss.com/docs/theme#overriding-the-default-theme)

```css
@import "tailwindcss";
@theme {
  --breakpoint-sm: 30rem;
}
```

要完全覆盖默认主题中的整个命名空间，请`initial`使用特殊的星号语法将整个命名空间设置为

```css
@import "tailwindcss";
@theme {
  --color-*: initial;
  --color-white: #fff;
  --color-purple: #3f3cbb;
  --color-midnight: #121063;
  --color-tahiti: #3ab7bf;
  --color-bermuda: #78dcca;
}
```



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

##### [引用其他变量](https://tailwindcss.com/docs/theme#referencing-other-variables)

定义引用其他变量的主题变量时，使用以下`inline`选项：

```css
@import "tailwindcss";
@theme inline {
  --font-sans: var(--font-inter);
}
```

::: tip

`@theme inline` 的作用

可以通过变量来定义主题，同时可以在局部覆盖变量来局部修改主题

`index.css`

```css
@theme inline {
	  --color-primary: var(--primary);
}
```

`app.css`

```css
.container {
  --primary: #0F57B3;
}
```

::: 

### [屏幕适配](https://github.com/worldzhao/blog/issues/20)

## unocss

### [动机以及原理](https://antfu.me/posts/reimagine-atomic-css-zh)

- Windi CSS 和 Tailwind JIT 都依赖于对文件系统的预扫描，并使用文件系统监听器来实现 HMR。文件 I/O 不可避免地会引入开销，而你的构建工具实际上需要再次加载它们

  ::: tip

  从内部实现上看，Tailwind 依赖于 PostCSS 的 AST 进行修改，而 Windi 则是编写了一个自定义解析器和 AST

  :::

- UnoCSS 在 Vite 中，`transform` 的钩子将与所有的文件及其内容一起被迭代,UnoCSS 通过非常高效的字符串拼接来直接生成对应的 CSS 而非引入整个编译过程。同时，UnoCSS 对类名和生成的 CSS 字符串进行了缓存，当再次遇到相同的实用工具类时，它可以绕过整个匹配和生成的过程。这意味着只有构建在你应用程序中的模块才会影响生成的 CSS，而并非你文件夹下的任何文件。

  ::: details

  跳过解析，不使用 AST，通过transform钩子

  ```js
  export default {
    plugins: [
      {
        name: 'unocss',
        transform(code, id) {
          // 过滤掉无需扫描的文件
          if (!filter(id))
            return
  
          // 扫描代码（同时也可以处理开发中的无效内容）
          scan(code, id)
  
          // 我们只需要内容，所以不需要对代码进行转换
          return null
        },
        resolveId(id) {
          return id === VIRTUAL_CSS_ID ? id : null
        },
        async load(id) {
          // 生成的 css 会作为一个虚拟模块供后续使用
          if (id === VIRTUAL_CSS_ID)
            return { code: await generate() }
        }
      }
    ]
  }
  
  ```

  :::

  

## 项目开发

### `Tailwindcss+vite`遇到问题（放弃）

1. 采用vite 配置 `@tailwindcss/vite` vite打包不支持mts格式文件
2. 采用postcss 配置，项目出现问题，路由跳转会重复刷新跳不过去

### 采用unocss

配置无卡点，丝滑，同时兼容tailwindcss，还可以设置预设类名

#### unocss+element-plus在实际项目中遇到的问题

在项目中在配置unocss时为了能使用tailwandcss语法，引入了`@unocss/preset-wind4`插件。然后该插件默认会全局重置样式与 tailwind4 对齐，并在内部集成，然后重置的样式会和element-plus组件库样式产生冲突

```css
*, ::after, ::before, ::backdrop, ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
}
```

其中` box-sizing: border-box;`和`  border: 0 solid;都会对组件样式造成影响`  

所以我们需要主动去关闭它

```typescript
import presetWind4 from '@unocss/preset-wind4'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: { 
        reset: true, 
      } 
    }),
  ],
})
```

#### 在项目中把样式rem转为px

```typescript
import { createRemToPxProcessor } from '@unocss/preset-wind4/utils'
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: { 
        theme: { 
          process: createRemToPxProcessor(), 
        } 
      }, 
    }),
  ],
  postprocess: [createRemToPxProcessor()], 
})
```

在 Vite 配置中，`postprocess` 和 `preflights: { theme: { process } }` 虽然都涉及 `createRemToPxProcessor()` 的调用，但它们的 **作用阶段** 和 **应用范围** 存在本质区别。

功能定位差异

|           配置项           |    执行阶段    |          核心作用域          |            典型应用场景            |
| :------------------------: | :------------: | :--------------------------: | :--------------------------------: |
|       `postprocess`        | **构建后处理** |   全局资源（CSS/JS/HTML）    |    最终输出文件的单位转换与优化    |
| `preflights.theme.process` | **主题预处理** | 主题配置（CSS变量/设计系统） | 主题级样式的单位标准化与兼容性处理 |

####  **转换逻辑**

- **`postprocess`**
  直接操作构建后的代码，例如：

  ```css
  /* 原始代码 */
  .container { padding: 1rem; }
  
  /* postprocess 转换后 */
  .container { padding: 16px; }
  ```

  - 适用于 **多环境适配**（如不同设备像素比）

- **`preflights.theme.process`**
  修改主题变量定义，例如：

  ```css
  /* 原始主题变量 */
  :root { --base-font-size: 16px; }
  
  /* 转换后 */
  :root { --base-font-size: 1rem; }
  ```

  - 确保 **原子化类**（如 `p-4` → `padding: 1rem`）基于正确单位生成

#### pipeline 和 filesystem 作用

::: tip

在项目中如果要扫描node_modules 依赖包文件来生成unocss样式的话，需要pipeline和filesystem搭配一起配置，因为vite的开发环境和生成环境不同，开发环境使用的是vite预构建生成的`.vite`文件夹下的模块，而生产环境也是根据包管理器的不同而不同，比如pnpm的话是`.pnpm`文件夹下模块，所以需要先通过filesystem指定打包的依赖的文件，然后通过pipeline配置的规则来过滤文件

:::

- pipeline：在rollup打包时的tranforms钩子中对id进行过滤，处理符合条件的文件

- filesystem：可以指定扫描的文件，内部使用glob来扫描指定文件夹，然后通过pipeline配置的规则来过滤文件

| 场景                     | pipeline                                                     | filesystem |
| :----------------------- | :----------------------------------------------------------- | :--------- |
| 扫描 Vite 处理过的源码   | ✅                                                            | ✅          |
| 扫描 node_modules 依赖包 | ✅（被 Vite 处理过的，开发环境在`.vite`文件夹下，生产文件可能会根据包管理器的不同而不同） | ✅          |
| 扫描动态生成 class       | ✅                                                            | ❌          |
| 扫描纯文本/非构建文件    | ❌                                                            | ✅          |

```typescript
import { defineConfig } from 'unocss'
import presetWind4 from '@unocss/preset-wind4'

export default defineConfig({
  content: {
    pipeline: { include: [/\.(vue|svelte|[jt]sx|vine.ts|mdx?|astro|elm|php|phtml|html)($|\?)/, "node_modules/*依赖包名*/dist/**/*.{js,ts}"] },
    filesystem: [
      "./src/**/*.{vue,js,ts,jsx,tsx}",
      "./index.html",
      "node_modules/*依赖包名*/dist/**/*.{vue,js,ts,jsx,tsx,cjs,cts}"
    ]
  },
  presets: [
    presetWind4({
      preflights: {
        reset: false,
      },
    }),
  ],
})

```



#### 限制

由于 UnoCSS**在构建时**生效，这意味着只有静态呈现的实用程序才会生成并发送到您的应用。动态使用或运行时从外部资源获取的实用程序可能**无法**被检测或应用。

解决动态构造实用程序限制的另一种方法是使用一个**静态**列出所有组合的对象。例如，如果你想要这样：

```vue
<div class="text-${color} border-${color}"></div>
<!-- this won't work! -->
```

您可以创建一个列出所有组合的对象（假设您知道`color`想要使用的任何可能值）

```typescript
// Since they are static, UnoCSS will able to extract them on build time
const classes = {
  red: 'text-red border-red',
  green: 'text-green border-green',
  blue: 'text-blue border-blue',
}
```

然后在你的模板中使用它：

```vue
<div class="${classes[color]}"></div>
```

