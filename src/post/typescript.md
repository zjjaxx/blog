## 概述 

TypeScript 是JavaScript的超集，主要功能是为 JavaScript 添加类型系统

##  静态类型的优缺点

### 优点

（1）有利于代码的静态分析。

有了静态类型，不必运行代码，就可以确定变量的类型，从而推断代码有没有错误。这就叫做代码的静态分析。

这对于大型项目非常重要，单单在开发阶段运行静态检查，就可以发现很多问题，避免交付有问题的代码，大大降低了线上风险。

（2）有利于发现错误。

（3）更好的 IDE 支持，做到语法提示和自动补全。

（4）提供了代码文档。类型信息可以部分替代代码文档

（5）有助于代码重构。

### 缺点

（1）丧失了动态类型的代码灵活性。

（2）增加了编程工作量。

（3）更高的学习成本。

（4）引入了独立的编译步骤。。

（5）兼容性问题。

### 总结

总的来说，这些缺点使得 TypeScript 不一定适合那些小型的、短期的个人项目。

## 如何编译

1. 安装``typescript`
2. 初始化` npx tsc --init`
3. 运行编译 `tsc`

## `tsconfig.json`配置说明

### module

#### 作用

1. **控制模块语法转换**

   `module` 选项决定编译器如何转换这些语法

   - 若设为 `ESNext`，保留原生 `import`/`export`（现代浏览器或打包工具适用）

   - 若设为 `CommonJS`，转换为 `require()` 和 `module.exports`（Node.js 环境适用）

2. **影响模块解析策略**

   `module` 的值会联动 `moduleResolution` 的默认行为：

   - `module: "CommonJS"` → 默认 `moduleResolution: "node"`（Node.js 风格解析）

   - `module: "ES2015"` → 默认 `moduleResolution: "classic"`（传统 TypeScript 解析）

#### **如何选择 `module` 值？**

|     **环境/工具**     |   **推荐值**   |                         **说明**                          |
| :-------------------: | :------------: | :-------------------------------------------------------: |
|        Node.js        |   `CommonJS`   |        Node.js 原生支持 `require`/`module.exports`        |
| 浏览器 + Webpack/Vite |    `ESNext`    |                打包工具会处理 ES 模块语法                 |
|    浏览器直接运行     | `ES2015`/`ES6` | 现代浏览器支持原生 ES 模块（需 `<script type="module">`） |
|     兼容多种环境      |     `UMD`      |             同时生成 CommonJS 和 AMD 支持代码             |

## 类型分类

- 内置类型（DOM、Promise、像数组的原始方法）
- 基础类型
- 高级类型 Pick Partial等
- 自定义类型

## 类型推断

类型声明并不是必需的，如果没有，TypeScript 会自己推断类型。

## any 类型，unknown 类型，never 类型

### any类型

::: tip

TypeScript 不对any 类型进行类型检查。由于这个原因，应该尽量避免使用`any`类型，否则就失去了使用 TypeScript 的意义。

:::

#### 类型推断问题

对于开发者没有指定类型、TypeScript 必须自己推断类型的那些变量，如果无法推断出类型，TypeScript 就会认为该变量的类型是`any`。由于这个原因，建议使用`let`和`var`声明变量时，如果不赋值，就一定要显式声明类型，否则可能存在安全隐患。

#### 污染问题

`any`类型除了关闭类型检查，还有一个很大的问题，就是它会“污染”其他变量。它可以赋值给其他任何类型的变量（因为没有类型检查），导致其他变量出错。

### unknown 类型

::: tip

为了解决`any`类型“污染”其他变量的问题，TypeScript 3.0 引入了[`unknown`类型](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type)

:::

#### 和any类型的区别

- 首先，`unknown`类型的变量，不能直接赋值给其他类型的变量（除了`any`类型和`unknown`类型）。这就避免了污染问题，从而克服了`any`类型的一大缺点。
- 其次，不能直接调用`unknown`类型变量的方法和属性。
- 再次，`unknown`类型变量能够进行的运算是有限的，只能进行比较运算（运算符`==`、`===`、`!=`、`!==`、`||`、`&&`、`?`）、取反运算（运算符`!`）、`typeof`运算符和`instanceof`运算符这几种，其他运算都会报错。

#### 如何使用`unknown`类型变量

答案是只有经过“类型缩小”，`unknown`类型变量才可以使用。所谓“类型缩小”，就是缩小`unknown`变量的类型范围，确保不会出错。

### never 类型 

为了保持与集合论的对应关系，以及类型运算的完整性,TypeScript 还引入了“空类型”的概念，即该类型为空，不包含任何值。

由于不存在任何属于“空类型”的值，所以该类型被称为`never`，即不可能有这样的值。

#### 保证类型运算的完整性

`never`类型的使用场景，主要是在一些类型运算之中，

#### **条件类型过滤**

在工具类型中，用 `never` 过滤联合类型中的无效项

```typescript
// 实现 NonNullable：过滤 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type T1 = MyNonNullable<string | null>; // string（null 被转为 never 并过滤）
```

## Object 类型与 object 类型

::: tip

注意，无论是大写的`Object`类型，还是小写的`object`类型，都只包含 JavaScript 内置对象原生的属性和方法，用户自定义的属性和方法都不存在于这两个类型之中。

:::

大写的`Object`类型代表 JavaScript 语言里面的广义对象。所有可以转成对象的值，都是`Object`类型，这囊括了几乎所有的值。除了`undefined`和`null`这两个值不能转为对象，其他任何值都可以赋值给`Object`类型。

小写的`object`类型代表 JavaScript 里面的狭义对象，即可以用字面量表示的对象，只包含对象、数组和函数，不包括原始类型的值。

## 函数类型

- 写法一

  ```typescript
  type MyFunc = (string, number) => number;
  ```

- 写法二 对象形式

  ::: tip

  注意，这种写法的函数参数与返回值之间，间隔符是冒号`:`，而不是正常写法的箭头`=>`，因为这里采用的是对象类型的写法，对象的属性名与属性值之间使用的是冒号。

  这种写法平时很少用，但是非常合适用在一个场合：函数本身存在属性。

  :::

  ```typescript
  let add:{
    (x:number, y:number):number
  };
   
  ```

  函数类型也可以使用 Interface 来声明，这种写法就是对象写法的翻版

  ```typescript
  interface myfn {
    (a:number, b:number): number;
  }
  ```

### 参数解构

函数参数如果存在变量解构，类型写法如下

```typescript
function f(
  [x, y]: [number, number]
) {
  // ...
}

