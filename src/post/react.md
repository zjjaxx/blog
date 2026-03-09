## 组件

React 组件必须以大写字母开头，你的组件也不能返回多个 JSX 标签，你必须将它们包裹到一个共享的父级中，比如 `<div>...</div>` 或使用空的 `<>...</>` 包裹：

### hook

Hook 比普通函数更为严格。你只能在你的组件（或其他 Hook）的 **顶层** 调用 Hook，如果你想在一个条件或循环中使用 `useState`，请提取一个新的组件并在组件内部使用它。

原因:

- 每个函数组件对应一个 Fiber 节点，其中维护了一个 Hook 链表，按声明顺序存储所有 Hook,如useState、useEffect的状态
- 每次渲染时，React会按固定顺序遍历该链表，将 Hook 调用与上一次渲染的状态一一对应，若顺序变化（如条件语句中跳过某个 Hook），链表关联关系将错乱，导致状态错位或丢失          

### 组件以及hook设计哲学

1. 这一技术即 [单一功能原理](https://en.wikipedia.org/wiki/Single_responsibility_principle)，也就是说，一个组件理想情况下应仅做一件事情。但随着功能的持续增长，它应该被分解为更小的子组件。
2. 使用 React 构建一个静态版本 ，而在大型项目中，自下而上构建更简单。

3. 找出 UI 精简且完整的 state 表示 ，计算出你应用程序需要的绝对精简 state 表示
   - 随着时间推移 **保持不变**？如此，便不是 state。
   - 通过 props **从父组件传递**？如此，便不是 state。
   - 是否可以基于已存在于组件中的 state 或者 props **进行计算**？如此，它肯定不是state！

4. 验证 state 应该被放置在哪里 ，寻找它们最近并且共同的父组件——在层级结构中，一个凌驾于它们所有组件之上的组件。遵循 **单向数据流**原则

### 嵌套和组织组件

::: warning

组件可以渲染其他组件，但是 **请不要嵌套他们的定义**：

```js
export default function Gallery() {
  // 🔴 永远不要在组件中定义组件
  function Profile() {
    // ...
  }
  // ...
}
```

上面这段代码 [非常慢，并且会导致 bug 产生](https://zh-hans.react.dev/learn/preserving-and-resetting-state#different-components-at-the-same-position-reset-state)。因此，你应该在顶层定义每个组件：

:::

## 渲染列表 

你可以在 React 中使用 JavaScript 的 `filter()` 和 `map()` 来实现数组的过滤和转换，将数据数组转换为***组件数组（也就是说可以渲染数组变量）***

## hook函数

### useState

[`useState`](https://zh-hans.react.dev/reference/react/useState) Hook 提供了这两个功能：

1. **State 变量** 用于保存渲染间的数据。
2. **State setter 函数** 更新变量并触发 React 再次渲染组件。

[state 如同一张快照](https://zh-hans.react.dev/learn/state-as-a-snapshot) 

每次setState都会触发组件重新执行渲染

::: tip

注意，是整个组件方法重新执行

:::

#### 更新逻辑

::: tip

**一个 state 变量的值永远不会在一次渲染的内部发生变化，** 即使其事件处理函数的代码是异步的。

:::

以下是实际发生的情况：

```
const [index, setIndex] = useState(0);
```

1. **组件进行第一次渲染。** 因为你将 `0` 作为 `index` 的初始值传递给 `useState`，它将返回 `[0, setIndex]`。 React 记住 `0` 是最新的 state 值。
2. **你更新了 state**。当用户点击按钮时，它会调用 `setIndex(index + 1)`。 `index` 是 `0`，所以它是 `setIndex(1)`。这告诉 React 现在记住 `index` 是 `1` 并触发下一次渲染。
3. **组件进行第二次渲染**。React 仍然看到 `useState(0)`，但是因为 React *记住* 了你将 `index` 设置为了 `1`，它将返回 `[1, setIndex]`。
4. 以此类推！

::: details

作为一个组件的记忆，state 不同于在你的函数返回之后就会消失的普通变量。state 实际上“活”在 React 本身中——就像被摆在一个架子上！——位于你的函数之外。当 React 调用你的组件时，它会为特定的那一次渲染提供一张 state 快照。你的组件会在其 JSX 中返回一张包含一整套新的 props 和事件处理函数的 UI 快照 ，其中所有的值都是 **根据那一次渲染中 state 的值** 被计算出来的！

**React 会等到事件处理函数中的** 所有 **代码都运行完毕再处理你的 state 更新**，这也意味着只有在你的事件处理函数及其中任何代码执行完成 **之后**，UI 才会更新，这种特性也就是 **批处理**

:::

#### 在下次渲染前多次更新同一个 state 

```js
setNumber(n => n + 1);
```

在这里，`n => n + 1` 被称为 **更新函数**。当你将它传递给一个 state 设置函数时：

1. React 会将此函数加入队列，以便在事件处理函数中的所有其他代码运行后进行处理。

2. 在下一次渲染期间，React 会遍历队列并给你更新之后的最终 state。

   ::: details

   当你在下次渲染期间调用 `useState` 时，React 会遍历队列。之前的 `number` state 的值是 `0`，所以这就是 React 作为参数 `n` 传递给第一个更新函数的值。然后 React 会获取你上一个更新函数的返回值，并将其作为 `n` 传递给下一个更新函数，以此类推：

   :::

#### 更新 state 中的对象 

虽然严格来说 React state 中存放的对象是可变的，但你应该像处理数字、布尔值、字符串一样将它们视为不可变的。因此你应该替换它们的值，而不是对它们进行修改。

当你想更新一个对象和数组时，你需要创建一个新的对象（或复制现有的对象），然后用这个副本来更新状态

如果在代码中复制对象感觉乏味，可以使用 [Immer](https://github.com/immerjs/use-immer) 之类的库来减少重复代码：

```js
 const [person, updatePerson] = useImmer({
    name: 'Niki de Saint Phalle',
    artwork: {
      title: 'Blue Nana',
      city: 'Hamburg',
      image: 'https://i.imgur.com/Sd1AgUOm.jpg',
    }
  });
 
function handleCityChange(e) {
    updatePerson(draft => {
      draft.artwork.city = e.target.value;
    });
  }
```

```js
  const [list, updateList] = useImmer(initialList);

  function handleToggle(artworkId, nextSeen) {
    updateList(draft => {
      const artwork = draft.find(a =>
        a.id === artworkId
      );
      artwork.seen = nextSeen;
    });
  }
```

#### 为什么在 React 中不推荐直接修改 state？

有以下几个原因：

- **调试**：如果你使用 `console.log` 并且不直接修改 state，你之前日志中的 state 的值就不会被新的 state 变化所影响。这样你就可以清楚地看到两次渲染之间 state 的值发生了什么变化
- **优化**：React 常见的 [优化策略](https://zh-hans.react.dev/reference/react/memo) 依赖于如果之前的 props 或者 state 的值和下一次相同就跳过渲染。如果你从未直接修改 state ，那么你就可以很快看到 state 是否发生了变化。如果 `prevObj === obj`，那么你就可以肯定这个对象内部并没有发生改变。
- **新功能**：我们正在构建的 React 的新功能依赖于 state 被 [像快照一样看待](https://zh-hans.react.dev/learn/state-as-a-snapshot) 的理念。如果你直接修改 state 的历史版本，可能会影响你使用这些新功能。
- **需求变更**：有些应用功能在不出现任何修改的情况下会更容易实现，比如实现撤销/恢复、展示修改历史，或是允许用户把表单重置成某个之前的值。这是因为你可以把 state 之前的拷贝保存到内存中，并适时对其进行再次使用。如果一开始就用了直接修改 state 的方式，那么后面要实现这样的功能就会变得非常困难。
- **更简单的实现**：React 并不依赖于 mutation ，所以你不需要对对象进行任何特殊操作。它不需要像很多“响应式”的解决方案一样去劫持对象的属性、总是用代理把对象包裹起来，或者在初始化时做其他工作。这也是 React 允许你把任何对象存放在 state 中——不管对象有多大——而不会造成有任何额外的性能或正确性问题的原因。

#### [构建 state 的原则](https://zh-hans.react.dev/learn/choosing-the-state-structure)

1. **合并关联的 state**。如果你总是同时更新两个或更多的 state 变量，请考虑将它们合并为一个单独的 state 变量。
2. **避免互相矛盾的 state**。当 state 结构中存在多个相互矛盾或“不一致”的 state 时，你就可能为此会留下隐患。应尽量避免这种情况。
3. **避免冗余的 state**。如果你能在渲染期间从组件的 props 或其现有的 state 变量中计算出一些信息，则不应将这些信息放入该组件的 state 中。
4. **避免重复的 state**。当同一数据在多个 state 变量之间或在多个嵌套对象中重复时，这会很难保持它们同步。应尽可能减少重复。
5. **避免深度嵌套的 state**。深度分层的 state 更新起来不是很方便。如果可能的话，最好以扁平化方式构建 state。

#### 对 state 进行保留和重置

- 方法一：将组件渲染在不同的位置 
- 方法二：使用 key 来重置 state ，比如重置表单 

### 迁移状态逻辑至 Reducer 中

::: tip

非常好的编程思想，可以和pinia、vuex等库的设计理念做深入思考

:::

对于那些需要更新多个状态的组件来说，过于分散的事件处理程序可能会令人不知所措。对于这种情况，你可以在组件外部将所有状态更新逻辑合并到一个称为 “reducer” 的函数中。这样，事件处理程序就会变得简洁，因为它们只需要指定用户的 “actions”。在文件的底部，reducer 函数指定状态应该如何更新以响应每个 action！

```js
import { useReducer } from 'react';
import AddTask from './AddTask.js';
import TaskList from './TaskList.js';

export default function TaskApp() {
  const [tasks, dispatch] = useReducer(
    tasksReducer,
    initialTasks
  );

  function handleAddTask(text) {
    dispatch({
      type: 'added',
      id: nextId++,
      text: text,
    });
  }

  function handleChangeTask(task) {
    dispatch({
      type: 'changed',
      task: task
    });
  }

  function handleDeleteTask(taskId) {
    dispatch({
      type: 'deleted',
      id: taskId
    });
  }

  return (
    <>
      <h1>布拉格行程</h1>
      <AddTask
        onAddTask={handleAddTask}
      />
      <TaskList
        tasks={tasks}
        onChangeTask={handleChangeTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  );
}

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [...tasks, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'changed': {
      return tasks.map(t => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('未知操作：' + action.type);
    }
  }
}

let nextId = 3;
const initialTasks = [
  { id: 0, text: '参观卡夫卡博物馆', done: true },
  { id: 1, text: '看木偶戏', done: false },
  { id: 2, text: '列侬墙图片', done: false }
];

```

::: tip

通过 `useImmerReducer` 来管理 reducer 时，可以修改第一个参数，且不需要返回一个新的 state 的原因。

:::

### 使用 Context 深层传递参数 

1. 创建context

   ```js
   import { createContext } from 'react';
   
   export const LevelContext = createContext(0);
   ```

2. **提供数据**

   ```js
   import { useContext } from 'react';
   import { LevelContext } from './LevelContext.js';
   
   export default function Section({ children }) {
     const level = useContext(LevelContext);
     return (
       <section className="section">
         <LevelContext value={level + 1}>
           {children}
         </LevelContext>
       </section>
     );
   }
   
   ```

3. 消费context

   ```js
   import { useContext } from 'react';
   import { LevelContext } from './LevelContext.js';
   
   export default function Heading({ children }) {
     const level = useContext(LevelContext);
     switch (level) {
       case 0:
         throw Error('标题必须在 Section 内！');
       case 1:
         return <h1>{children}</h1>;
       case 2:
         return <h2>{children}</h2>;
       case 3:
         return <h3>{children}</h3>;
       case 4:
         return <h4>{children}</h4>;
       case 5:
         return <h5>{children}</h5>;
       case 6:
         return <h6>{children}</h6>;
       default:
         throw Error('未知级别：' + level);
     }
   }
   
   ```

#### 写在你使用 context 之前 

使用 Context 看起来非常诱人！然而，这也意味着它也太容易被过度使用了。**如果你只想把一些 props 传递到多个层级中，这并不意味着你需要把这些信息放到 context 里。**

在使用 context 之前，你可以考虑以下几种替代方案：

1. **从 [传递 props](https://zh-hans.react.dev/learn/passing-props-to-a-component) 开始。** 如果你的组件看起来不起眼，那么通过十几个组件向下传递一堆 props 并不罕见。这有点像是在埋头苦干，但是这样做可以让哪些组件用了哪些数据变得十分清晰！维护你代码的人会很高兴你用 props 让数据流变得更加清晰。
2. **抽象组件并 [将 JSX 作为 `children` 传递](https://zh-hans.react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) 给它们。** 如果你通过很多层不使用该数据的中间组件（并且只会向下传递）来传递数据，这通常意味着你在此过程中忘记了抽象组件。举个例子，你可能想传递一些像 `posts` 的数据 props 到不会直接使用这个参数的组件，类似 `<Layout posts={posts} />`。取而代之的是，让 `Layout` 把 `children` 当做一个参数，然后渲染 `<Layout><Posts posts={posts} /></Layout>`。这样就减少了定义数据的组件和使用数据的组件之间的层级。

如果这两种方法都不适合你，再考虑使用 context。

#### Context 的使用场景 

- **主题：** 如果你的应用允许用户更改其外观（例如暗夜模式），你可以在应用顶层放一个 context provider，并在需要调整其外观的组件中使用该 context。
- **当前账户：** 许多组件可能需要知道当前登录的用户信息。将它放到 context 中可以方便地在树中的任何位置读取它。某些应用还允许你同时操作多个账户（例如，以不同用户的身份发表评论）。在这些情况下，将 UI 的一部分包裹到具有不同账户数据的 provider 中会很方便。
- **路由：** 大多数路由解决方案在其内部使用 context 来保存当前路由。这就是每个链接“知道”它是否处于活动状态的方式。如果你创建自己的路由库，你可能也会这么做。
- **状态管理：** 随着你的应用的增长，最终在靠近应用顶部的位置可能会有很多 state。许多遥远的下层组件可能想要修改它们。通常 [将 reducer 与 context 搭配使用](https://zh-hans.react.dev/learn/scaling-up-with-reducer-and-context)来管理复杂的状态并将其传递给深层的组件来避免过多的麻烦。

### 使用 Reducer 和 Context 拓展你的应用

1. **创建** context。
2. 将 state 和 dispatch **放入** context。
3. 在组件树的任何地方 **使用** context。

### 使用 ref 引用值

::: warning

请注意，**组件不会在每次递增时重新渲染。** 与 state 一样，React 会在每次重新渲染之间保留 ref。但是，设置 state 会重新渲染组件，更改 ref 不会！

:::

#### 何时使用 ref 

通常，当你的组件需要“跳出” React 并与外部 API 通信时，你会用到 ref —— 通常是不会影响组件外观的浏览器 API。以下是这些罕见情况中的几个：

- 存储 [timeout ID](https://developer.mozilla.org/docs/Web/API/setTimeout)
- 存储和操作 [DOM 元素](https://developer.mozilla.org/docs/Web/API/Element)
- 存储不需要被用来计算 JSX 的其他对象。

如果你的组件需要存储一些值，但不影响渲染逻辑，请选择 ref。

#### 访问另一个组件的 DOM 节点 

你可以 [像其它 prop 一样](https://zh-hans.react.dev/learn/passing-props-to-a-component) 将 ref 从父组件传递给子组件。

```js
import { useRef } from 'react';

function MyInput({ ref }) {
  return <input ref={ref} />;
}

function MyForm() {
  const inputRef = useRef(null);
  return <MyInput ref={inputRef} />
}
```

### 使用 Effect 进行同步

**Effect 是一段响应式的代码块**。它们在读取的值发生变化时重新进行同步。每个 Effect 都应该表示一个独立的同步过程。 

**Effect 允许你指定由渲染自身，而不是特定事件引起的副作用**

::: tip

**不要急着在你的组件中使用 Effect**。记住，Effect 通常用于暂时“跳出” React 并与一些 **外部** 系统进行同步。这包括浏览器 API、第三方小部件，以及网络等等。如果你的 Effect 只是根据其他状态来调整某些状态，那么 [你可能并不需要一个 Effect](https://zh-hans.react.dev/learn/you-might-not-need-an-effect)。

:::

::: warning
默认情况下，Effect 会在 **每次** 渲染后运行。**正因如此，以下代码会陷入死循环**：

```js
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
});
```

Effect 在渲染结束后运行。更新 state 会触发重新渲染。在 Effect 中直接更新 state 就像是把电源插座的插头插回自身：Effect 运行、更新 state、触发重新渲染、于是又触发 Effect 运行、再次更新 state，继而再次触发重新渲染。如此反复，从而陷入死循环。

Effect 应该用于将你的组件与一个 **外部** 的系统保持同步。如果没有外部系统，你只是想根据其他状态调整一些状态，那么 [你也许不需要 Effect](https://zh-hans.react.dev/learn/you-might-not-need-an-effect)。

:::

#### 依赖数组

没有依赖数组和使用空数组 `[]` 作为依赖数组，行为是不同的：

```js
useEffect(() => {
  // 这里的代码会在每次渲染后运行
});

useEffect(() => {
  // 这里的代码只会在组件挂载（首次出现）时运行
}, []);

useEffect(() => {
  // 这里的代码不但会在组件挂载时运行，而且当 a 或 b 的值自上次渲染后发生变化后也会运行
}, [a, b]);
```

##### 在组件主体中声明的所有变量都是响应式的 

Props 和 state 并不是唯一的响应式值。从它们计算出的值也是响应式的。

```js
function ChatRoom({ roomId, selectedServerUrl }) { // roomId 是响应式的
  const settings = useContext(SettingsContext); // settings 是响应式的
  const serverUrl = selectedServerUrl ?? settings.defaultServerUrl; // serverUrl 是响应式的
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId); // Effect 读取了 roomId 和 serverUrl
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, [roomId, serverUrl]); // 因此，当它们中的任何一个发生变化时，它需要重新同步！
  // ...
}
```

在这个例子中，`serverUrl` 不是 prop 或 state 变量。它是在渲染过程中计算的普通变量。但是它是在渲染过程中计算的，所以它可能会因为重新渲染而改变。这就是为什么它是响应式的。

#### 清理函数

::: tip

为了帮助你快速发现它们，在开发环境中，React 会在组件首次挂载后立即重新挂载一次。React 有意在开发环境下重新挂载你的组件，来找到类似上例中的 bug。**你需要思考的不是“如何只运行一次 Effect”，而是“如何修复我的 Effect 来让它在重新挂载后正常运行”**。

通常，答案是实现清理函数。清理函数应该停止或撤销 Effect 所做的一切。原则是用户不应该感受到 Effect 只执行一次（在生产环境中）和连续执行“挂载 → 清理 → 挂载”（在开发环境中）之间的区别。

:::

```js
useEffect(() => {
  const connection = createConnection();
  connection.connect();
  return () => {
    connection.disconnect();
  };
}, []);
```

React 会在每次 Effect 重新运行之前调用清理函数，并在组件卸载（被移除）时最后一次调用清理函数

#### 触发动画 

```js
useEffect(() => {
  const node = ref.current;
  node.style.opacity = 1; // 触发动画
  return () => {
    node.style.opacity = 0; // 重置为初始值
  };
}, []);
```

#### 获取数据 

如果你的 Effect 需要获取数据，清理函数应 [中止请求](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController) 或忽略其结果：

```js
useEffect(() => {
  let ignore = false;

  async function startFetching() {
    const json = await fetchTodos(userId);
    if (!ignore) {
      setTodos(json);
    }
  }

  startFetching();

  return () => {
    ignore = true;
  };
}, [userId]);
```

**在生产环境中，只会有一条请求**。如果开发环境中的第二次请求给你造成了困扰，最好的办法是使用一个能够对请求去重并缓存响应的方案

#### 不适用于 Effect：初始化应用 

某些逻辑应该只在应用启动时运行一次。你可以将它放在组件外部：

```js
if (typeof window !== 'undefined') { // 检查是否在浏览器中运行
  checkAuthToken();
  loadDataFromLocalStorage();
}

function App() {
  // ……
}
```

#### 不适用于 Effect：购买商品 

有时，即使你编写了清理函数，也无法避免用户观察到 Effect 运行了两次。比如你的 Effect 发送了一个像购买商品这样的 POST 请求：

```js
useEffect(() => {
  // 🔴 错误：此处的 Effect 在开发环境中会触发两次，暴露出代码中的问题。
  fetch('/api/buy', { method: 'POST' });
}, []);
```

买操作并不是由渲染引起的，而是由特定的交互引起的。它应该只在用户按下按钮时执行

#### 如何移除不必要的 Effect 

有两种不必使用 Effect 的常见情况：

- **你不必使用 Effect 来转换渲染所需的数据**。例如，你想在展示一个列表前先做筛选。你的直觉可能是写一个当列表变化时更新 state 变量的 Effect。然而，这是低效的。当你更新这个 state 时，React 首先会调用你的组件函数来计算应该显示在屏幕上的内容。然后 React 会把这些变化“[提交](https://zh-hans.react.dev/learn/render-and-commit)”到 DOM 中来更新屏幕。然后 React 会执行你的 Effect。如果你的 Effect 也立即更新了这个 state，就会重新执行整个流程。为了避免不必要的渲染流程，应在你的组件顶层转换数据。这些代码会在你的 props 或 state 变化时自动重新执行。
- **你不必使用 Effect 来处理用户事件**。例如，你想在用户购买一个产品时发送一个 `/api/buy` 的 POST 请求并展示一个提示。在这个购买按钮的点击事件处理函数中，你确切地知道会发生什么。但是当一个 Effect 运行时，你却不知道用户做了什么（例如，点击了哪个按钮）。这就是为什么你通常应该在相应的事件处理函数中处理用户事件。

- 在事件处理函数中共享逻辑 ，共享逻辑不应放在useEffect中，而是抽离为函数调用



#### 响应式 Effect 的生命周期

::: tip

当你从组件的角度思考时，很容易将 Effect 视为在特定时间点触发的“回调函数”或“生命周期事件”，例如“渲染后”或“卸载前”。这种思维方式很快变得复杂，所以最好避免使用。

**相反，始终专注于单个启动/停止周期。无论组件是挂载、更新还是卸载，都不应该有影响。只需要描述如何开始同步和如何停止。如果做得好，Effect 将能够在需要时始终具备启动和停止的弹性**。

:::

### `useCallback` 与 `useMemo`

[`useMemo`](https://zh-hans.react.dev/reference/react/useMemo) 经常与 `useCallback` 一同出现。当尝试优化子组件时，它们都很有用。他们会 [记住](https://en.wikipedia.org/wiki/Memoization)（或者说，缓存）正在传递的东西：

```js
import { useMemo, useCallback } from 'react';

function ProductPage({ productId, referrer }) {
  const product = useData('/product/' + productId);

  const requirements = useMemo(() => { //调用函数并缓存结果
    return computeRequirements(product);
  }, [product]);

  const handleSubmit = useCallback((orderDetails) => { // 缓存函数本身
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);

  return (
    <div className={theme}>
      <ShippingForm requirements={requirements} onSubmit={handleSubmit} />
    </div>
  );
}

```

- **[`useMemo`](https://zh-hans.react.dev/reference/react/useMemo) 缓存函数调用的结果**。在这里，它缓存了调用 `computeRequirements(product)` 的结果。除非 `product` 发生改变，否则它将不会发生变化。这让你向下传递 `requirements` 时而无需不必要地重新渲染 `ShippingForm`。必要时，React 将会调用传入的函数重新计算结果。
- **`useCallback` 缓存函数本身**。不像 `useMemo`，它不会调用你传入的函数。相反，它缓存此函数。从而除非 `productId` 或 `referrer` 发生改变，`handleSubmit` 自己将不会发生改变。这让你向下传递 `handleSubmit` 函数而无需不必要地重新渲染 `ShippingForm`。直至用户提交表单，你的代码都将不会运行。

### useLayoutEffect

::: warning

`useLayoutEffect` 可能会影响性能。尽可能使用 [`useEffect`](https://zh-hans.react.dev/reference/react/useEffect)。

:::

`useLayoutEffect` 是 [`useEffect`](https://zh-hans.react.dev/reference/react/useEffect) 的一个版本，在浏览器重新绘制屏幕之前触发。

#### 在浏览器重新绘制屏幕前计算布局 

```js
import { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import TooltipContainer from './TooltipContainer.js';

export default function Tooltip({ children, targetRect }) {
  const ref = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);

  useLayoutEffect(() => {
    const { height } = ref.current.getBoundingClientRect();
    setTooltipHeight(height);
    console.log('Measured tooltip height: ' + height);
  }, []);

  let tooltipX = 0;
  let tooltipY = 0;
  if (targetRect !== null) {
    tooltipX = targetRect.left;
    tooltipY = targetRect.top - tooltipHeight;
    if (tooltipY < 0) {
      // 它不适合上方，因此把它放在下面。
      tooltipY = targetRect.bottom;
    }
  }

  return createPortal(
    <TooltipContainer x={tooltipX} y={tooltipY} contentRef={ref}>
      {children}
    </TooltipContainer>,
    document.body
  );
}

```

### useImperativeHandle

`useImperativeHandle` 是 React 中的一个 Hook，它能让你自定义由 [ref](https://zh-hans.react.dev/learn/manipulating-the-dom-with-refs) 暴露出来的句柄。

```js
import { useRef, useImperativeHandle } from 'react';

function MyInput({ ref }) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      focus() {
        inputRef.current.focus();
      },
      scrollIntoView() {
        inputRef.current.scrollIntoView();
      },
    };
  }, []);

  return <input ref={inputRef} />;
};
```

## 你可能不需要 Effect

- **如果一个值可以基于现有的 props 或 state 计算得出，[不要把它作为一个 state](https://zh-hans.react.dev/learn/choosing-the-state-structure#avoid-redundant-state)，而是在渲染期间直接计算这个值**。

  ```tsx
  function Form() {
    const [firstName, setFirstName] = useState('Taylor');
    const [lastName, setLastName] = useState('Swift');
    // ✅ 非常好：在渲染期间进行计算
    const fullName = firstName + ' ' + lastName;
    // ...
  }
  ```

  如果是比较昂贵的计算则实用useMemo

  ::: tip

  一般来说只有你创建或循环遍历了成千上万个对象时才会很耗费时间。

  :::

  ```tsx
  import { useMemo, useState } from 'react';
  
  function TodoList({ todos, filter }) {
    const [newTodo, setNewTodo] = useState('');
    const visibleTodos = useMemo(() => {
      // ✅ 除非 todos 或 filter 发生变化，否则不会重新执行
      return getFilteredTodos(todos, filter);
    }, [todos, filter]);
    // ...
  }
  ```

- 当 props 变化时重置所有 state 

  ```tsx
  export default function ProfilePage({ userId }) {
    return (
      <Profile
        userId={userId}
        key={userId}
      />
    );
  }
  
  function Profile({ userId }) {
    // ✅ 当 key 变化时，该组件内的 comment 或其他 state 会自动被重置
    const [comment, setComment] = useState('');
    // ...
  }
  ```

  通常，当在相同的位置渲染相同的组件时，React 会保留状态。**通过将 `userId` 作为 `key` 传递给 `Profile` 组件，使  React 将具有不同 `userId` 的两个 `Profile` 组件视为两个不应共享任何状态的不同组件**。每当 key（这里是 `userId`）变化时，React 将重新创建 DOM，并 [重置](https://zh-hans.react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key) `Profile` 组件和它的所有子组件的 state。

- 当 prop 变化时调整部分 state 

  ```tsx
  function List({ items }) {
    const [isReverse, setIsReverse] = useState(false);
    const [selection, setSelection] = useState(null);
  
    // 好一些：在渲染期间调整 state
    const [prevItems, setPrevItems] = useState(items);
    if (items !== prevItems) {
      setPrevItems(items);
      setSelection(null);
    }
    // ...
  }
  ```

  上面的例子中，在渲染过程中直接调用了 `setSelection`。当它执行到 `return` 语句退出后，React 将 **立即** 重新渲染 `List`。此时 React 还没有渲染 `List` 的子组件或更新 DOM，这使得 `List` 的子组件可以跳过渲染旧的 `selection` 值。

- 初始化应用 

  有些逻辑只需要在应用加载时执行一次。

  ```tsx
  function App() {
    // 🔴 避免：把只需要执行一次的逻辑放在 Effect 中
    useEffect(() => {
      loadDataFromLocalStorage();
      checkAuthToken();
    }, []);
    // ...
  }
  ```

  然后，你很快就会发现它在 [开发环境会执行两次](https://zh-hans.react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)。尽管在实际的生产环境中它可能永远不会被重新挂载，但在所有组件中遵循相同的约束条件可以更容易地移动和复用代码。如果某些逻辑必须在 **每次应用加载时执行一次**，而不是在 **每次组件挂载时执行一次**，可以添加一个顶层变量来记录它是否已经执行过了：

  ```tsx
  let didInit = false;
  
  function App() {
    useEffect(() => {
      if (!didInit) {
        didInit = true;
        // ✅ 只在每次应用加载时执行一次
        loadDataFromLocalStorage();
        checkAuthToken();
      }
    }, []);
    // ...
  }
  ```

  你也可以在模块初始化和应用渲染之前执行它：

  ```tsx
  if (typeof window !== 'undefined') { // 检测我们是否在浏览器环境
     // ✅ 只在每次应用加载时执行一次
    checkAuthToken();
    loadDataFromLocalStorage();
  }
  
  function App() {
    // ...
  }
  ```

- 订阅外部 store 

  ```tsx
  function useOnlineStatus() {
    // 不理想：在 Effect 中手动订阅 store
    const [isOnline, setIsOnline] = useState(true);
    useEffect(() => {
      function updateState() {
        setIsOnline(navigator.onLine);
      }
  
      updateState();
  
      window.addEventListener('online', updateState);
      window.addEventListener('offline', updateState);
      return () => {
        window.removeEventListener('online', updateState);
        window.removeEventListener('offline', updateState);
      };
    }, []);
    return isOnline;
  }
  
  function ChatIndicator() {
    const isOnline = useOnlineStatus();
    // ...
  }
  ```

  尽管通常可以使用 Effect 来实现此功能，但 React 为此针对性地提供了一个 Hook 用于订阅外部 store。删除 Effect 并将其替换为调用 [`useSyncExternalStore`](https://zh-hans.react.dev/reference/react/useSyncExternalStore)：

  ```tsx
  function subscribe(callback) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
      window.removeEventListener('online', callback);
      window.removeEventListener('offline', callback);
    };
  }
  
  function useOnlineStatus() {
    // ✅ 非常好：用内置的 Hook 订阅外部 store
    return useSyncExternalStore(
      subscribe, // 只要传递的是同一个函数，React 不会重新订阅
      () => navigator.onLine, // 如何在客户端获取值
      () => true // 如何在服务端获取值
    );
  }
  
  function ChatIndicator() {
    const isOnline = useOnlineStatus();
    // ...
  }
  ```

  与手动使用 Effect 将可变数据同步到 React state 相比，这种方法能减少错误。通常，你可以写一个像上面的 `useOnlineStatus()` 这样的自定义 Hook，这样你就不需要在各个组件中重复写这些代码。

## 从 Effect 中提取非响应式逻辑 

例如，假设你想在用户连接到聊天室时展示一个通知。并且通过从 props 中读取当前 theme（dark 或者 light）来展示对应颜色的通知：

```tsx
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme);
    });
    connection.connect();
    return () => {
      connection.disconnect()
    };
  }, [roomId, theme]); // ✅ 声明所有依赖项
```

但是 `theme` 是一个响应式值（它会由于重新渲染而变化），并且 [Effect 读取的每一个响应式值都必须在其依赖项中声明](https://zh-hans.react.dev/learn/lifecycle-of-reactive-effects#react-verifies-that-you-specified-every-reactive-value-as-a-dependency)。现在你必须把 `theme` 作为 Effect 的依赖项之一：

使用 [`useEffectEvent`](https://zh-hans.react.dev/reference/react/useEffectEvent) 这个特殊的 Hook 从 Effect 中提取非响应式逻辑：

```tsx
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      onConnected();
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ 声明所有依赖项
```



## ref

当您希望组合“记住”某些信息，但又不想让这些信息[触发新的渲染](https://zh-hans.react.dev/learn/render-and-commit)时，您可以使用**ref**。

你可以[像其他 prop 一样](https://zh-hans.react.dev/learn/passing-props-to-a-component)将 ref 从父组件传递给子组件。

```tsx
import { useRef } from 'react';

function MyInput({ ref }) {
  return <input ref={ref} />;
}

function MyForm() {
  const inputRef = useRef(null);
  return <MyInput ref={inputRef} />
}
```

```tsx
import { useRef, useImperativeHandle } from "react";

function MyInput({ ref }) {
  const realInputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    // 只暴露 focus，没有别的
    focus() {
      realInputRef.current.focus();
    },
  }));
  return <input ref={realInputRef} />;
};

export default function Form() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>聚焦输入框</button>
    </>
  );
}

```

## flushSync

你可以强制React同步更新（“刷新”）DOM。为此，从`react-dom`导入放置`flushSync`状态**更新包裹**到`flushSync`调用中：

```tsx
flushSync(() => {
  setTodos([ ...todos, newTodo]);
});
listRef.current.lastChild.scrollIntoView();
```

