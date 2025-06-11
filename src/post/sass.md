## 简介

Sass 拥有CSS中尚不存在的功能，例如嵌套、混合、继承以及其他一些巧妙的功能，可以帮助您编写健壮、易于维护的CSS。

## 基本功能

### Partials 部分

以下划线开头的文件，下划线表示该文件只是部分文件，不应生成 CSS 文件。Sass 的局部文件与 `@use` 一起使用 规则。

### Modules 模块

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