function sum(
  { a, b, c }: {
     a: number;
     b: number;
     c: number
  }
) {
  console.log(a + b + c);
}
```

### 函数重载 

::: tip

由于重载是一种比较复杂的类型声明方法，为了降低复杂性，一般来说，如果可以的话，应该优先使用联合类型替代函数重载，除非多个参数之间、或者某个参数与返回值之间，存在对应关系。

:::

::: tip

重载声明的排序很重要，因为 TypeScript 是按照顺序进行检查的，一旦发现符合某个类型声明，就不再往下检查了，所以类型最宽的声明应该放在最后面，防止覆盖其他类型声明。

:::

有些函数可以接受***不同类型或不同个数的参数***，并且根据参数的不同，会有不同的函数行为。这种根据参数类型不同，执行不同逻辑的行为，称为函数重载（function overload）。

```typescript
function reverse(str:string):string;
function reverse(arr:any[]):any[];
```

但是，到这里还没有结束，后面还必须对函数`reverse()`给予完整的类型声明。

```typescript
function reverse(str:string):string;
function reverse(arr:any[]):any[];
function reverse(
  stringOrArray:string|any[]
):string|any[] {
  if (typeof stringOrArray === 'string')
    return stringOrArray.split('').reverse().join('');
  else
    return stringOrArray.slice().reverse();
}
```

函数重载，也可以用对象表示。

```typescript
type CreateElement = {
  (tag:'a'): HTMLAnchorElement;
  (tag:'canvas'): HTMLCanvasElement;
  (tag:'table'): HTMLTableElement;
  (tag:string): HTMLElement;
}
```

### void

表示不关心返回的具体类型，无论返回什么值都可以

## 联合类型

::: tip

“类型缩小”是 TypeScript 处理联合类型的标准方法，凡是遇到可能为多种类型的场合，都需要先缩小类型，再进行处理。实际上，联合类型本身可以看成是一种“类型放大”（type widening），处理时就需要“类型缩小”（type narrowing）。

:::

可以利用联合类型来做属性间的互斥

```typescript
export type BridgeCallConfig =
| {
      type: "openBrowse";
      data: {
        url: string;
      };
    }
 | {
      type: "navigate";
      data: {
        route: string;
        usedCar?: boolean | string;
        hiddenDomain?: string;
      };
    }
