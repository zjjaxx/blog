## 介绍

Zustand 是一款小巧、快速且可扩展的 Bearbones 状态管理解决方案。它拥有基于 Hooks 的便捷 API，既不繁琐也不固执己见，但又具备足够的约定俗成，既清晰明了又具有 Flux 特性。

别因为它长得可爱就小瞧它，它可是有爪子的！我们花费了大量时间来解决常见的陷阱，例如令人头疼的[“僵尸小孩”问题](https://react-redux.js.org/api/hooks#stale-props-and-zombie-children)、 [React 并发问题](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md)以及混合渲染器之间的[上下文丢失问题](https://github.com/facebook/react/issues/13332) 。它可能是 React 领域中唯一一个能完美解决所有这些问题的状态管理器。

### 僵尸小孩问题

僵尸小孩”（Zombie Child）问题是 React 状态管理库（如 Redux、Zustand 等）中一个经典的数据一致性与渲染顺序问题。

简单来说，它指的是：一个子组件在被父组件卸载（移除）之前，因为 Store 数据更新而抢先进行了一次“错误的”重新渲染，导致读取不存在的数据而报错。

这个组件就像一个本该“死”去（卸载）但还在“动”（渲染）的僵尸，所以被称为“僵尸小孩”。

1. 问题发生的场景

通常发生在以下情况同时满足时：

- 父子组件依赖同一份数据的不同部分（例如：父组件依赖列表 ID 列表，子组件依赖具体的 Item 数据）。

- 子组件独立订阅了 Store（使用了 useSelector 或 connect）。

- 数据被删除（某个 Item 从 Store 中移除）。

- 通知顺序或渲染机制导致子组件比父组件先响应更新。

```tsx
const state = {
  users: {
    1: { id: 1, name: "Alice" },
    2: { id: 2, name: "Bob" }
  }
}
```

父组件 (UserList)：

父组件负责读取所有 ID 并渲染子组件。

```tsx
const UserList = () => {
  // 获取所有用户 ID：[1, 2]
  const userIds = useSelector(state => Object.keys(state.users));

  return (
    <ul>
      {userIds.map(id => <UserItem key={id} id={id} />)}
    </ul>
  );
};
```

子组件 (UserItem)：

子组件根据 ID 去 Store 里获取具体的用户信息。

```tsx
const UserItem = ({ id }) => {
  // 问题出在这里！
  // 当 id=1 的用户被删除时，state.users[1] 变成了 undefined
  const user = useSelector(state => state.users[id]);

  // 试图访问 undefined.name -> 抛出错误，应用崩溃
  return <li>{user.name}</li>;
};
```

触发“僵尸小孩”的流程：

- 用户点击“删除 Alice”按钮，触发 Action DELETE_USER(1)。

- Redux Store 更新，state.users[1] 被移除。

- Redux 订阅系统通知所有监听组件（父组件和子组件）。

- 如果子组件比父组件先运行 Selector：

- UserItem(id=1) 运行 useSelector：state.users[1] 返回 undefined。

- 组件代码执行 user.name，导致 Cannot read property 'name' of undefined。

- 应用崩溃。

1. 正常预期（如果没崩溃）：

- 父组件 UserList 重新渲染，发现 ID 列表里已经没有 1 了。

- 父组件不再渲染 UserItem(id=1)，该组件被卸载。

为什么叫“僵尸”？

因为在第 4 步时，从逻辑上讲 UserItem(id=1) 已经“死”了（不应该存在于 UI 上），但因为它还没来得及被父组件“埋葬”（卸载），它不仅“活”过来了，还咬了你的应用一口（报错）。

#### 为什么子组件比父组件先运行 Selector：

这是一个非常深刻的问题，触及了 React 和外部状态管理库（Redux/Zustand）交互的核心机制。

简单来说，根本原因在于：Redux Store 的更新通知机制是“扁平”的，而 React 的组件渲染机制是“树状”的。

当 Redux Store 发生变化时，它并不知道组件的父子层级关系，它只是单纯地遍历所有订阅者并通知它们。

以下是详细的底层原因分析：

1. 订阅列表是“扁平”的 (Flat Listeners)

在 Redux 的内部实现中，所有的订阅者（使用 useSelector 或 connect 的组件）都被保存在一个简单的数组或链表中。

- Store 的视角：[组件A, 组件B, 组件C, ...]

- React 的视角：<组件A> <组件B> <组件C /> </组件B> </组件A>

当 dispatch 发生时，Store 会遍历这个列表通知所有订阅者。Store 无法保证先通知父组件，再通知子组件。它甚至不知道谁是父谁是子。

如果遍历顺序恰好是先通知到了子组件（或者父子组件几乎同时收到通知），子组件就会立即执行 Selector 代码来计算“我是否需要重新渲染”。

2. Selector 执行发生在“渲染前” (Check before Render)

这是最关键的一点。“运行 Selector”不等于“组件重新渲染”。

为了性能优化，useSelector（以及 React-Redux 的 connect）会在 React 真正开始渲染组件 之前，先执行一次 Selector 函数。

流程如下：

- Action 触发：Store 数据更新了（Item 1 被删除了）。

- 通知订阅者：所有组件收到通知。

- 子组件响应：子组件收到通知，它的第一反应是：“数据变了吗？我需要更新 UI 吗？”

- 执行 Selector：为了回答这个问题，子组件 必须立刻运行 Selector，拿最新的 Store State 和自己当前的（旧的）Props 进行计算。

- const item = state.items[props.id]

- 此时：state 是新的（没有 Item 1），props.id 是旧的（还是 1）。

- BOOM! 报错发生。

此时，父组件可能也收到了通知，甚至父组件可能已经排队准备更新了，但 React 的渲染是异步的/批处理的，而 Selector 的执行通常是同步响应订阅事件的。在父组件来得及把子组件“卸载”之前，子组件已经急不可耐地跑了一遍 Selector。

### [React 并发问题](https://github.com/bvaughn/rfcs/blob/useMutableSource/text/0000-use-mutable-source.md)

React 的并发（Concurrency）是指 React 在同一时间段内处理多个更新任务的能力。注意，这并不意味着并行执行（Parallelism，即同一时刻在多核 CPU 上同时运行），而是指任务可以中断、暂停、恢复和交替执行。

在 React 18 之前（Legacy Mode），渲染是同步且不可中断的。一旦开始渲染，React 就会一直执行直到页面更新完成，期间浏览器无法响应用户的交互（如点击、输入），这可能导致掉帧或卡顿。

并发模式（Concurrent Mode）下，React 就像一个聪明的调度员，它知道哪些任务更紧急（如用户输入），哪些任务可以缓一缓（如数据图表渲染），从而保证界面始终流畅响应。

核心概念：撕裂（Tearing）

在并发渲染下，最著名的“并发问题”就是 撕裂 (Tearing)。

什么是撕裂？

视觉上的撕裂是指 UI 的一部分显示了状态 A，而另一部分显示了状态 B。在 React 中，这是指在一次渲染过程中，组件读取到了不一致的数据状态。

为什么会发生？

因为并发渲染是可以中断的。

- React 开始渲染组件树的一部分（读取了外部 Store 的值 v1）。

- 中断：React 暂停渲染，把控制权交还给浏览器（处理点击事件或网络回调）。

- 外部更新：在暂停期间，外部 Store（如 window.innerWidth、Redux、Zustand）发生了变化，值变成了 v2。

- 恢复：React 继续渲染剩余的组件。

- 问题：剩下的组件读取到了新的值 v2。

- 结果：同一个页面上，上半部分显示 v1 对应的内容，下半部分显示 v2 对应的内容。这就是“撕裂”。

举例说明：撕裂（Tearing）

假设我们有一个简单的应用，显示当前的“主题颜色”（外部变量）。

外部数据：

```tsx
// 这是一个外部 store，React 无法感知它的变化

let themeColor = 'blue';

function updateColor(*newColor*) {
 themeColor = newColor;
}
```

React 组件：

```tsx
function App() {
  return (
    <div>
      <Header /> {/* 读取 themeColor */}
      <ExpensiveList /> {/* 一个很重的组件，渲染很慢 */}
      <Footer /> {/* 读取 themeColor */}
    </div>
  );
}
```

并发渲染下的灾难流程：

- 开始渲染：React 开始渲染 App。

- 渲染 Header：Header 组件读取 themeColor，得到 'blue'。渲染出蓝色的头部。

- 渲染 ExpensiveList：ExpensiveList 很复杂，React 计算了一会儿，决定暂停（yield）一下，把主线程让出来给浏览器处理紧急任务。

- 外部干扰（用户交互）：在 React 暂停期间，用户点击了一个按钮，触发了 updateColor('red')。现在 themeColor 变成了 'red'。

- 恢复渲染：React 忙完了其他事，回来继续渲染剩下的组件。

- 渲染 Footer：Footer 组件读取 themeColor，得到 'red'（因为它直接读的外部变量）。渲染出红色的底部。

- 提交到屏幕：React 把生成的 DOM 更新到屏幕上。

- 结果：用户看到了一个蓝色的头和一个红色的脚。这就是视觉撕裂。

#### 解决方案：useSyncExternalStore

为了解决这个问题，React 18 引入了 useSyncExternalStore。它的作用是告诉 React：

“嘿，我依赖这个外部数据源。如果你在渲染过程中发现这个数据源变了，那这次渲染就废了（Throw away），必须用新数据重新从头渲染一次，绝对不能展示不一致的中间状态。”

它强制 React 在读取这个 Store 时采用同步的方式，或者在并发渲染检测到不一致时强制重试，从而保证了视觉的一致性（虽然牺牲了一点点并发带来的性能优势，但正确性永远是第一位的）。

#### react commit阶段不是同步渲染的吗，可中断的不是render阶段的fiber树生成吗

1. 澄清：Render vs Commit

- Render 阶段（可中断、异步）：

- 这是 React 调用你的组件函数（FunctionComponent()）、运行 Hooks、生成 Fiber 节点、进行 Diff 算法（Reconcile）的过程。

- 关键点：这个阶段纯粹是计算，没有实际的 DOM 操作。

- 并发特性：因为只是在内存里算数，所以 React 可以算一会儿、停一会儿（yield），甚至算了一半发现数据过时了直接扔掉重算。

- Commit 阶段（不可中断、同步）：

- 这是 React 把计算好的变更（Effect List）真正应用到 DOM 上（appendChild, replaceChild），并执行 useLayoutEffect 和 useEffect（调度）的阶段。

- 关键点：一旦进入这个阶段，必须一气呵成，绝对不能停，否则用户会看到 UI 闪烁或 DOM 结构不完整。

2. 为什么“撕裂”依然会发生？

你可能会问：*“既然 Commit 阶段是同步的，DOM 更新是一次性完成的，那为什么还会出现头部是蓝色、底部是红色的情况？”*

答案是：因为组件读取数据的动作（Read）发生在 Render 阶段。

让我们回到之前的例子，精确地看它发生在哪个阶段：

- Render 阶段开始：

- React 开始调用组件函数生成 Fiber 树。

- Render <Header />：

- 调用 Header() 函数。

- 代码执行：const color = store.themeColor; （此时读到 'blue'）。

- 生成 Header 的 Fiber 节点：{ type: 'div', props: { color: 'blue' } }。

- 中断（Yield）：

- React 发现时间片用完了，或者有更高优先级的任务，暂停 Render 阶段。

- 外部更新（Interruption）：

- 浏览器处理点击事件，执行 store.themeColor = 'red'。

- 注意：此时 React 还没进 Commit 阶段，屏幕上啥也没变。

- Render 阶段恢复：

- React 继续构建剩下的 Fiber 树。

1. Render <Footer />：

- 调用 Footer() 函数。

- 代码执行：const color = store.themeColor; （此时读到 'red'，因为它是直接读外部变量）。

- 生成 Footer 的 Fiber 节点：{ type: 'div', props: { color: 'red' } }。

- Render 阶段结束：

- Fiber 树构建完成。树里 Header 是蓝的，Footer 是红的。

- Commit 阶段（同步）：

- React 把这棵“畸形”的树同步更新到 DOM。

- 用户看到了撕裂的 UI。

#### 如何被修改的数据是useState()数据，是不是就不会有这种问题

是的！如果数据完全由 React 的 useState (或 useReducer, Context) 管理，就不会出现“撕裂”问题。

这是因为 React 的 State 具有 “快照（Snapshot）” 特性，且 React 内部完全掌控了 State 的版本管理。

为什么 useState 不会撕裂？

当你在 React 中触发 setState 时，React 会开启一次新的更新。在这个更新的 整个 Render 阶段（无论是否被中断），React 都会保证组件读取到的 state 值是 固定不变的。

即使在 Render 中途暂停了，用户点击按钮触发了第二次 setState，React 也会根据优先级决定是：

1. 丢弃当前的渲染，用新状态重新开始（此时所有组件都读到新值）。

1. 暂存新状态，继续用旧状态把当前的渲染做完（此时所有组件都读到旧值）。

无论哪种情况，React 保证在同一个渲染周期（Render Pass）内，所有组件看到的 State 是一致的。

举例说明：useState 的一致性

我们把之前的“撕裂”例子改成用 useState：

```tsx
function App() {
  // 此时 themeColor 是 React 内部管理的 state
  const [themeColor, setThemeColor] = useState('blue');

  return (
    <div>
      {/* 把 state 通过 props 传下去 */}
      <Header color={themeColor} />
      
      {/* 这是一个非常慢的组件 */}
      <ExpensiveList />
      
      <Footer color={themeColor} />
      
      {/* 一个按钮触发更新 */}
      <button onClick={() => setThemeColor('red')}>变红</button>
    </div>
  );
}

function Header({ color }) {
  return <div style={{ color }}>Header: {color}</div>;
}

function Footer({ color }) {
  return <div style={{ color }}>Footer: {color}</div>;
}
```

并发渲染流程（安全版）：

- 初始状态：themeColor 是 'blue'。

- 开始 Render：React 开始构建 Fiber 树。

- Render <Header />：读取 props.color -> 'blue'。

- 中断（Yield）：React 暂停，处理浏览器事件。

- 用户交互：用户点击按钮，调用 setThemeColor('red')。

- 关键点：React 接收到了这个更新请求，但在当前的这次渲染任务中，它不会直接修改正在使用的 themeColor 变量（因为闭包/快照特性）。

- React 此时面临选择：

- 情况 A（高优先级打断）：认为变色很紧急。React 会扔掉刚才算了一半的 Fiber 树（Header 是 blue 的那个），立即用 'red' 从头开始重新渲染。

- 结果：Header 读到 red，Footer 读到 red。一致（全红）。

- 情况 B（低优先级排队）：认为变色不紧急（比如是 startTransition 触发的）。React 会先把刚才那个 'blue' 的渲染任务做完。

- React 继续渲染 <Footer />，此时它用的还是这一轮渲染闭包里的值 'blue'。

- 结果：Header 读到 blue，Footer 读到 blue。一致（全蓝）。

- 等这次提交到屏幕后，React 紧接着马上开始下一轮渲染，把界面变成全红。

::: tip

为什么外部 Store 会出问题？

因为外部 Store 通常是 Mutable（可变的） 的。

而 React 的 useState 是基于 Immutable（不可变） 和 闭包 的。

:::

## 基本使用

你的 store 就是一个钩子！你可以把任何东西放进去：基本类型、对象、函数。`set`函数*会合并*状态。

```tsx
import { create } from 'zustand'

const useBear = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

你可以在任何位置使用此钩子，无需提供程序。选择你的状态，使用该钩子的组件会在该状态改变时重新渲染。

```tsx
function BearCounter() {
  const bears = useBear((state) => state.bears)
  return <h1>{bears} bears around here...</h1>
}

function Controls() {
  const increasePopulation = useBear((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}

```

Typescript 

```tsx
import { create } from "zustand";

type State = {
  count: number;
};

type Actions = {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
};

type Action = {
  type: keyof Actions;
  qty: number;
};

type Dispatch={
    dispatch:(action:Action)=>void
}



const countReducer = (state: State, action: Action) => {
  switch (action.type) {
    case "increment":
      return { count: state.count + action.qty };
    case "decrement":
      return { count: state.count - action.qty };
    default:
      return state;
  }
};

export const useCountStore = create<State & Dispatch>((set) => ({
  count: 0,
  dispatch: (action: Action) => set((state) => countReducer(state, action)),
}));

```

## 更新状态

使用 Zustand 更新状态非常简单！只需调用提供的`set`函数并传入新状态，它就会与 store 中已有的状态进行浅合并

### [深度嵌套对象](https://zustand.docs.pmnd.rs/guides/updating-state#deeply-nested-object)

如果你有一个像这样的深度状态对象：

```ts
type State = {
  deep: {
    nested: {
      obj: { count: number }
    }
  }
}
```

使用展开运算符

```ts
  normalInc: () =>
    set((state) => ({
      deep: {
        ...state.deep,
        nested: {
          ...state.deep.nested,
          obj: {
            ...state.deep.nested.obj,
            count: state.deep.nested.obj.count + 1
          }
        }
      }
    })),

```

使用[Immer](https://github.com/immerjs/immer)来更新嵌套值

```ts
  immerInc: () =>
    set(produce((state: State) => { ++state.deep.nested.obj.count })),

```

