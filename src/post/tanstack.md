## TanStack Query简介

### 动机

大多数核心 Web 框架**并没有**提供一套统一的数据获取或更新方法。

TanStack Query 无疑是管理服务器状态的*最佳*库之一



### 默认配置

### **查询**

```tsx
import { useQuery } from '@tanstack/react-query'

function App() {
  const info = useQuery({ queryKey: ['todos'], queryFn: fetchTodoList })
}
```

**您提供的唯一密钥**在内部用于在整个应用程序内重新获取、缓存和共享您的查询。

。查询在任何给定时刻只能处于以下状态之一：

- isPending或status === 'pending' - 查询尚无数据
- isError或status === 'error' - 查询遇到错误
- isSuccess或status === 'success' - 查询成功且数据可用

除了这些主要状态之外，根据查询的状态，还可以获得更多信息：

- error - 如果查询处于isError状态，则可以通过error属性获取错误。
- data - 如果查询处于isSuccess状态，则可通过data属性获取数据。
- isFetching - 在任何状态下，如果查询正在随时获取（包括后台重新获取），则isFetching将为true。

对于**大多数**查询，通常检查isPending状态，然后检查isError状态，最后假设数据可用并呈现成功状态就足够了

```tsx
function Todos() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

  if (isPending) {
    return <span>Loading...</span>
  }

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  // We can assume by this point that `isSuccess === true`
  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

如果您不喜欢布尔值，您也可以使用状态：

```tsx
function Todos() {
  const { status, data, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

  if (status === 'pending') {
    return <span>Loading...</span>
  }

  if (status === 'error') {
    return <span>Error: {error.message}</span>
  }

  // also status === 'success', but "else" logic works, too
  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

#### [获取状态](https://tanstack.com/query/latest/docs/framework/react/guides/queries#fetchstatus)

除了状态字段之外，您还将获得一个额外的fetchStatus属性，其中包含以下选项：

- fetchStatus === 'fetching' - 查询当前正在获取。
- fetchStatus === 'paused' - 查询想要获取数据，但已暂停。请参阅[网络模式](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)指南，了解更多信息。
- fetchStatus === 'idle' - 查询目前没有执行任何操作。

#### **查询键**

TanStack Query 的核心是基于查询键来管理查询缓存。查询键必须是一个位于顶层的数组，可以简单到只有一个字符串的数组，也可以复杂到包含多个字符串和嵌套对象的数组。只要查询键可以使用JSON.stringify进行序列化，并且**对于查询的数据是唯一的**，就可以使用它！不同的 `queryKey`结构会被视为不同的查询，从而触发独立的缓存逻辑（如缓存隔离、重复请求判断等）

```tsx
// An individual todo
useQuery({ queryKey: ['todo', 5], ... })

// An individual todo in a "preview" format
useQuery({ queryKey: ['todo', 5, { preview: true }], ...})

// A list of todos that are "done"
useQuery({ queryKey: ['todos', { type: 'done' }], ... })
```

[如果您的查询函数依赖于变量，请将其包含在查询键中](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys#if-your-query-function-depends-on-a-variable-include-it-in-your-query-key)

```tsx
function Todos({ todoId }) {
  const result = useQuery({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodoById(todoId),
  })
}
```

请注意，查询键充当查询函数的依赖项。将依赖变量添加到查询键将确保查询被独立缓存，并且每当变量发生变化时，*查询都会自动重新获取*（取决于您的staleTime设置）

#### **查询函数**

查询函数实际上可以是任何**返回 Promise 的**函数。返回的 Promise 要么能够**解析数据**，要么**会抛出错误**。

```tsx
const { error } = useQuery({
  queryKey: ['todos', todoId],
  queryFn: async () => {
    if (somethingGoesWrong) {
      throw new Error('Oh no!')
    }
    if (somethingElseGoesWrong) {
      return Promise.reject(new Error('Oh no!'))
    }

    return data
  },
})
```

[查询函数变量](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions#query-function-variables)

查询键不仅用于唯一标识您正在获取的数据，还可以作为 QueryFunctionContext 的一部分方便地传递到查询函数中

```tsx
function Todos({ status, page }) {
  const result = useQuery({
    queryKey: ['todos', { status, page }],
    queryFn: fetchTodoList,
  })
}

// Access the key, status and page variables in your query function!
function fetchTodoList({ queryKey }) {
  const [_key, { status, page }] = queryKey
  return new Promise()
}
```

#### **查询选项**

在多个位置共享queryKey和queryFn并保持它们彼此位于同一位置的最佳方法之一是使用queryOptions辅助函数。在运行时，此辅助函数只会返回您传入的任何内容，但[与 TypeScript 一起](https://tanstack.com/query/latest/docs/framework/react/typescript#typing-query-options)使用时会有很多优势。您可以在一个地方定义查询的所有可能选项，并且所有选项都可以获得类型推断和类型安全。

```tsx
import { queryOptions } from '@tanstack/react-query'

function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}

// usage:

useQuery(groupOptions(1))
useSuspenseQuery(groupOptions(5))
useQueries({
  queries: [groupOptions(1), groupOptions(2)],
})
queryClient.prefetchQuery(groupOptions(23))
queryClient.setQueryData(groupOptions(42).queryKey, newGroups)
```

#### **网络模式**

TanStack Query 提供三种不同的网络模式，用于区分在没有网络连接时[查询](https://tanstack.com/query/latest/docs/framework/react/guides/queries)和[修改的](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)行为。您可以为每个查询/修改单独设置此模式，也可以通过查询/修改的默认值进行全局设置。

由于 TanStack Query 最常与数据抓取库结合使用来进行数据抓取，因此默认的网络模式为[online](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode#network-mode-online)。

##### [网络模式：online](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode#network-mode-online)

在此模式下，除非网络连接正常，否则查询和修改不会触发。这是默认模式。如果为查询发起了获取操作，并且由于没有网络连接而无法获取数据，则该查询将始终保持当前状态（pending、error、success ）。但是，会额外暴露一个[fetchStatus](https://tanstack.com/query/latest/docs/framework/react/guides/queries#fetchstatus)属性。该属性可以是：

- fetching：queryFn正在真正执行 - 请求正在进行中。
- paused：查询未执行 - 它暂停，直到您再次建立连接
- idle：查询未获取且未暂停

::: tip

如果查询由于您在线而运行，但在执行过程中您离线，TanStack Query 也会暂停重试机制。暂停的查询会在您重新获得网络连接后继续运行。这与refetchOnReconnect无关（在此模式下，它也默认为true），因为它不是refetch，而是continue。如果查询在此期间被[取消](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)，它将不会继续运行。

:::

##### [网络模式：always](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode#network-mode-always)

在此模式下，TanStack Query 将始终获取数据并忽略在线/离线状态。如果您在不需要活动网络连接即可运行查询的环境中（例如，如果您只是从AsyncStorage读取数据，或者只想从queryFn返回Promise.resolve(5) ），则可能需要选择此模式。

- 查询永远不会因为没有网络连接而暂停。
- 重试也不会暂停 -如果失败，您的查询将进入错误状态。
- 在此模式下， refetchOnReconnect默认为false，因为重新连接到网络不再是一个需要重新获取过时查询的良好指示。您仍然可以根据需要启用此功能

##### [网络模式：offlineFirst](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode#network-mode-offlinefirst)

此模式介于前两种方案之间，TanStack Query 会运行一次queryFn，然后暂停重试。如果您有一个 serviceWorker 会拦截缓存请求（例如在[离线优先的 PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers)中），或者您通过[Cache-Control 标头](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#the_cache-control_header)使用 HTTP 缓存，那么这种模式会非常方便。

在这些情况下，第一次获取可能会成功，因为它来自离线存储/缓存。但是，如果发生缓存未命中，网络请求将会失败，在这种情况下，此模式的行为类似于在线查询 - 暂停重试。

#### **并行查询**

“并行”查询是并行执行的查询，或者同时执行的查询，以最大限度地提高并发性。

##### [手动并行查询](https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries#manual-parallel-queries)

当并行查询数量不变时，无需**额外投入**即可使用并行查询。只需并排使用任意数量的 TanStack Query 的useQuery和useInfiniteQuery钩子即可！

```tsx
function App () {
  // The following queries will execute in parallel
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  ...
}
```

##### [使用useQueries进行动态并行查询](https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries#dynamic-parallel-queries-with-usequeries)

如果您需要执行的查询数量在不同渲染之间发生变化，则不能使用手动查询，因为这会违反钩子的规则。TanStack Query 提供了一个useQueries钩子，您可以使用它来动态地并行执行任意数量的查询。

useQueries接受一个**options 对象**，该对象带有一个**查询键**，其值是一个**查询对象数组**。它返回一个**查询结果数组**：

```tsx
function App({ users }) {
  const userQueries = useQueries({
    queries: users.map((user) => {
      return {
        queryKey: ['user', user.id],
        queryFn: () => fetchUserById(user.id),
      }
    }),
  })
}
```

#### [useQuery 依赖查询](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries#usequery-dependent-query)

依赖（或串行）查询依赖于先前的查询完成才能执行。要实现这一点，只需使用enabled选项来告诉查询何时可以运行即可：

```tsx
// Get the user
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

const userId = user?.id

// Then get the user's projects
const {
  status,
  fetchStatus,
  data: projects,
} = useQuery({
  queryKey: ['projects', userId],
  queryFn: getProjectsByUser,
  // The query will not execute until the userId exists
  enabled: !!userId,
})
```

##### [useQueries 依赖查询](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries#usequeries-dependent-query)

动态并行查询 - useQueries也可以依赖于前一个查询，实现方法如下：

```tsx
// Get the users ids
const { data: userIds } = useQuery({
  queryKey: ['users'],
  queryFn: getUsersData,
  select: (users) => users.map((user) => user.id),
})

// Then get the users messages
const usersMessages = useQueries({
  queries: userIds
    ? userIds.map((id) => {
        return {
          queryKey: ['messages', id],
          queryFn: () => getMessagesByUsers(id),
        }
      })
    : [], // if userIds is undefined, an empty array will be returned
})
```

#### **窗口焦点重新获取**

::: tip

**数据不再“新鲜”（Stale）**：查询的数据已超过 `staleTime`（默认 `0ms`，即数据一旦被缓存就立即标记为“陈旧”）。

:::

如果用户离开您的应用程序后再次返回，且查询数据已过期，**TanStack Query 会自动在后台为您请求新数据。您可以使用**refetchOnWindowFocus选项全局或针对每个查询禁用此功能：

```tsx
//
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
    },
  },
})

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

[禁用每个查询](https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching#disabling-per-query)

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: false,
})
```

#### **禁用/暂停查询**

如果您想禁用查询的自动运行，可以使用enabled = false选项。enabled 选项也接受一个返回布尔值的回调函数。

当enabled为false时：

- 如果查询有缓存数据，那么查询将在status ==='success'或isSuccess状态下初始化。
- 如果查询没有缓存数据，那么查询将在status === 'pending'和fetchStatus === 'idle'状态下启动。
- 查询不会在装载时自动获取。
- 查询不会在后台自动重新获取。
- 该查询将忽略通常会导致查询重新获取的查询客户端invalidateQueries和refetchQueries调用。
- useQuery返回的refetch可用于手动触发 fetch 查询。但是，它不适用于skipToken。

```tsx
function Todos() {
  const { isLoading, isError, data, error, refetch, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false,
  })

  return (
    <div>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {data ? (
        <>
          <ul>
            {data.map((todo) => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>
        </>
      ) : isError ? (
        <span>Error: {error.message}</span>
      ) : isLoading ? (
        <span>Loading...</span>
      ) : (
        <span>Not ready ...</span>
      )}

      <div>{isFetching ? 'Fetching...' : null}</div>
    </div>
  )
}
```

永久禁用查询会让您无法使用 TanStack Query 提供的许多优秀功能（例如后台重新获取），而且这也不是惯用的方式。它会让您从声明式方法（在查询运行时定义依赖项）转变为命令式模式（每当我单击此处时都会获取）。而且，它也无法向refetch传递参数。通常，您需要的只是一个延迟初始获取的惰性查询：

##### [惰性查询](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries#lazy-queries)

enabled 选项不仅可以用于永久禁用查询，还可以用于稍后启用/禁用查询。一个很好的例子是一个过滤表单，你只想在用户输入过滤值后触发第一个请求：

```tsx
function Todos() {
  const [filter, setFilter] = React.useState('')

  const { data } = useQuery({
    queryKey: ['todos', filter],
    queryFn: () => fetchTodos(filter),
    // ⬇️ disabled as long as the filter is empty
    enabled: !!filter,
  })

  return (
    <div>
      // 🚀 applying the filter will enable and execute the query
      <FiltersForm onApply={setFilter} />
      {data && <TodosTable data={data} />}
    </div>
  )
}
```

##### [使用skipToken来类型安全地禁用查询](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries#typesafe-disabling-of-queries-using-skiptoken)

如果您使用的是 TypeScript，则可以使用skipToken禁用查询。当您想根据条件禁用查询，但仍希望保持查询类型安全时，此功能非常有用。

```tsx
import { skipToken, useQuery } from '@tanstack/react-query'

function Todos() {
  const [filter, setFilter] = React.useState<string | undefined>()

  const { data } = useQuery({
    queryKey: ['todos', filter],
    // ⬇️ disabled as long as the filter is undefined or empty
    queryFn: filter ? () => fetchTodos(filter) : skipToken,
  })

  return (
    <div>
      // 🚀 applying the filter will enable and execute the query
      <FiltersForm onApply={setFilter} />
      {data && <TodosTable data={data} />}
    </div>
  )
}
```

#### **查询重试**

当useQuery查询失败（查询函数抛出错误）时，如果该查询的请求未达到最大连续重试次数（默认为3），或者提供了函数来确定是否允许重试，则 TanStack Query 将自动重试该查询。

您可以在全局级别和单个查询级别配置重试。

- 设置retry = false将禁用重试。
- 设置retry = 6将重试失败的请求 6 次，然后显示函数抛出的最终错误。
- 设置retry = true将无限次重试失败的请求。
- 设置retry = (failureCount, error) => ...允许根据请求失败的原因自定义逻辑。

```tsx
import { useQuery } from '@tanstack/react-query'

// Make a specific query retry a certain number of times
const result = useQuery({
  queryKey: ['todos', 1],
  queryFn: fetchTodoListPage,
  retry: 10, // Will retry failed requests 10 times before displaying an error
})
```

#### [重试延迟](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries#retry-delay)

默认情况下，TanStack Query 中的重试不会在请求失败后立即进行。按照标准，每次重试都会逐渐应用退避延迟。

默认的retryDelay设置为每次尝试加倍（从1000毫秒开始），但不超过 30 秒：

```tsx
// Configure for all queries
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

#### **分页/滞后查询**

渲染分页数据是一种非常常见的 UI 模式，在 TanStack Query 中，它通过在查询键中包含页面信息就可以“正常工作”：

```tsx
const result = useQuery({
  queryKey: ['projects', page],
  queryFn: fetchProjects,
})
```

##### [使用placeholderData实现更好的分页查询](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries#better-paginated-queries-with-placeholderdata)

#### **初始查询数据**

有时，您的应用中可能已经准备好查询的初始数据，可以直接将其提供给查询。在这种情况下，您可以使用config.initialData选项设置查询的初始数据，从而跳过初始加载状态！

```tsx
const result = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
})
```

### **突变**

与查询不同，突变通常用于创建/更新/删除数据或执行服务器副作用。为此，TanStack Query 导出了一个useMutation钩子。

```tsx
function App() {
  const mutation = useMutation({
    mutationFn: (newTodo) => {
      return axios.post('/todos', newTodo)
    },
  })

  return (
    <div>
      {mutation.isPending ? (
        'Adding todo...'
      ) : (
        <>
          {mutation.isError ? (
            <div>An error occurred: {mutation.error.message}</div>
          ) : null}

          {mutation.isSuccess ? <div>Todo added!</div> : null}

          <button
            onClick={() => {
              mutation.mutate({ id: new Date(), title: 'Do Laundry' })
            }}
          >
            Create Todo
          </button>
        </>
      )}
    </div>
  )
}
```

在任何给定时刻，突变只能处于以下状态之一：

- isIdle或status === 'idle' - 突变当前处于空闲状态或处于刷新/重置状态
- isPending或status === 'pending' - 突变目前正在运行
- isError或status === 'error' - 突变遇到错误
- isSuccess或status === 'success' - 突变成功且突变数据可用

即使只是变量，突变也并不是那么特殊，但是当与onSuccess选项、[查询客户端的invalidateQueries方法](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientinvalidatequeries)和[查询客户端的setQueryData方法](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientsetquerydata)一起使用时，突变就成为非常强大的工具。

#### [重置突变状态](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#resetting-mutation-state)

有时你需要清除突变请求的错误或数据。为此，你可以使用reset函数来处理：

```tsx
const CreateTodo = () => {
  const [title, setTitle] = useState('')
  const mutation = useMutation({ mutationFn: createTodo })

  const onCreateTodo = (e) => {
    e.preventDefault()
    mutation.mutate({ title })
  }

  return (
    <form onSubmit={onCreateTodo}>
      {mutation.error && (
        <h5 onClick={() => mutation.reset()}>{mutation.error}</h5>
      )}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <br />
      <button type="submit">Create Todo</button>
    </form>
  )
}
```

#### [突变的副作用](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#mutation-side-effects)

useMutation附带一些辅助选项，允许在突变生命周期的任何阶段快速轻松地产生副作用。

```tsx
useMutation({
  mutationFn: addTodo,
  onMutate: (variables) => {
    // A mutation is about to happen!

    // Optionally return a context containing data to use when for example rolling back
    return { id: 1 }
  },
  onError: (error, variables, context) => {
    // An error happened!
    console.log(`rolling back optimistic update with id ${context.id}`)
  },
  onSuccess: (data, variables, context) => {
    // Boom baby!
  },
  onSettled: (data, error, variables, context) => {
    // Error or success... doesn't matter!
  },
})
```

您可能会发现，除了在useMutation中定义的回调之外，调用mutate时还需要**触发其他回调**

```tsx
useMutation({
  mutationFn: addTodo,
  onSuccess: (data, variables, context) => {
    // I will fire first
  },
  onError: (error, variables, context) => {
    // I will fire first
  },
  onSettled: (data, error, variables, context) => {
    // I will fire first
  },
})

mutate(todo, {
  onSuccess: (data, variables, context) => {
    // I will fire second!
  },
  onError: (error, variables, context) => {
    // I will fire second!
  },
  onSettled: (data, error, variables, context) => {
    // I will fire second!
  },
})
```

#### [连续突变](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#consecutive-mutations)

对于连续的突变，处理onSuccess、onError和onSettled回调略有不同。当传递给mutate函数时，它们只会在组件仍然挂载的情况下触发*一次*。这是因为每次调用mutate函数时，突变观察者都会被移除并重新订阅。相反，useMutation处理程序会在每次mutate调用时执行。

```tsx
useMutation({
  mutationFn: addTodo,
  onSuccess: (data, variables, context) => {
    // Will be called 3 times
  },
})

const todos = ['Todo 1', 'Todo 2', 'Todo 3']
todos.forEach((todo) => {
  mutate(todo, {
    onSuccess: (data, variables, context) => {
      // Will execute only once, for the last mutation (Todo 3),
      // regardless which mutation resolves first
    },
  })
})
```

#### promise

使用mutateAsync而不是mutate来获取一个在成功时解析，或在错误时抛出的 Promise。例如，这可以用来组合副作用。

```tsx
const mutation = useMutation({ mutationFn: addTodo })

try {
  const todo = await mutation.mutateAsync(todo)
  console.log(todo)
} catch (error) {
  console.error(error)
} finally {
  console.log('done')
}
```

#### [重试](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#retry)

默认情况下，TanStack Query 不会在发生错误时重试突变，但可以使用重试选项：

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  retry: 3,
})
```

#### [突变范围](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#mutation-scopes)

默认情况下，所有突变都会并行运行 - 即使您多次调用同一突变的.mutate()函数。为了避免这种情况，可以给突变指定一个带有ID的作用域。所有具有相同scope.id 的突变都将串行运行，这意味着当它们被触发时，如果该作用域中已有突变正在进行，它们将以isPaused: true状态启动。它们将被放入队列，并在队列时间到后自动恢复。

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  scope: {
    id: 'todo',
  },
})
```

### **查询无效**

等待查询过期后再重新获取并不总是有效，尤其是当您确定查询的数据由于用户操作而过期时。为此，QueryClient提供了一个invalidateQueries方法，允许您智能地将查询标记为过期，并可能重新获取它们！

```tsx
// Invalidate every query in the cache
queryClient.invalidateQueries()
// Invalidate every query with a key that starts with `todos`
queryClient.invalidateQueries({ queryKey: ['todos'] })
```

当使用invalidateQueries使查询无效时，会发生两件事：

- 它被标记为过期。此过期状态将覆盖useQuery或相关钩子中使用的任何staleTime配置
- 如果查询当前正在通过useQuery或相关钩子进行渲染，它也将在后台重新获取

#### [使用invalidateQueries进行查询匹配](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation#query-matching-with-invalidatequeries)

使用invalidateQueries和removeQueries等 API （以及其他支持部分查询匹配的 API）时，您可以根据前缀匹配多个查询，也可以更具体地匹配一个精确的查询

```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Get QueryClient from the context
const queryClient = useQueryClient()

queryClient.invalidateQueries({ queryKey: ['todos'] })

// Both queries below will be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})
const todoListQuery = useQuery({
  queryKey: ['todos', { page: 1 }],
  queryFn: fetchTodoList,
})
```

您甚至可以通过将更具体的查询键传递给invalidateQueries方法来使具有特定变量的查询无效

```tsx
queryClient.invalidateQueries({
  queryKey: ['todos', { type: 'done' }],
})

// The query below will be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos', { type: 'done' }],
  queryFn: fetchTodoList,
})

// However, the following query below will NOT be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})
```

invalidateQueries API 非常灵活，因此即使您只想使**没有**任何变量或子键的 todos 查询无效，您也可以将exact : true选项传递给invalidateQueries方法：

```tsx
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: true,
})

// The query below will be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})

// However, the following query below will NOT be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos', { type: 'done' }],
  queryFn: fetchTodoList,
})
```

如果你想要**更**精细的查询，可以将谓词函数传递给invalidateQueries方法。此函数将从查询缓存中接收每个Query实例，并允许你返回true或false来表示是否要使该查询无效：

```tsx
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' && query.queryKey[1]?.version >= 10,
})

