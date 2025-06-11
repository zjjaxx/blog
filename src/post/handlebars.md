<!-- 
## 简介

- 轻量的语义化模板

- Handlebars 会将模板编译为 JavaScript 函数。这使得 Handlebars 的执行速度比其他大多数模板引擎都要快。

使用

```js
 var template = Handlebars.compile("Handlebars <b>{{doesWhat}}</b>");
  // execute the compiled template and print the output to the console
  console.log(template({ doesWhat: "rocks!" }));
```



## 表达式

### 基本用法

```handlebars
{{firstname}} {{loud lastname}} {{#each peoples}} {{name}}  {{/each}}
```

```js
Handlebars.registerHelper('loud', function (aString) {
  return aString.toUpperCase()
})

```

输入

```js
{ firstname: "张", lastname: "三" }
```

输出

```html
张 三 
```

***如果peoples没有传，不会报错undefined,使用友好***

### 更改上下文

一些诸如 `#with` and <span v-pre>#each</span> 的助手代码使你能够操作嵌套的对象。当你在路径中包含 `../` 时，Handlebars 将转回父级上下文。


```handlebars
{{permalink}}
{{#each comments}}
  {{../permalink}}

  {{#if title}}
    {{../permalink}}
  {{/if}}
{{/each}}
```


*** 注意`../` 解析的确切值根据调用该代码块的助手代码不同而有所不同。仅在上下文更改必要时使用 `../`。诸如 <span v-pre>{{#each}}</span> 之类的子助手代码将需要使用 <span v-pre>`../` </span> ，而诸如 <span v-pre>`{{#if}}` </span> 之类的助手代码则不需要。***

### HTML 转义

在 Handlebars 中，由 `{{expression}}` 返回的值是 HTML 转义的。也就是说，如果一个表达式包含 `&`，那么返回的 HTML 转义的内容将会包含 `&`。如果你不希望 Handlebars 转义字符的话，请使用 `{{{`。

### 助手代码

助手代码可以实现一些并非 Handlesbars 语言本身的功能。

在运行时可以用 `HandleBars.registerHelper` 可以注册助手代码。例如为了将字符串中的所有字符转换为大写。

```js
Handlebars.registerHelper('loud', function (aString) {
    return aString.toUpperCase()
})
```

### 避免助手代码的返回值被 HTML 转义

即使当使用 `{{` 而非 `{{{` 来调用助手代码时，当你的助手代码返回一个 `Handlebars.Safestring` 的实例，返回值也并不会被转义。你需要留心将所有参数正确地使用 `Handlebars.escapeExpression` 来转义。

```js
Handlebars.registerHelper("bold", function(text) {
  var result = "<b>" + Handlebars.escapeExpression(text) + "</b>";
  return new Handlebars.SafeString(result);
});
```

- `Handlebars.Safestring` 返回不转义的字符
-  `Handlebars.escapeExpression` 将传入参数进行转义

### 具有多个参数的助手代码

```handlebars
{{link "See Website" url}}
```

Handlebars 将把两个参数传递给 `link` 助手代码：字符串 `See Website` 与从下面提供的 `people` 输入对象中的 `people.value`。

```js
{ url: "https://yehudakatz.com/" }
```

```js
Handlebars.registerHelper("link", function(text, url) {
      var url = Handlebars.escapeExpression(url),
          text = Handlebars.escapeExpression(text)
          
     return new Handlebars.SafeString("<a href='" + url + "'>" + text +"</a>");
});
```

输出

```html
<a href='https://yehudakatz.com/'>See Website</a>
```

### 含有 Hash 参数的助手代码

Handlebars 提供了额外的元数据，让其更加语义化，易于理解

```handlebars
{{link "See Website" href=person.url class="person"}}
```

```js
Handlebars.registerHelper("link", function(text, options) {
    var attributes = [];

    Object.keys(options.hash).forEach(key => {
        var escapedKey = Handlebars.escapeExpression(key);
        var escapedValue = Handlebars.escapeExpression(options.hash[key]);
        attributes.push(escapedKey + '="' + escapedValue + '"');
    })
    var escapedText = Handlebars.escapeExpression(text);
    
    var escapedOutput ="<a " + attributes.join(" ") + ">" + escapedText + "</a>";
    return new Handlebars.SafeString(escapedOutput);
});
```

上述助手代码产生的输出如下：

```html
<a class="person" href="https://yehudakatz.com/">See Website</a>
```

### 助手代码和属性查找时的消歧义

如果助手代码注册时的名称和一个输入的属性名重复，则助手代码的优先级更高。如果你想使用输入的属性，请在其名称前加 `./` 或 `this.`。

```handlebars
helper: {{name}}
data: {{./name}} or {{this.name}}
```

```js
Handlebars.registerHelper('name', function () {
    return "Nils"
})
```

### 子级表达式

Handlebars 对子级表达式提供了支持，这使你可以在单个 Mustache 模板中调用多个助手代码，并且将内部助手代码调用的返回值作为外部助手代码的参数传递。子级表达式使用括号定界。

```handlebars
{{outer-helper (inner-helper "abc") "def"}}
```

上例中，`inner-helper` 会被调用并带有字符串参数 `'abc'`，同时不论 `inner-helper` 返回了什么，返回值都将被作为第一个参数传递给 `outer-helper`（同时 `'def'` 会作为第二个参数传递）。

### 空格控制

通过在括号中添加一个 `~` 字符，你可以从任何 Mustache 模板代码块的任何一侧省略模板中的空格。应用之后，该侧的所有空格将被删除，直到第一个位于同一侧的 Handlebars 表达式或非空格字符出现。

```handlebars
{{#each nav~}}
  <a href="{{url}}">
    {{~#if test}}
      {{~title}}
    {{~else~}}
      Empty
    {{~/if~}}
  </a>
{{~/each}}
```

输出没有换行符并格式化了空格的结果：

```html
<a href="foo">bar</a><a href="bar">Empty</a>
```

## 代码片段

Handlebars 允许代码片段的***复用***。代码片段是一段普通的 Handlebars 模板，但它们可以直接由其他模板调用。

### 基本代码片段

一个代码片段必须通过 `Handlebars.registerPartial` 注册。

```js
Handlebars.registerPartial('myPartial', '{{prefix}}');
```

这个方法将注册代码片段 `myPartial`。可以对代码片段进行预编译，并将预编译的模板传到第二个参数。

调用代码片段是通过「代码片段调用语法」完成的

```handlebars
{{> myPartial }}
```

### 动态代码片段

使用子表达式语法可以动态选择要执行的部分。

```handlebars
{{> (whichPartial) }}
```

这将计算 `whichPartial`，然后渲染以函数的返回值作为名称的代码片段。

子表达式不会解析变量，因此 `whichPartial` 必须是一个函数。如果代码片段的名称是储存在一个变量里面的，则可以通过 `lookup` 助手代码来解决它。

```js
{{> (lookup . 'myVariable') }}
```

### 代码片段上下文

```handlebars
{{> myPartial myOtherContext }}
```

### 代码片段参数

可以通过 Hash 参数将自定义数据传递到代码片段。

```handlebars
{{> myPartial parameter=favoriteNumber }}
```

代码片段运行时会将参数设置为 `value`。

这对于把数据从父级传递到代码片段的上下文中的时候特别有用：

```handlebars
{{#each people}}
  {{> myPartial prefix=../prefix firstname=firstname lastname=lastname}}.
{{/each}}
```

## 内置助手代码原理

### 基本代码块的变化

为了更好地说明语法，让我们定义另一个块助手代码，为包装的文本添加一些标记。

```handlebars
<div class="entry">
  <h1>{{title}}</h1>
  <div class="body">
    {{#bold}}{{body}}{{/bold}}
  </div>
</div>
```

粗体助手代码将添加标记以使其文本变为粗体。和以前一样，该函数将上下文作为输入并返回一个字符串。

```js
Handlebars.registerHelper("bold", function (options) {
  return new Handlebars.SafeString('<div class="mybold">' + options.fn(this) + "</div>");
});
```

### `with` 助手代码

`with` 助手代码演示了如何将参数传递给你的助手代码。当将参数传递给助手代码时，模板传入的任何上下文中都会接收该参数。

```handlebars
<div class="entry">
  <h1>{{title}}</h1>
  {{#with story}}
    <div class="intro">{{{intro}}}</div>
    <div class="body">{{{body}}}</div>
  {{/with}}
</div>
```

实现这样的助手代码并不像实现 `noop` 一样。助手代码可以获取参数，并且参数的计算就像直接在 `{{mustache}}` 代码块中直接使用的表达式一样。

```js
Handlebars.registerHelper("with", function (context, options) {
  return options.fn(context);
});
```

参数按照其传递的顺序传递给助手代码，最后是 options。

### 简单迭代

块助手代码的一个常见用法是使用它们来定义自定义迭代器。实际上，所有 Handlebars 内置助手代码都被定义为是常规的 Handlebars 帮助器。让我们看一下内置的 `each` 助手代码的工作方式。

```handlebars
<div class="entry">
  <h1>{{title}}</h1>
  {{#with story}}
    <div class="intro">{{{intro}}}</div>
    <div class="body">{{{body}}}</div>
  {{/with}}
</div>
<div class="comments">
  {{#each comments}}
    <div class="comment">
      <h2>{{subject}}</h2>
      {{{body}}}
    </div>
  {{/each}}
</div>
```

这种情况下，我们要为 comments 数组中的每个元素调用一次 `each` 的代码块。

```js
Handlebars.registerHelper("each", function (context, options) {
  var ret = "";

  for (var i = 0, j = context.length; i < j; i++) {
    ret = ret + options.fn(context[i]);
  }

  return ret;
});
```

这种情况下，我们遍历传递的参数中的项目，对每个项目调用一次该代码块。遍历完毕之后，我们建立一个 String 结果，然后返回它。

#### 在块内

你可以使用 `this` 来引用被迭代的元素。

当遍历 `each` 中的项目时，你可以选择通过 `{{@index}}` 引用当前循环的索引。

```handlebars
{{#each array}} {{@index}}: {{this}} {{/each}}
```

此外，对于对象迭代，可以使用 `{{@key}}` 引用当前的键名：

```handlebars
{{#each object}} {{@key}}: {{this}} {{/each}}
```

在数组上进行迭代时，通过 [`@first`](https://handlebarsjs.com/zh/api-reference/data-variables.html#first) 和 [`@last`](https://handlebarsjs.com/zh/api-reference/data-variables.html#last) 变量记录迭代的第一项和最后一项。

```handlebars
{{#each array}} {{#if @last}} Last :( {{/if}} {{/each}}
```

嵌套的每个块都可以通过基于深度的路径来访问迭代变量。例如，要访问父级的索引，可以使用 `{{@../index}}`。



### lookup

`lookup` 助手代码允许使用 Handlebars 变量进行动态的参数解析。

这对于解析数组索引的值非常有用。

```handlebars
{{#each peoples}}
   {{./name}} lives in {{lookup ../cities @index}}
{{/each}}
```

```js
{ prefix:'hah',cities:["hah","bb"],peoples:[{userId:1,name:"zjj"},{userId:1,name:"zjjw"}]}

```

输出

```html
   zjj lives in hah
   zjjw lives in bb

```

### log

`log` 助手代码允许在执行模板时记录上下文的状态。有助于调试

```handlebars
{{log 'this is a simple log output'}}
```

它将委托给 `Handlebars.logger.log` ，而 `Handlebars.logger.log` 可以被覆盖以执行自定义日志记录。

可以将任何数量的参数传递给此方法，并且所有参数都将转发给 logger。

可以使用 `level` 参数设置日志级别。支持的值为 `debug`、`info`、`warn` 和 `error`（`info` 是默认值）。

记录是基于 `level` 参数和在 `Handlebars.logger.level` 中设置的值（默认为 `info`）的条件。所有比选定级别更高的记录将被输出。

```handlebars
{{log "debug logging" level="debug"}}
{{log "info logging" level="info"}}
{{log "info logging is the default"}}
{{log "logging a warning" level="warn"}}
{{log "logging an error" level="error"}}
```

### 条件

你可以使用 `if` 助手代码来根据条件渲染代码块。如果其参数返回 `false`、`undefined`、`null`、`""`、 `0` 或者 `[]`，Handlebars 将不会渲染该块。

块助手代码的另一个常见用例是计算条件表达式。与迭代器一样，Handlebars 内置有 `if` 和 `unless` 块助手代码。

```handlebars
{{#if isActive}}
  <img src="star.gif" alt="Active" />
{{/if}}
```

控制结构通常不更改当前上下文，而是基于一些变量决定是否调用该代码块。

```js
Handlebars.registerHelper("if", function (conditional, options) {
  if (conditional) {
    return options.fn(this);
  }
});
```

编写条件代码块时，你通常会希望模板可以提供“如果条件的计算结果为 false” 时助手代码应插入的 HTML 代码。Handlebars 通过提供 `else` 来解决这个问题。

```handlebars
{{#if isActive}}
  <img src="star.gif" alt="Active" />
{{else}}
  <img src="cry.gif" alt="Inactive" />
{{/if}}
```

Handlebars 使用 `options.inverse` 为 `else` 片段提供了代码块。你不需要检查是否存在 `else` 片段：Handlebars 将自动检测并注册一个 `noop` 函数。

```js
Handlebars.registerHelper("if", function (conditional, options) {
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});
```

#### 子表达式

建议使用助手代码向模板添加逻辑。你可以编写助手代码并将其应用到子表达式中。

你可以写一段助手代码来检查 "undefined"，如：

```js
Handlebars.registerHelper('isdefined', function (value) {
  return value !== undefined;
});
```

然后将助手代码用作子表达式：

```handlebars
{{#if (isdefined value1)}}true{{else}}false{{/if}}
{{#if (isdefined value2)}}true{{else}}false{{/if}}
```

### 代码块参数

这是 Handlebars 3.0 中的新增功能，可以从支持的助手代码中接收命名参数。

```handlebars
{{#each users as |user userId|}}
  Id:
  {{userId}}
  Name:
  {{user.name}}
{{/each}}
```

***注意 userId其实是索引 index***

## 
 -->