```

## 交叉类型

交叉类型常常用来为对象类型添加新属性。

## declare 关键字

::: tip

declare 关键字的重要特点是，它只是通知编译器某个类型是存在的，不用给出具体实现。比如，只描述函数的类型，不给出函数的实现，如果不使用`declare`，这是做不到的。

:::

declare 关键字用来告诉编译器，某个类型是存在的，可以在当前文件中使用。

它的主要作用，就是让当前文件可以使用其他文件声明的类型。举例来说，自己的脚本使用外部库定义的函数，编译器会因为不知道外部函数的类型定义而报错，这时就可以在自己的脚本里面使用`declare`关键字，告诉编译器外部函数的类型。这样的话，编译单个脚本就不会因为使用了外部类型而报错。

### declare module，declare namespace

::: tip

declare module 和 declare namespace 里面，加不加 export 关键字都可以。

:::

#### 作用一

如果想把变量、函数、类组织在一起，可以将 declare 与 module 或 namespace 一起使用。

下面的例子是当前脚本使用了`myLib`这个外部库，它有方法`makeGreeting()`和属性`numberOfGreetings`。

```typescript
let result = myLib.makeGreeting('你好');
console.log('欢迎词：' + result);

let count = myLib.numberOfGreetings;
```

`myLib`的类型描述就可以这样写。

```typescript
declare namespace myLib {
  function makeGreeting(s:string): string;
  let numberOfGreetings: number;
}
```

*** namespace 可以用module代替***

#### 作用二

declare 关键字的另一个用途，是为外部模块添加属性和方法时，给出新增部分的类型描述。或则某些第三方模块，原始作者没有提供接口类型，declare module 描述的模块名可以使用通配符。

```typescript
import { Foo as Bar } from 'moduleA';

declare module 'moduleA' {
  interface Foo {
    custom: {
      prop1: string;
    }
  }
}
```

### declare global

::: tip

这个要和全局申明文件隔离

:::

如果要为 JavaScript 引擎的原生对象添加属性和方法，可以使用`declare global {}`语法。

```typescript
export {};

declare global {
  interface Window {
    myAppConfig:object;
  }
}

const config = window.myAppConfig;
```

这个示例第一行的空导出语句`export {}`，作用是强制编译器将这个脚本当作模块处理。这是因为`declare global`必须用在模块里面。

## TypeScript 类型运算符

### keyof 运算符

keyof 是一个单目运算符，接受一个对象类型作为参数，返回该对象的所有键名组成的联合类型。

```typescript
type MyObj = {
  foo: number,
  bar: string,
};

type Keys = keyof MyObj; // 'foo'|'bar'
```

keyof 取出的是键名组成的联合类型，如果想取出键值组成的联合类型，可以像下面这样写。

```typescript
type MyObj = {
  foo: number,
  bar: string,
};

type Keys = keyof MyObj;

type Values = MyObj[Keys]; // number|string
```

#### 作用一

keyof 运算符往往用于精确表达对象的属性类型。

举例来说，取出对象的某个指定属性的值，JavaScript 版本可以写成下面这样。

```typescript
function prop(obj, key) {
  return obj[key];
}
```

上面这个函数添加类型，只能写成下面这样。

```typescript
function prop(
  obj: { [p:string]: any },
  key: string
):any {
  return obj[key];
}
```

上面的类型声明有两个问题，一是无法表示参数`key`与参数`obj`之间的关系，二是返回值类型只能写成`any`。

有了 keyof 以后，就可以解决这两个问题，精确表达返回值类型。

```typescript
function prop<Obj, K extends keyof Obj>(
  obj:Obj, key:K
):Obj[K] {
  return obj[key];
}
```

#### 作用二

keyof 的另一个用途是用于属性映射，即将一个类型的所有属性逐一映射成其他值。

```typescript
type NewProps<Obj> = {
  [Prop in keyof Obj]: boolean;
};

// 用法
type MyObj = { foo: number; };

// 等于 { foo: boolean; }
type NewObj = NewProps<MyObj>;
```

### in 运算符

TypeScript 语言的类型运算中，`in`运算符有不同的用法，用来取出（遍历）联合类型的每一个成员类型。

```typescript
type U = 'a'|'b'|'c';