// The query below will be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos', { version: 20 }],
  queryFn: fetchTodoList,
})

// The query below will be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos', { version: 10 }],
  queryFn: fetchTodoList,
})

// However, the following query below will NOT be invalidated
const todoListQuery = useQuery({
  queryKey: ['todos', { version: 5 }],
  queryFn: fetchTodoList,
})
```

#### **突变导致的无效**

使查询无效只是成功的一半。知道**何时**使它们无效是另一半。通常，当应用中的某个变更成功时，很可能应用中有相关的查询需要被无效，并且可能需要重新获取，以适应该变更带来的新变化

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// When this mutation succeeds, invalidate any queries with the `todos` or `reminders` query key
const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: async () => {
    // If you're invalidating a single query
    await queryClient.invalidateQueries({ queryKey: ['todos'] })

    // If you're invalidating multiple queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['todos'] }),
      queryClient.invalidateQueries({ queryKey: ['reminders'] }),
    ])
  },
})
```

#### **突变反应的更新**

在处理**更新**服务器上对象的突变时，通常会在突变的响应中自动返回新对象。我们无需重新获取该项目的任何查询并浪费对已有数据的网络调用，而是可以利用突变函数返回的对象，并使用[查询客户端的setQueryData](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientsetquerydata)方法立即用新数据更新现有查询：

```tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: editTodo,
  onSuccess: (data) => {
    queryClient.setQueryData(['todo', { id: 5 }], data)
  },
})

mutation.mutate({
  id: 5,
  name: 'Do the laundry',
})

// The query below will be updated with the response from the
// successful mutation
const { status, data, error } = useQuery({
  queryKey: ['todo', { id: 5 }],
  queryFn: fetchTodoById,
})
```

### **乐观更新**

React Query 提供了两种在突变完成之前乐观地更新 UI 的方法。你可以使用onMutate选项直接更新缓存，也可以利用useMutation结果返回的变量来更新 UI 。

```tsx
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  // make sure to _return_ the Promise from the query invalidation
  // so that the mutation stays in `pending` state until the refetch is finished
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

const { isPending, submittedAt, variables, mutate, isError } = addTodoMutation
```

然后，您将可以访问addTodoMutation.variables，其中包含已添加的待办事项。在呈现查询的 UI 列表中，您可以在突变处于待处理状态时将另一项附加到列表中：

```tsx
<ul>
  {todoQuery.items.map((todo) => (
    <li key={todo.id}>{todo.text}</li>
  ))}
  {isPending && <li style={{ opacity: 0.5 }}>{variables}</li>}
</ul>
```

只要突变尚未完成，我们就会渲染一个具有不同不透明度的临时项。突变完成后，该项将自动不再渲染。鉴于重新获取成功，我们应该在列表中看到该项作为“普通项”。

