## 思考
### 为什么React 并不知道 Child 的渲染结果是否依赖于外部变量或其他副作用，不是有老的fiber树吗

这是一个非常敏锐的问题！你触及到了 React 设计哲学和 JavaScript 语言特性之间的一个核心矛盾。

你的直觉是：*“Fiber 树里已经存了旧的 Props 和 State，React 既然能对比出 Props 没变，为什么不默认直接跳过渲染？”*

答案在于：Fiber 树只存储了“数据快照”（State/Props），但它无法存储组件函数的“执行逻辑”。

而在 JavaScript 中，函数组件（Function Component）本质上是一个黑盒。React 无法保证一个函数在 Props 不变的情况下，返回的结果一定不变（即它无法保证组件是“纯函数”）。

以下是 React 不敢 默认跳过子组件渲染的三个主要原因：

#### “隐形”的外部依赖（闭包与全局变量）

React 的 Fiber 树只能追踪通过 Props 和 State 传递的数据。如果你的组件依赖了 React 系统之外的数据，React 是完全不知情的。

举个例子：

```javascript
let globalTheme = "dark"; // 这是一个 React 无法追踪的全局变量

function Child() {
  // 这里的渲染结果依赖了 globalTheme
  // 但 globalTheme 既不是 props 也不是 state
  return <div className={globalTheme}>我是子组件</div>;
}

function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <div onClick={() => {
      globalTheme = "light"; // 修改全局变量
      setCount(c => c + 1);  // 触发 React 更新
    }}>
      <Child />
    </div>
  );
}
```

场景分析：

- 用户点击，globalTheme 变了，Parent 更新。

- Parent 渲染，生成 <Child />。

- React 对比 Child 的 Props，发现是空的（没变）。

- 如果 React 默认跳过渲染：Child 就不会重新执行，它的 className 依然是 "dark"。

- 结果：UI 错误（本该变成 "light"）。

为了防止这种 Bug，React 采取了“悲观策略”：只要父组件动了，子组件环境可能变了，必须重新执行函数以确保 UI 正确，除非你明确告诉它“我是纯的”（通过 React.memo）。

#### 可变对象（Mutable Objects）的引用陷阱

JavaScript 的对象是引用传递的。即便 Props 的引用没有变，内容可能变了。

```javascript
const user = { name: "Zheng" };

function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 直接修改对象内容，但引用地址没变！
    user.name = "Li"; 
    setCount(c => c + 1);
  };

  // user 对象作为 prop 传下去
  return <Child user={user} />;
}
```

场景分析：

- user 对象的内存地址始终没变。

- 如果是 React.memo（默认浅比较），它对比 oldProps.user === newProps.user，结果是 true（相等）。

- 如果 React 默认开启 memo，这种直接修改对象属性（Mutation） 的写法就会导致试图不更新。

虽然 React 提倡不可变数据（Immutable），但它不能强制所有用户都遵守。默认重新渲染可以掩盖掉用户错误修改数据带来的 Bug。

#### 性能权衡：比较也是有成本的

你可能会问：“那为什么不默认都做 props 的浅比较（像 memo 那样）？”

因为“比较”本身也是消耗性能的。

- 如果不比较（默认行为）：React 闭眼执行子组件函数。如果子组件很简单（只是渲染几个 div），执行非常快。

- 如果比较（memo 行为）：React 需要遍历 Props 对象的每一个属性，和旧 Props 做对比。

- 如果 Props 很复杂（大对象、长列表），对比可能比直接渲染还慢。

- 如果对比了半天发现 Props 确实变了（这是大概率事件），那之前的对比操作就是白白浪费时间，最后还得渲染。

#### 结论：

对于大多数简单的组件，“盲目重绘”往往比“精细比对”更划算。只有当组件非常重（渲染开销大）时，引入 memo 的比对成本才是值得