type Foo = {
  [Prop in U]: number;
};
// 等同于
type Foo = {
  a: number,
  b: number,
  c: number
};
```

### 方括号运算符

方括号运算符（`[]`）用于取出对象的键值类型，比如`T[K]`会返回对象`T`的属性`K`的类型。

```typescript
type Person = {
  age: number;
  name: string;
  alive: boolean;
};

// Age 的类型是 number
type Age = Person['age'];
```

方括号的参数如果是联合类型，那么返回的也是联合类型。

```typescript
type Person = {
  age: number;
  name: string;
  alive: boolean;
};

// number|string
type T = Person['age'|'name'];

// number|string|boolean
type A = Person[keyof Person];
```

### extends...?: 条件运算符

TypeScript 提供类似 JavaScript 的`?:`运算符这样的三元运算符，但多出了一个`extends`关键字。

条件运算符`extends...?:`可以根据当前类型是否符合某种条件，返回不同的类型。

```typescript
T extends U ? X : Y
```

如果对泛型使用 extends 条件运算，有一个地方需要注意。当泛型的类型参数是一个联合类型时，那么条件运算符会展开这个类型参数，即`T<A|B> = T<A> | T<B>`，所以 extends 对类型参数的每个部分是分别计算的。

```typescript
type Cond<T> = T extends U ? X : Y;

type MyType = Cond<A|B>;
// 等同于 Cond<A> | Cond<B>
// 等同于 (A extends U ? X : Y) | (B extends U ? X : Y)
```

上面示例中，泛型`Cond`的类型参数`A|B`是一个联合类型，进行条件运算时，相当于`A`和`B`分别进行条件运算，返回结果组成一个联合类型。也就是说，如果类型参数是联合类型，条件运算的返回结果依然是一个联合类型。

如果不希望联合类型被条件运算符展开，可以把`extends`两侧的操作数都放在方括号里面。

```typescript
// 示例一
type ToArray<Type> =
  Type extends any ? Type[] : never;

// 返回结果 string[]|number[]
type T = ToArray<string|number>;

// 示例二
type ToArray<Type> =
  [Type] extends [any] ? Type[] : never;

// 返回结果 (string | number)[]
type T = ToArray<string|number>;
```

`infer`关键字用来定义泛型里面推断出来的类型参数，而不是外部传入的类型参数。

它通常跟条件运算符一起使用，用在`extends`关键字后面的父类型之中。

### infer 关键字

`infer`关键字用来定义泛型里面推断出来的类型参数，而不是外部传入的类型参数。

它通常跟条件运算符一起使用，用在`extends`关键字后面的父类型之中。

```typescript
type ReturnPromise<T> =
  T extends (...args: infer A) => infer R 
  ? (...args: A) => Promise<R> 
  : T;
```

如果不使用`infer`，就不得不把`ReturnPromise<T>`写成`ReturnPromise<T, A, R>`，这样就很麻烦，相当于开发者必须人肉推断编译器可以完成的工作。

下面是`infer`提取对象指定属性的例子。

```typescript
type MyType<T> =
  T extends {
    a: infer M,
    b: infer N
  } ? [M, N] : never;

// 用法示例
type T = MyType<{ a: string; b: number }>;
// [string, number]
```

下面是`infer`通过正则匹配提取类型参数的例子。

```typescript
type Str = 'foo-bar';

type Bar = Str extends `foo-${infer rest}` ? rest : never // 'bar'
```

### is 运算符

`is`运算符可以用于类型保护。

```typescript
export const isTextNode = (node:  HTMLElement | Node): node is Text => {
  return node.nodeType === Node.TEXT_NODE && node.nodeValue !== "";
};
```

### **模板字符串**

模板字符串里面引用的类型，如果是一个联合类型，那么它返回的也是一个联合类型，即模板字符串可以展开联合类型。

```typescript
type T = 'A'|'B';

// "A_id"|"B_id"
type U = `${T}_id`;
```

如果模板字符串引用两个联合类型，它会交叉展开这两个类型。

```typescript
type T = 'A'|'B';

type U = '1'|'2';