如果突变发生错误，该项目也会消失。但是，如果我们愿意，可以通过检查突变的isError状态来继续显示它。突变发生错误时，变量不会*被*清除，因此我们仍然可以访问它们，甚至可以显示一个重试按钮：

```tsx
{
  isError && (
    <li style={{ color: 'red' }}>
      {variables}
      <button onClick={() => mutate(variables)}>Retry</button>
    </li>
  )
}
```

#### [如果突变和查询不存在于同一个组件中](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates#if-the-mutation-and-the-query-dont-live-in-the-same-component)

如果突变和查询位于同一组件中，则此方法非常有效。但是，您也可以通过专用的useMutationState钩子访问其他组件中的所有突变。最好将其与mutationKey结合使用：

```TSX
// somewhere in your app
const { mutate } = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  mutationKey: ['addTodo'],
})

// access variables somewhere else
const variables = useMutationState<string>({
  filters: { mutationKey: ['addTodo'], status: 'pending' },
  select: (mutation) => mutation.state.variables,
})
```

变量将是一个数组，因为可能同时运行多个突变。如果我们需要每个项目的唯一键，我们也可以选择mutation.state.submittedAt。这甚至可以轻松显示并发乐观更新。

#### [通过缓存](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates#via-the-cache)

如果您在执行变更之前乐观地更新状态，则变更可能会失败。在大多数此类失败情况下，您可以触发乐观查询的重新获取，将其恢复到其真实的服务器状态。但在某些情况下，重新获取可能无法正常工作，并且变更错误可能表示某种类型的服务器问题，导致无法重新获取。在这种情况下，您可以选择回滚更新。

