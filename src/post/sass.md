## 简介

Sass 拥有CSS中尚不存在的功能，例如嵌套、混合、继承以及其他一些巧妙的功能，可以帮助您编写健壮、易于维护的CSS。

## 基本功能

### Partials 部分

以下划线开头的文件，下划线表示该文件只是部分文件，不应生成 CSS 文件。Sass 的局部文件与 `@use` 一起使用 规则。

### Modules 模块

[相关文章](https://css-tricks.com/introducing-sass-modules/)

你不必把所有的 Sass 文件都写在一个文件中。你可以用 `@use` 规则随意拆分。这条规则会加载另一个 Sass 文件作为 *module* ，这意味着你可以引用它的变量、 [mixins](https://sass-lang.com/guide/#mixins) 和 在你的 Sass 文件中使用基于文件名的命名空间来[创建函数 ](https://sass-lang.com/documentation/at-rules/function)。使用文件还会将它生成的 CSS 包含在你的编译输出中

```scss
// _base.scss
$font-stack: Helvetica, sans-serif;
$primary-color: #333;

body {
  font: 100% $font-stack;
  color: $primary-color;
}
```

```scss
// styles.scss
@use 'base' as *;

.inverse {
  background-color: $primary-color;
  color: white;
}
```

### Mixins

CSS 中有些东西写起来有点繁琐，尤其是在 CSS3 和众多供应商前缀的情况下。mixin 可以让你创建一组想要在整个网站中重复使用的 CSS 声明,创建 mixin 后，您可以将其用作 CSS 声明，以 `@include` 开头，后跟 themixin 的名称。

```scss
@mixin theme($theme: DarkGray) {
  background: $theme;
  box-shadow: 0 0 1px rgba($theme, .25);
  color: #fff;
}

.info {
  @include theme;
}
.alert {
  @include theme($theme: DarkRed);
}
.success {
  @include theme($theme: DarkGreen);
}

```

### Interpolation 插值

你可以使用[插值](https://sass-lang.com/documentation/interpolation)将变量和函数调用等[表达式](https://sass-lang.com/documentation/syntax/structure#expressions)的值注入到选择器中。这在编写 [mixins](https://sass-lang.com/documentation/at-rules/mixin) 时尤其有用，因为它允许你根据用户传入的参数创建选择器。

```
@mixin define-emoji($name, $glyph) {
  span.emoji-#{$name} {
    font-family: IconFont;
    font-variant: normal;
    font-weight: normal;
    content: $glyph;
  }
}

@include define-emoji("women-holding-hands", "👭");
```

### @at-root

作用：**跳出嵌套结构**，实现 BEM 命名规范
结合 `#{&}` 生成扁平化的 BEM 类名（如 `.block__element--modifier`），避免嵌套污染。

```scss
.header {
  @at-root #{&}__button {
    background: red;
    @at-root #{&}--primary { color: white; } /* 生成 .header__button--primary */
  }
}
```

编译后

```css
.header__button { background: red; }
.header__button--primary { color: white; }
```

### @forward

转发导入的模块，成员不可直接访问，仅暴露给下游

### Operators 运算符

Sass 有一些标准的数学运算符，例如 `+` 、 `-` 、 `*` 、 `math.div()` 和 `%`



## element plus主题设计

### 定义变量

::: tip

该文件下包括全局通用变量和组件变量

:::

```scss
// types
$types: primary, success, warning, danger, error, info;

// Color
$colors: () !default;
$colors: map.deep-merge(
  (
    'white': #ffffff,
    'black': #000000,
    'primary': (
      'base': #409eff,
    ),
    'success': (
      'base': #67c23a,
    ),
    'warning': (
      'base': #e6a23c,
    ),
    'danger': (
      'base': #f56c6c,
    ),
    'error': (
      'base': #f56c6c,
    ),
    'info': (
      'base': #909399,
    ),
  ),
  $colors
);

$color-white: map.get($colors, 'white') !default;
$color-black: map.get($colors, 'black') !default;
$color-primary: map.get($colors, 'primary', 'base') !default;
$color-success: map.get($colors, 'success', 'base') !default;
$color-warning: map.get($colors, 'warning', 'base') !default;
$color-danger: map.get($colors, 'danger', 'base') !default;
$color-error: map.get($colors, 'error', 'base') !default;
$color-info: map.get($colors, 'info', 'base') !default;

$input: () !default;
$input: map.merge(
  (
    'text-color': getCssVar('text-color-regular'),
    'border': getCssVar('border'),
    'hover-border': getCssVar('border-color-hover'),
    'focus-border': getCssVar('color-primary'),
    'transparent-border': 0 0 0 1px transparent inset,
    'border-color': getCssVar('border-color'),
    'border-radius': getCssVar('border-radius-base'),
    'bg-color': getCssVar('fill-color', 'blank'),
    'icon-color': getCssVar('text-color-placeholder'),
    'placeholder-color': getCssVar('text-color-placeholder'),
    'hover-border-color': getCssVar('border-color-hover'),
    'clear-hover-color': getCssVar('text-color-secondary'),
    'focus-border-color': getCssVar('color-primary'),
    'width': 100%,
  ),
  $input
);
```

###  CSS 变量转换机制

系统使用专门的 mixins 将 SCSS 变量转换为 CSS 自定义属性（CSS Variables）。这些 mixins 提供了 `set-css-var-value` 和 `set-component-css-var` 等功能来生成符合命名规范的 CSS 变量。 

```scss
@mixin set-css-var-value($name, $value) {
  #{joinVarName($name)}: #{$value};
}

// @include set-css-var-type('color', 'primary', $map);
// --el-color-primary: #{map.get($map, 'primary')};
@mixin set-css-var-type($name, $type, $variables) {
  #{getCssVarName($name, $type)}: #{map.get($variables, $type)};
}

@mixin set-component-css-var($name, $variables) {
  @each $attribute, $value in $variables {
    @if $attribute == 'default' {
      #{getCssVarName($name)}: #{$value};
    } @else {
      #{getCssVarName($name, $attribute)}: #{$value};
    }
  }
}

```

#### 变量命名和访问工具

通过工具函数如 `getCssVar`、`getCssVarName` 和 `getCssVarWithDefault` 来管理 CSS 变量的命名和访问，确保整个系统中变量命名的一致性。 

```scss
@function joinVarName($list) {
  $name: '--' + config.$namespace;
  @each $item in $list {
    @if $item != '' {
      $name: $name + '-' + $item;
    }
  }
  @return $name;
}

// getCssVarName('button', 'text-color') => '--el-button-text-color'
@function getCssVarName($args...) {
  @return joinVarName($args);
}

// getCssVar('button', 'text-color') => var(--el-button-text-color)
@function getCssVar($args...) {
  @return var(#{joinVarName($args)});
}

// getCssVarWithDefault(('button', 'text-color'), red) => var(--el-button-text-color, red)
@function getCssVarWithDefault($args, $default) {
  @return var(#{joinVarName($args)}, #{$default});
}
```

### 根级变量注册

生成的 CSS 变量会在根级样式文件中注册，创建全局可访问的主题变量系统。

```scss
:root {
  @include set-css-var-value('color-white', $color-white);
  @include set-css-var-value('color-black', $color-black);
  
  @include set-component-css-var('font-size', $font-size);
  @include set-component-css-var('font-family', $font-family);
  // 省略***
 }
```

### 组件级变量应用

每个组件通过 `@include set-component-css-var` 设置组件特定的 CSS 变量，将全局主题变量与组件样式关联起来。组件样式文件中大量使用了这种模式。

```scss
@include b(input) {
  // 定义组件变量 --el-input-循环$input key
  @include set-component-css-var('input', $input);
}

@include b(input) {
  @include css-var-from-global('input-height', 'component-size');

  position: relative;
  font-size: getCssVar('font-size', 'base');
  display: inline-flex;
  width: getCssVar('input-width');
  line-height: getCssVar('input-height');
  box-sizing: border-box;
  vertical-align: middle;
  // 省略***
}
```

实现渲染为

```css
.el-input {
    --el-input-text-color: var(--el-text-color-regular);
    --el-input-border: var(--el-border);
    --el-input-hover-border: var(--el-border-color-hover);
    --el-input-focus-border: var(--el-color-primary);
    --el-input-transparent-border: 0 0 0 1px transparent inset;
    --el-input-border-color: var(--el-border-color);
    --el-input-border-radius: var(--el-border-radius-base);
    --el-input-bg-color: var(--el-fill-color-blank);
    --el-input-icon-color: var(--el-text-color-placeholder);
    --el-input-placeholder-color: var(--el-text-color-placeholder);
    --el-input-hover-border-color: var(--el-border-color-hover);
    --el-input-clear-hover-color: var(--el-text-color-secondary);
    --el-input-focus-border-color: var(--el-color-primary);
    --el-input-width: 100%;
}

.el-input {
    --el-input-height: var(--el-component-size);
    position: relative;
    font-size: var(--el-font-size-base);
    display: inline-flex;
    width: var(--el-input-width);
    line-height: var(--el-input-height);
    box-sizing: border-box;
    vertical-align: middle;
}
```

### 如何更改element plus 组件样式

#### 方案一 覆盖根文件变量(全局修改)

```scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': green,
    ),
  )
);
```

#### 方案二 通过 CSS 变量设置(局部修改)

::: tip

 SCSS 文件编译编译后还是输出的是var css变量，所以我们可以直接定义var css变量，这意味着你可以动态地改变组件内的个别变量，以便更好地自定义组件样式

:::

在类名下添加自定义 css 变量

```css
.custom-class {
  --el-tag-bg-color: red;
}
```

##### css变量的作用域

变量的作用域就是它所在的选择器的有效范围。全局的变量通常放在根元素`:root`里面，确保任何选择器都可以读取它们。

#### 方案三 样式穿透