// 'A1'|'A2'|'B1'|'B2'
type V = `${T}${U}`;
```

### satisfies 运算符

`satisfies`运算符用来检测某个值是否符合指定类型。有时候，不方便将某个值指定为某种类型，但是希望这个值符合类型条件，这时候就可以用`satisfies`运算符对其进行检测。[TypeScript 4.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)添加了这个运算符。

可以使用`satisfies`运算符，对`palette`进行类型检测，但是不改变 TypeScript 对`palette`的类型推断。

```typescript
type Colors = "red" | "green" | "blue";
type RGB = [number, number, number];

const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  bleu: [0, 0, 255] // 报错
} satisfies Record<Colors, string|RGB>;

const greenComponent = palette.green.substring(1); // 不报错
```

上面示例中，变量`palette`的值后面增加了`satisfies Record<Colors, string|RGB>`，表示该值必须满足`Record<Colors, string|RGB>`这个条件，所以能够检测出属性名`bleu`的拼写错误。同时，它不会改变`palette`的类型推断，所以，TypeScript 知道`palette.green`是一个字符串，对其调用`substring()`方法就不会报错。

## 在vue3中的使用技巧

### defineProps

::: danger

在 3.2 及以下版本中，`defineProps()` 的泛型类型参数仅限于类型字面量或对本地接口的引用。

这个限制在 3.3 中得到了解决。最新版本的 Vue 支持在类型参数位置引用导入和有限的复杂类型。但是，由于类型到运行时转换仍然基于 AST，一些需要实际类型分析的复杂类型，例如条件类型，还未支持。你可以使用条件类型来指定单个 prop 的类型，但不能用于整个 props 对象的类型。

泛型和全局声明也不支持

:::

通过泛型参数来定义 props 的类型通常更直接，

```typescript
<script setup lang="ts">
const props = defineProps<{
  foo: string
  bar?: number
}>()
</script>
```

这被称之为“基于类型的声明”。编译器会尽可能地尝试根据类型参数推导出等价的运行时选项。

这同样适用于 `Props` 从另一个源文件中导入的情况。该功能要求 TypeScript 作为 Vue 的一个 peer dependency。

```typescript
<script setup lang="ts">
import type { Props } from './foo'

const props = defineProps<Props>()
</script>
```

### 声明全局组价类型

```typescript
export * from "./iconProps";
import _ZIcon from "./icon.vue";
import {withInstall} from "@/utils/withInstall";

const ZIcon=withInstall(_ZIcon);
declare module 'vue' {
    export interface GlobalComponents {
        _ZIcon: typeof _ZIcon
    }
}
export {
    ZIcon
} 
```

### vue3中的typescript 工具类

#### UnwrapRef

`UnwrapRef` 是一个 **类型工具**，主要用于处理嵌套的 `Ref` 对象，确保在类型系统中自动解包并推断出最底层的原始类型。它的核心作用是简化对嵌套响应式数据的类型操作，避免手动逐层访问 `.value` 的繁琐。

::: tip

**与 `reactive` 配合使用**

当 `reactive` 包裹的对象中包含 `Ref` 时，`UnwrapRef` 会自动解包这些 `Ref`，使其成为普通响应式属性。

```typescript
import { reactive, ref, UnwrapRef } from 'vue';

// reactive 中包含 Ref
const state: UnwrapRef<{
  count: Ref<number>;
}> = reactive({
  count: ref(0)
});

// 直接访问 count 的原始值（无需 .value）
state.count = 1; // 正确
```

:::

#### PropType

用于在用运行时 props 声明时给一个 prop 标注更复杂的类型定义。

```typescript
export const tabProps = {
    tabPosition:{
        type:String as PropType< 'top' | 'right' | 'bottom' | 'left'>,
        default:'top',
    },
    modelValue:{
        type:[ String, Number ],
        required:true,
    },
}
```

#### ExtractPropTypes

从运行时的 props 选项对象中提取 props 类型。提取到的类型是面向内部的

```
export const tabProps = {
    tabPosition:{
        type:String as PropType< 'top' | 'right' | 'bottom' | 'left'>,
        default:'top',
    },
    modelValue:{
        type:[ String, Number ],
        required:true,
    },
}
type TabsProps = ExtractPropTypes<typeof tabProps> // 提取类型
export interface TabsRootContext {
    props: TabsProps // 应用类型
    currentName: Ref<TabPaneName>
    registerPane: (pane: TabsPaneContext) => void
    unregisterPane: (pane: TabsPaneContext) => void
    // nav$: Ref<TabNavInstance | undefined>
}
```