```tsx
const queryClient = useQueryClient()

useMutation({
  mutationFn: updateTodo,
  // When mutate is called:
  onMutate: async (newTodo) => {
    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // Snapshot the previous value
    const previousTodos = queryClient.getQueryData(['todos'])

    // Optimistically update to the new value
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])

    // Return a context object with the snapshotted value
    return { previousTodos }
  },
  // If the mutation fails,
  // use the context returned from onMutate to roll back
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  // Always refetch after error or success:
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

### **查询取消**

#### [默认行为](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation#default-behavior)

默认情况下，在 promise 解析之前卸载或变为未使用的查询*不会*被取消。这意味着，在 promise 解析之后，生成的数据将在缓存中可用。如果您已开始接收查询，但在查询完成之前卸载了组件，这将非常有用。如果您再次挂载组件，并且查询尚未被垃圾回收，则数据将可用。

但是，如果你使用了AbortSignal，Promise 将被取消（例如中止获取数据），因此查询也必须被取消。取消查询将导致其状态*恢复*到之前的状态。

#### [使用fetch在组件卸载后取消请求](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation#using-fetch)

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: async ({ signal }) => {
    const todosResponse = await fetch('/todos', {
      // Pass the signal to one fetch
      signal,
    })
    const todos = await todosResponse.json()

    const todoDetails = todos.map(async ({ details }) => {
      const response = await fetch(details, {
        // Or pass it to several
        signal,
      })
      return response.json()
    })

    return Promise.all(todoDetails)
  },
})
```

