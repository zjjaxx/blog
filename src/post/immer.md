## 介绍
Immer 简化了不可变数据结构的处理， Immer 将通过解决以下痛点来帮助您遵循不可变数据范式：

1. Immer 将检测到意外 mutations 并抛出错误。
2. Immer 将不再需要创建对不可变对象进行深度更新时所需的典型样板代码：如果没有 Immer，则需要在每个级别手动制作对象副本。通常通过使用大量 `...` 展开操作。使用 Immer 时，会对 `draft` 对象进行更改，该对象会记录更改并负责创建必要的副本，而不会影响原始对象。
3. 使用 Immer 时，您无需学习专用 API 或数据结构即可从范例中受益。使用 Immer，您将使用纯 JavaScript 数据结构，并使用众所周知的安全地可变 JavaScript API。

一个简单的比较示例

```ts
const baseState = [
    {
        title: "Learn TypeScript",
        done: true
    },
    {
        title: "Try Immer",
        done: false
    }
]
```

不使用 Immer

如果没有 Immer，我们将不得不小心地浅拷贝每层受我们更改影响的 state 结构

```ts
const nextState = baseState.slice() // 浅拷贝数组
nextState[1] = {
    // 替换第一层元素
    ...nextState[1], // 浅拷贝第一层元素
    done: true // 期望的更新
}
// 因为 nextState 是新拷贝的, 所以使用 push 方法是安全的,
// 但是在未来的任意时间做相同的事情会违反不变性原则并且导致 bug！
nextState.push({title: "Tweet about it"})
```

使用 Immer

使用 Immer，这个过程更加简单。我们可以利用 `produce` 函数，它将我们要更改的 state 作为第一个参数，对于第二个参数，我们传递一个名为 recipe 的函数，该函数传递一个 `draft` 参数，我们可以对其应用直接的 `mutations`。一旦 `recipe` 执行完成，这些 `mutations` 被记录并用于产生下一个状态。 `produce` 将负责所有必要的复制，并通过冻结数据来防止未来的意外修改。

```ts
import {produce} from "immer"

const nextState = produce(baseState, draft => {
    draft[1].done = true
    draft.push({title: "Tweet about it"})
})
```

## Immer 如何工作

基本思想是，使用 Immer，您会将所有更改应用到临时 *draft*，它是 *currentState* 的代理。一旦你完成了所有的 *mutations*，Immer 将根据对 *draft state* 的 *mutations* 生成 nextState。这意味着您可以通过简单地修改数据来与数据交互，同时保留不可变数据的所有好处。

