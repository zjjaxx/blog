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