#### [使用axios在组件卸载后取消请求 ](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation#using-axios-v0220)

```tsx
import axios from 'axios'

const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) =>
    axios.get('/todos', {
      // Pass the signal to `axios`
      signal,
    }),
})
```

#### [使用XMLHttpRequest在组件卸载后取消请求](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation#using-xmlhttprequest)

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    return new Promise((resolve, reject) => {
      var oReq = new XMLHttpRequest()
      oReq.addEventListener('load', () => {
        resolve(JSON.parse(oReq.responseText))
      })
      signal?.addEventListener('abort', () => {
        oReq.abort()
        reject()
      })
      oReq.open('GET', '/todos')
      oReq.send()
    })
  },
})
```

### 滚动恢复

传统上，当您在 Web 浏览器中导航到之前访问过的页面时，您会发现该页面会滚动到您离开之前所在的准确位置。这被称为**滚动恢复**，自从 Web 应用程序开始转向客户端数据获取以来，这种功能有所退化。然而，有了 TanStack Query，这种情况就不再存在了。

TanStack Query 中所有查询（包括分页查询和无限查询）的“滚动恢复”功能开箱即用，Just Works™️。这是因为查询结果会被缓存，并能够在查询渲染时同步检索。只要您的查询缓存时间足够长（默认时间为 5 分钟）且未被垃圾回收，滚动恢复功能即可始终有效。

### **缓存**

假设我们使用默认的gcTime为**5 分钟**，默认的staleTime为0。

- 挂载一个

  useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

  的新实例。

  - 由于没有使用['todos']查询键进行其他查询，因此此查询将显示硬加载状态并发出网络请求以获取数据。
  - 当网络请求完成后，返回的数据将缓存在['todos']键下。
  - 该钩子将在配置的staleTime之后将数据标记为陈旧（默认为0，或立即）。

- useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

  的第二个实例安装在其他地方。

  - 由于缓存中已经具有第一个查询中['todos']键的数据，因此该数据会立即从缓存中返回。
  - 新实例使用其查询功能触发新的网络请求。
    - 请注意，无论两个fetchTodos查询函数是否相同，两个查询的[状态](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)都会更新（包括isFetching、isPending和其他相关值），因为它们具有相同的查询键。
  - 当请求成功完成时， ['todos']键下的缓存数据将使用新数据进行更新，并且两个实例都将使用新数据进行更新。

- useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

  查询的两个实例均已卸载且不再使用。

  - 由于此查询不再有活动实例，因此使用gcTime设置垃圾收集超时来删除和垃圾收集查询（默认为**5 分钟**）。

- 在缓存超时完成之前，另一个useQuery({ queryKey: ['todos'], queryFn: fetchTodos })实例挂载。在fetchTodos函数在后台运行时，该查询会立即返回可用的缓存数据。成功完成后，它将使用新数据填充缓存。

- useQuery({ queryKey: ['todos'], queryFn: fetchTodos })的最后一个实例被卸载。

- **5 分钟**内不再出现useQuery({ queryKey: ['todos'], queryFn: fetchTodos })的实例。['todos']键下的缓存数据将被删除并被垃圾收集。

## TanStack Router简介

**anStack Router 是一个用于构建 React 和 Solid 应用程序的路由器**。其功能包括：

- 100% 推断 TypeScript 支持
- 类型安全导航
- 嵌套路由和布局路由（无路径布局）
- 内置路由加载器，带 SWR 缓存
- 专为客户端数据缓存（TanStack Query、SWR 等）设计
- 自动路由预取
- 异步路由元素和错误边界
- 基于文件的路线生成
- Typesafe JSON-first 搜索参数状态管理 API
- 路径和搜索参数架构验证
- 搜索参数导航 API
- 自定义搜索参数解析器/序列化器支持
- 搜索参数中间件
- 路由匹配/加载中间件

### 路由

#### [索引路由](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#index-routes)

**当索引路由完全匹配且没有子路由匹配时，**索引路由会专门针对其父路由。

让我们看一下/posts URL 的索引路由：

```tsx
// posts.index.tsx
import { createFileRoute } from '@tanstack/react-router'