![](https://immerjs.github.io/immer/zh-CN/assets/images/immer-4002b3fd2cfd3aa66c62ecc525663c0d.png)

使用 Immer 就像拥有一个私人助理。助手拿一封信（当前状态）并给您一份副本（草稿）以记录更改。完成后，助手将接受您的草稿并为您生成真正不变的最终字母（下一个状态）。

## 原理

mmer 的核心原理是利用 ES6 Proxy 来实现 Copy-on-Write (写时复制) 机制。

它让你以 “可变（Mutable）” 的语法（比如 state.count = 1）来操作数据，但最终自动生成一个 “不可变（Immutable）” 的新状态对象。

1. 核心流程：三态生命周期

Immer 的工作流程可以概括为三个阶段：

- Current State（当前状态）：作为输入传递给 Immer 的原始不可变对象。

- Draft State（草稿状态）：Immer 创建的一个 Proxy 代理对象。它看起来和 Current State 一模一样，但你可以随意修改它。

- Next State（下一个状态）：当你修改完 Draft 后，Immer 会根据你的修改记录，生成一个新的不可变对象。

### 步骤一：创建 Proxy（拦截修改）

Immer 不需要深拷贝整个对象（那样太慢了）。它只是创建了一层薄薄的 Proxy。

### 步骤二：生成最终状态 (Finalize)

当你结束修改后，Immer 会检查：

- 如果没修改过 (modified === false) -> 直接返回原始对象（结构共享）。

- 如果修改过 -> 返回那个副本 (copy)。

### 步骤三：结构共享 (Structural Sharing)

这是 Immer 高效的关键。没有被修改的节点，新旧对象会共享同一个引用。

## 使用 produce

Immer 包暴露了一个完成所有工作的默认函数。

```
produce(currentState, recipe: (draftState) => void): nextState
```

::: tip

请注意，`recipe` 函数通常不会返回任何内容。但是，如果您想用另一个对象完全替换 `draft`，则可以返回，

:::

## 柯里化 producers

将函数作为第一个参数传递给 `produce` 会创建一个函数，该函数尚未将 `produce` 应用于特定 state，而是创建一个函数，该函数将应用于将来传递给它的任何 state。这通常称为柯里化。举个例子：

```ts
import {produce} from "immer"

function toggleTodo(state, id) {
    return produce(state, draft => {
        const todo = draft.find(todo => todo.id === id)
        todo.done = !todo.done
    })
}

const baseState = [
    {
        id: "JavaScript",
        title: "Learn TypeScript",
        done: true
    },
    {
        id: "Immer",
        title: "Try Immer",
        done: false
    }
]

const nextState = toggleTodo(baseState, "Immer")
```

上面的 `toggleTodo` 模式非常典型；传递一个现有的 state 来 `produce`，修改 `draft`，然后返回结果。由于 `state` 除了将其传递给 `produce` 之外没有其他任何用途，因此可以通过使用 `produce` 的柯里化形式来简化上面的示例，其中您只传递 `produce` recipe 函数，并且 `produce` 将返回一个应用 recipe 到基础状态的新函数。这允许我们缩短上述 `toggleTodo` 定义。

```ts
import {produce} from "immer"

// curried producer:
const toggleTodo = produce((draft, id) => {
    const todo = draft.find(todo => todo.id === id)
    todo.done = !todo.done
})

const baseState = [
    /* as is */
]

const nextState = toggleTodo(baseState, "Immer")
```

请注意，`id` 参数现在已成为 recipe 函数的一部分！这种拥有 curried producers 的模式与 React 中的 `useState` Hook 非常巧妙地结合在一起

## React & Immer

useState` hook 假定存储在其中的任何 state 都被视为不可变的。使用 Immer 可以大大简化 React 组件状态的深度更新。下面的例子展示了如何使用 `produce` 和 `useState

```tsx
import React, { useCallback, useState } from "react";
import {produce} from "immer";

const TodoList = () => {
  const [todos, setTodos] = useState([
    {
      id: "React",
      title: "Learn React",
      done: true
    },
    {
      id: "Immer",
      title: "Try Immer",
      done: false
    }
  ]);

  const handleToggle = useCallback((id) => {
    setTodos(
      produce((draft) => {
        const todo = draft.find((todo) => todo.id === id);
        todo.done = !todo.done;
      })
    );
  }, []);

  const handleAdd = useCallback(() => {
    setTodos(
      produce((draft) => {
        draft.push({
          id: "todo_" + Math.random(),
          title: "A new todo",
          done: false
        });
      })
    );
  }, []);

  return (<div>{*/ See CodeSandbox */}</div>)
}
```

## useImmer

由于所有 state 的更新都使用 `produce` 包装的更新模式，所以我们可以通过将更新模式包装在 [use-immer](https://www.npmjs.com/package/use-immer) 包中来简化上述操作

```tsx
import React, { useCallback } from "react";
import { useImmer } from "use-immer";

const TodoList = () => {
  const [todos, setTodos] = useImmer([
    {
      id: "React",
      title: "Learn React",
      done: true
    },
    {
      id: "Immer",
      title: "Try Immer",
      done: false
    }
  ]);

  const handleToggle = useCallback((id) => {
    setTodos((draft) => {
      const todo = draft.find((todo) => todo.id === id);
      todo.done = !todo.done;
    });
  }, []);

  const handleAdd = useCallback(() => {
    setTodos((draft) => {
      draft.push({
        id: "todo_" + Math.random(),
        title: "A new todo",
        done: false
      });
    });
  }, []);

  // etc
```

## useReducer + Immer

```tsx
import React, {useCallback, useReducer} from "react"
import {produce} from "immer"

const TodoList = () => {
    const [todos, dispatch] = useReducer(
        produce((draft, action) => {
            switch (action.type) {
                case "toggle":
                    const todo = draft.find(todo => todo.id === action.id)
                    todo.done = !todo.done
                    break
                case "add":
                    draft.push({
                        id: action.id,
                        title: "A new todo",
                        done: false
                    })
                    break
                default:
                    break
            }
        }),
        [
            /* initial todos */
        ]
    )

    const handleToggle = useCallback(id => {
        dispatch({
            type: "toggle",
            id
        })
    }, [])

    const handleAdd = useCallback(() => {
        dispatch({
            type: "add",
            id: "todo_" + Math.random()
        })
    }, [])

    // etc
}
```

## useImmerReducer

同上，可以通过 use-immer 包中的 useImmerReducer 简化

```tsx
import React, { useCallback } from "react";
import { useImmerReducer } from "use-immer";

const TodoList = () => {
  const [todos, dispatch] = useImmerReducer(
    (draft, action) => {
      switch (action.type) {
        case "toggle":
          const todo = draft.find((todo) => todo.id === action.id);
          todo.done = !todo.done;
          break;
        case "add":
          draft.push({
            id: action.id,
            title: "A new todo",
            done: false
          });
          break;
        default:
          break;
      }
    },
    [ /* initial todos */ ]
  );

  //etc

```