// Note the trailing slash, which is used to target index routes
export const Route = createFileRoute('/posts/')({
  component: PostsIndexComponent,
})

function PostsIndexComponent() {
  return <div>Please select a post!</div>
}
```

当 URL 正好是/posts时，将匹配此路由。

#### [动态路由](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#dynamic-route-segments)

以$开头，后跟标签的路由路径段是动态的，会将 URL 的该部分捕获到params对象中，以便在应用程序中使用。例如，路径名/posts/123将匹配/posts/$postId路由，而params对象将是{ postId: '123' }。

这些参数随后便可在路由的配置和组件中使用！我们来看一个posts.$postId.tsx路由：

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  // In a loader
  loader: ({ params }) => fetchPost(params.postId),
  // Or in a component
  component: PostComponent,
})

function PostComponent() {
  // In a component!
  const { postId } = Route.useParams()
  return <div>Post ID: {postId}</div>
}
```

::: tip

当路由被激活（如用户访问 `/posts/123`）时，`loader`会**自动执行**，并根据路由参数（如 `postId`）从服务端或本地获取数据。数据加载完成后，会被缓存并传递给路由对应的组件，确保组件渲染时数据已就绪。

:::

#### [可选路径参数](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#optional-path-parameters)

可选路径参数允许您定义 URL 中可能存在或不存在的路由段。它们使用{-$paramName}语法，并提供灵活的路由模式，其中某些参数是可选的。

```tsx
// posts.{-$category}.tsx - Optional category parameter
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/{-$category}')({
  component: PostsComponent,
})

function PostsComponent() {
  const { category } = Route.useParams()

  return <div>{category ? `Posts in ${category}` : 'All Posts'}</div>
}
```

此路由将匹配/posts（类别为undefined）和/posts/tech（类别为"tech"）。

#### 布局路由

布局路由用于将子路由与附加组件和逻辑包裹在一起。它们的作用如下：

- 使用布局组件包装子路由
- 在显示任何子路由之前强制执行加载器要求
- 验证并提供搜索参数给子路由
- 为子路由的错误组件或待处理元素提供回退
- 为所有子路由提供共享上下文

```tsx
routes/
├── app.tsx
├── app.dashboard.tsx
├── app.settings.tsx
```

在上面的树中，app.tsx是一个布局路由，它包装了两个子路由，app.dashboard.tsx和app.settings.tsx。

#### 无路径布局路由

[与布局路由](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#layout-routes)类似，无路径布局路由用于在子路由中添加额外的组件和逻辑。然而，无路径布局路由不需要 URL 中匹配路径，而是用于在子路由中添加额外的组件和逻辑，而无需URL 中匹配路径。

无路径布局路线以下划线（_）为前缀，表示它们是“无路径的”。

但是，与布局路由不同，由于无路径布局路由确实基于 URL 路径段进行匹配，这意味着这些路由不支持[动态路由段](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#dynamic-route-segments)作为其路径的一部分，因此无法在 URL 中匹配。
