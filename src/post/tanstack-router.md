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

由于 TanStack Router 支持混合平面和目录路由，您还可以使用目录内的布局路由来表达应用程序的路由：

```tsx
routes/
├── app/
│   ├── route.tsx
│   ├── dashboard.tsx
│   ├── settings.tsx
```

在此嵌套树中，app/route.tsx文件是布局路由的配置，它包装了两个子路由，app/dashboard.tsx和app/settings.tsx。

#### 无路径布局路由

[与布局路由](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#layout-routes)类似，无路径布局路由用于在子路由中添加额外的组件和逻辑。然而，无路径布局路由不需要 URL 中匹配路径，而是用于在子路由中添加额外的组件和逻辑，而无需URL 中匹配路径。

无路径布局路线以下划线（_）为前缀，表示它们是“无路径的”。

::: tip

但是，与布局路由不同，由于无路径布局路由确实基于 URL 路径段进行匹配，这意味着这些路由不支持[动态路由段](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#dynamic-route-segments)作为其路径的一部分，因此无法在 URL 中匹配。

:::

让我们看一个名为_pathlessLayout.tsx的示例路线：

```tsx
routes/
├── _pathlessLayout/
│   ├── route.tsx
│   ├── a.tsx
│   ├── b.tsx
```

#### [非嵌套路由](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#non-nested-routes)

可以通过在父文件路由段后添加_来创建非嵌套路由，并用于从其父级中**取消嵌套**路由并呈现其自己的组件树。

```tsx
routes/
├── posts.tsx
├── posts.$postId.tsx
├── posts_.$postId.edit.tsx
```

#### [无路径路由组目录](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#pathless-route-group-directories)

无路径路由组目录使用()将路由文件分组，无论其路径如何。它们纯粹是为了组织，不会以任何方式影响路由树或组件树。

```tsx
routes/
├── index.tsx
├── (app)/
│   ├── dashboard.tsx
│   ├── settings.tsx
│   ├── users.tsx
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
```

在上面的示例中，app和auth目录纯粹是为了组织，不会以任何方式影响路由树或组件树。它们用于将相关路由分组，以便于导航和组织。

### 路由树

TanStack 路由器使用嵌套路由树将 URL 与要渲染的正确组件树进行匹配。

为了构建路由树，TanStack 路由器支持：

- [基于文件的路由](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
- [基于代码的路由](https://tanstack.com/router/latest/docs/framework/react/routing/code-based-routing)

两种方法都支持完全相同的核心特性和功能，但**基于文件的路由需要更少的代码即可获得相同或更好的结果**。因此，**基于文件的路由是配置 TanStack 路由器的首选和推荐方法**。大多数文档都是从基于文件的路由的角度编写的。

#### **基于文件的路由**

基于文件的路由是一种使用文件系统配置路由的方法。您无需通过代码定义路由结构，而是可以使用一系列代表应用程序路由层次结构的文件和目录来定义路由。这带来了许多好处：

- **简单性**：基于文件的路由在视觉上直观且易于新手和有经验的开发人员理解。
- **组织**：路由的组织方式反映了应用程序的 URL 结构。
- **可扩展性**：随着应用程序的增长，基于文件的路由可以轻松添加新路由和维护现有路由。
- **代码分割**：基于文件的路由允许 TanStack 路由器自动对您的路由进行代码分割，以获得更好的性能。
- **类型安全**：基于文件的路由通过为您的路由生成管理类型链接来提高类型安全的上限，否则通过基于代码的路由可能会是一个繁琐的过程。
- **一致性**：基于文件的路由强制执行路由的一致结构，从而更容易维护和更新应用程序以及从一个项目移动到另一个项目。

###### [目录路由](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing#directory-routes)



##### **文件命名约定**

| 特征                         | 描述                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| **__root.tsx**               | 根路由文件必须命名为__root.tsx并且必须放在配置的routesDirectory的根目录中。 |
| **.分隔符**                  | 路由可以使用.字符来表示嵌套路由。例如，blog.post将会作为blog的子路由生成。 |
| **$代币**                    | 带有$标记的路由段被参数化，并将从 URL 路径名中提取值作为路由参数。 |
| **_前缀**                    | 带有_前缀的路由段被视为无路径布局路由，在将其子路由与 URL 路径名匹配时不会使用。 |
| **_后缀**                    | 带有_后缀的路由段会排除该路由嵌套在任何父路由之下。          |
| **-前缀**                    | 带有-前缀的文件和文件夹将被排除在路由树之外。它们不会被添加到routeTree.gen.ts文件中，但可用于将逻辑并入路由文件夹中。 |
| **（文件夹）文件夹名称模式** | 与该模式匹配的文件夹将被视为**路由组**，从而防止该文件夹被包含在路由的 URL 路径中。 |
| **[x]转义**                  | 方括号用于转义文件名中原本具有路由含义的特殊字符。例如，script[.]js.tsx会转义为/script.js，api[.]v1.tsx会转义为/api.v1。 |
| **索引令牌**                 | 当 URL 路径名与父路由完全匹配时，以索引标记（在任何文件扩展名之前）结尾的路由段将匹配父路由。这可以通过indexToken配置选项进行配置，请参阅[options](https://tanstack.com/router/latest/docs/api/file-based-routing#indextoken)。 |
| **.route.tsx文件类型**       | 使用目录组织路由时，可以使用路由后缀在目录路径下创建路由文件。例如，blog.post.route.tsx或blog/post/route.tsx可以用作/blog/post路由的路由文件。这可以通过routeToken配置选项进行配置，请参阅[options](https://tanstack.com/router/latest/docs/api/file-based-routing#routetoken)。 |

### **创建路由器**

:::

可以通过配置这几个组件让全局通用

:::

当您准备开始使用路由器时，您需要创建一个新的路由器实例。路由器实例是 TanStack 路由器的核心，负责管理路由树、匹配路由以及协调导航和路由转换。它也是配置路由器范围设置的地方。

```tsx
import { createRouter } from '@tanstack/react-router'

const router = createRouter({
  // ...
})
declare module '@tanstack/react-router' {
  interface Register {
    // This infers the type of our router and registers it across your entire project
    router: typeof router
  }
}
```

#### [404 未找到路由](https://tanstack.com/router/latest/docs/framework/react/guide/creating-a-router#404-not-found-route)

如果您使用基于文件或基于代码的路由，则需要向createRootRoute添加notFoundComponent键：

````tsx
export const Route = createRootRoute({
  component: () => (
    // ...
  ),
  notFoundComponent: () => <div>404 Not Found</div>,
});
````

#### 加载中状态组件

defaultPendingComponent

#### 异常组件

defaultErrorComponent

### Outlet

Outlet组件用于渲染下一个可能匹配的子路由。

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div>
      <h1>My App</h1>
      <Outlet /> {/* This is where child routes will render */}
    </div>
  )
}
```

### **导航**

TanStack Router 在每次导航中都会牢记相对导航这一不变的概念，因此您会在 API 中不断看到两个属性：

- from - 原始路线路径
- to - 目标路由路径

::: tip

⚠️ 如果没有提供*from路由路径，路由器会默认你从根**/*路由开始导航，并且只自动补全绝对路径。毕竟，你需要知道你来自哪里，才能知道你要去哪里 😉。

:::



每个路由对象都有一个*to*属性，可以用作任何导航或路由匹配 API 的*to*。如果可能的话，这将允许你避免使用纯字符串，而使用类型安全的路由引用：

```tsx
import { Route as aboutRoute } from './routes/about.tsx'

function Comp() {
  return <Link to={aboutRoute.to}>About</Link>
}
```

#### [特殊相对路径：“.”和“..”](https://tanstack.com/router/latest/docs/framework/react/guide/navigation#special-relative-paths--and-)

很多时候，你可能想要重新加载当前位置或其他来源路径，例如，在当前路由和/或父路由上重新运行加载器，或者导航回父路由。这可以通过指定目标路由路径为“.”来实现，这将重新加载当前位置或指定的来源路径。

另一个常见的需求是将一个路由导航回当前位置或另一条路径。通过指定“..”作为路由路径，导航将被解析到当前位置之前的第一个父路由。

```tsx
export const Route = createFileRoute('/posts/$postId')({
  component: PostComponent,
})

function PostComponent() {
  return (
    <div>
      <Link to=".">Reload the current route of /posts/$postId</Link>
      <Link to="..">Navigate back to /posts</Link>
      // the below are all equivalent
      <Link to="/posts">Navigate back to /posts</Link>
      <Link from="/posts" to=".">
        Navigate back to /posts
      </Link>
      // the below are all equivalent
      <Link to="/">Navigate to root</Link>
      <Link from="/posts" to="..">
        Navigate to root
      </Link>
    </div>
  )
}
```

#### 更新单个搜索参数

更新单个搜索参数而不提供现有路由的任何其他信息也很常见。

例如，你可能想要更新搜索结果的页码：

```tsx
const link = (
  <Link
    to="."
    search={(prev) => ({
      ...prev,
      page: prev.page + 1,
    })}
  >
    Next Page
  </Link>
)
```

#### [参数继承与删除](https://tanstack.com/router/latest/docs/framework/react/guide/navigation#parameter-inheritance-vs-removal)

**继承当前参数** 使用params: {}继承所有当前路由参数：

```tsx
// Inherits current route parameters
<Link to="/posts/{-$category}" params={{}}>
  All Posts
</Link>
```

**删除参数**
将参数设置为未定义以明确删除它们：

```tsx
// Removes the category parameter
<Link to="/posts/{-$category}" params={{ category: undefined }}>
  All Posts
</Link>
```

函数式参数更新对于可选参数特别有用：

```tsx
// Remove a parameter using function syntax
<Link
  to="/posts/{-$category}"
  params={(prev) => ({ ...prev, category: undefined })}
>
  Clear Category
</Link>

// Update a parameter while keeping others
<Link
  to="/articles/{-$category}/{-$slug}"
  params={(prev) => ({ ...prev, category: 'news' })}
>
  News Articles
</Link>

// Conditionally set parameters
<Link
  to="/posts/{-$category}"
  params={(prev) => ({
    ...prev,
    category: someCondition ? 'tech' : undefined
  })}
>
  Conditional Category
</Link>
```

#### [将isActive传递给子代](https://tanstack.com/router/latest/docs/framework/react/guide/navigation#passing-isactive-to-children)

Link组件接受一个函数作为其子组件的参数，允许你将它的 isActive 属性传递给子组件。例如，你可以根据父链接是否处于活动状态来设置子组件的样式：

```tsx
const link = (
  <Link to="/blog/post">
    {({ isActive }) => {
      return (
        <>
          <span>My Blog Post</span>
          <icon className={isActive ? 'active' : 'inactive'} />
        </>
      )
    }}
  </Link>
)

```

#### linkOptions

使用linkOptions函数创建可重复使用的选项

``` tsx
const dashboardLinkOptions = linkOptions({
  to: '/dashboard',
  search: { search: '' },
})

function DashboardComponent() {
  return <Link {...dashboardLinkOptions} />
}
```

这允许对dashboardLinkOptions进行热切类型检查，然后可以在任何地方重复使用

``` tsx
const dashboardLinkOptions = linkOptions({
  to: '/dashboard',
  search: { search: '' },
})

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
  validateSearch: (input) => ({ search: input.search }),
  beforeLoad: () => {
    // can used in redirect
    throw redirect(dashboardLinkOptions)
  },
})

function DashboardComponent() {
  const navigate = useNavigate()

  return (
    <div>
      {/** can be used in navigate */}
      <button onClick={() => navigate(dashboardLinkOptions)} />

      {/** can be used in Link */}
      <Link {...dashboardLinkOptions} />
    </div>
  )
}
```

#### 重定向

```tsx
function Component() {
  return <Navigate to="/posts/$postId" params={{ postId: 'my-first-post' }} />
}
```

可以将Navigate组件视为组件挂载时立即导航到相应路由的一种方式。它是处理仅限客户端重定向的绝佳方法。但它*绝对不能替代*在服务器上负责任地处理服务器感知重定向。

### 路径参数

#### 加载器中的路径参数

路径参数以params对象的形式传递给加载器。该对象的键是路径参数的名称，值是从实际 URL 路径解析出来的值。例如，如果我们要访问/blog/123 URL，则params对象将是{ postId: '123' }：

``` tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    return fetchPost(params.postId)
  },
})
```

params对象也被传递给beforeLoad选项：

```tsx
export const Route = createFileRoute('/posts/$postId')({
  beforeLoad: async ({ params }) => {
    // do something with params.postId
  },
})
```

loader的核心使用场景

- 动态路由的详情页数据加载（最典型场景）
  当页面需要根据 URL 中的动态参数（如文章 ID、用户 ID）展示特定内容时，loader可以自动根据参数加载对应数据，避免在组件内手动调用 API。

  ``` tsx
      // components/PostDetail.tsx
    import { useLoaderData } from '@tanstack/react-router'
  
    function PostDetail() {
      // 获取 loader 加载的文章数据（类型自动推断为 fetchPost 的返回类型）
      const post = useLoaderData<typeof Route>()
  
      return (
        <article>
          <h1>{post.title}</h1>
          <div>{post.content}</div>
        </article>
      )
    }
  
    // 导出组件（供路由使用）
    export default PostDetail
  ```

- 预加载数据以提升用户体验​
  loader会在路由匹配时自动触发数据加载，因此当用户导航到目标路由时，数据可能已在加载中或已完成，避免组件渲染时出现「白屏」或「闪烁」。

- 集中管理路由相关的数据逻辑​
  对于复杂页面（如需要同时加载多个关联资源），loader可以将数据加载逻辑集中在路由配置中，避免分散在多个组件中，提高可维护性。

#### TanStack Router 的 loader和 TanStack Query 

TanStack Router 的 loader和 TanStack Query 常结合使用，以实现路由级数据预加载与组件级数据缓存的协同优化

``` tsx
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { fetchPost, fetchComments } from '@/api' // 假设的 API 函数

// 定义路由配置
export const Route = createFileRoute('/posts/$postId')({
  // 路由级数据加载（预加载文章基本信息）
  loader: async ({ params, queryClient }) => {
    const { postId } = params 

    // 1. 加载文章基本信息（必须，否则路由无法渲染）
    const post = await fetchPost(postId)
    if (!post) throw new Error('文章不存在')

    // 2. （可选）预加载评论数据到 TanStack Query 缓存（提升组件渲染速度）
    // 注意：这里不直接返回评论，而是将其存入 Query 缓存，组件中通过 useQuery 获取
    const queryClient = useQueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['comments', postId],
      queryFn: () => fetchComments(postId),
    })

    // 返回文章基本信息（会被路由上下文缓存）
    return { post }
  },

  // 错误处理组件
  errorElement: <div>文章加载失败</div>,

  // 路由对应的组件
  component: PostDetail,
})
```

``` tsx
// components/PostDetail.tsx
import { useLoaderData, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchComments } from '@/api'

function PostDetail() {
  // 1. 获取路由 loader 预加载的文章基本信息（必选）
  const { post } = useLoaderData<typeof Route>()

  // 2. 使用 TanStack Query 获取评论列表（数据已由 loader 预加载到缓存）
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', post.id], // 与 loader 中预加载的 queryKey 一致
    queryFn: () => fetchComments(post.id), // 与 loader 中的 queryFn 一致
    // 启用缓存（默认 true），即使组件重新渲染也会复用缓存
    staleTime: 5 * 60 * 1000, // 数据保持新鲜 5 分钟
  })

  if (isCommentsLoading) {
    return <div>加载评论中...</div>
  }

  return (
    <article>
      {/* 文章基本信息（来自 loader） */}
      <h1>{post.title}</h1>
      <div>{post.content}</div>

      {/* 评论列表（来自 TanStack Query） */}
      <section>
        <h2>评论（{comments?.length || 0}）</h2>
        <ul>
          {comments?.map(comment => (
            <li key={comment.id}>{comment.text}</li>
          ))}
        </ul>
      </section>

      {/* 返回列表页的链接 */}
      <Link to="/posts" relative="path">
        ← 返回文章列表
      </Link>
    </article>
  )
}

export default PostDetail
```

#### 组件中的路径参数

如果我们向postRoute添加一个组件，我们就可以使用路由的useParams钩子从 URL访问postId变量：

``` tsx
export const Route = createFileRoute('/posts/$postId')({
  component: PostComponent,
})

function PostComponent() {
  const { postId } = Route.useParams()
  return <div>Post {postId}</div>
}
```

使用getRouteApi助手手动访问其他文件中的路由 API

``` tsx
import { createRoute } from '@tanstack/react-router'
import { MyComponent } from './MyComponent'

const route = createRoute({
  path: '/my-route',
  loader: () => ({
    foo: 'bar',
  }),
  component: MyComponent,
})
```

``` tsx
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/my-route')

export function MyComponent() {
  const loaderData = route.useLoaderData()
  //    ^? { foo: string }

  return <div>...</div>
}
```

getRouteApi函数对于访问其他类型安全的 API 很有用：

- useLoaderData
- useLoaderDeps
- useMatch
- useParams
- useRouteContext
- useSearch

#### [路线之外的路径参数](https://tanstack.com/router/latest/docs/framework/react/guide/path-params#path-params-outside-of-routes)

您还可以使用全局导出的useParams钩子，从应用中任何组件访问已解析的路径参数。您需要为useParams传递strict: false选项，表示您希望从不明确的位置访问参数：

```tsx
function PostComponent() {
  const { postId } = useParams({ strict: false })
  return <div>Post {postId}</div>
}
```



### 搜索参数

#### JSON 优先搜索参数

为了实现上述目标，TanStack Router 内置的第一步是强大的搜索参数解析器，它可以自动将 URL 的搜索字符串转换为结构化的 JSON。这意味着您可以在搜索参数中存储任何可 JSON 序列化的数据结构，并将其解析并序列化为 JSON。相比于URLSearchParams ，这是一个巨大的改进，因为 URLSearchParams 对数组结构和嵌套数据的支持有限。

``` tsx
const link = (
  <Link
    to="/shop"
    search={{
      pageIndex: 3,
      includeCategories: ['electronics', 'gifts'],
      sortBy: 'price',
      desc: true,
    }}
  />
)
```

将产生以下 URL：

```
/shop?pageIndex=3&includeCategories=%5B%22electronics%22%2C%22gifts%22%5D&sortBy=price&desc=true
```

当解析此 URL 时，搜索参数将被准确地转换回以下 JSON：

``` json
{
  "pageIndex": 3,
  "includeCategories": ["electronics", "gifts"],
  "sortBy": "price",
  "desc": true
}

```

如果你注意到的话，这里发生了几件事：

- 搜索参数的第一级是平面的、基于字符串的，就像URLSearchParams一样。
- 第一级非字符串值被准确地保存为实际数字和布尔值。
- 嵌套数据结构自动转换为 URL 安全的 JSON 字符串

#### 输入验证 + TypeScript！

TanStack Router 提供了便捷的 API 来验证和输入搜索参数。这一切都始于Route的validateSearch选项：

``` tsx
// /routes/shop.products.tsx

type ProductSearchSortOptions = 'newest' | 'oldest' | 'price'

type ProductSearch = {
  page: number
  filter: string
  sort: ProductSearchSortOptions
}

export const Route = createFileRoute('/shop/products')({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    // validate and parse the search params into a typed state
    return {
      page: Number(search?.page ?? 1),
      filter: (search.filter as string) || '',
      sort: (search.sort as ProductSearchSortOptions) || 'newest',
    }
  },
})
```

在上面的例子中，我们验证了路由的搜索参数，并返回一个类型化的ProductSearch对象。这个类型化的对象随后会提供给该路由的其他选项**以及任何子路由使用！**

### 数据加载

#### 生命周期

Every time a URL/history update is detected, the router executes the following sequence:

- Route Matching (Top-Down)
  - route.params.parse
  - route.validateSearch
- Route Pre-Loading (Serial)
  - route.beforeLoad
  - route.onError
    - route.errorComponent / parentRoute.errorComponent / router.defaultErrorComponent
- Route Loading (Parallel)
  - route.component.preload?
  - route.loader
    - route.pendingComponent (Optional)
    - route.component
  - route.onError
    - route.errorComponent / parentRoute.errorComponent / router.defaultErrorComponent

#### [使用路由器上下文](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-router-context)

```tsx
import { routeTree } from './routeTree.gen'

// Use your routerContext to create a new router
// This will require that you fullfil the type requirements of the routerContext
const router = createRouter({
  routeTree,
  context: {
    // Supply the fetchPosts function to the router context
    fetchPosts,
  },
})
```

```tsx
import { createFileRoute } from '@tanstack/react-router'

// Notice how our postsRoute references context to get our fetchPosts function
// This can be a powerful tool for dependency injection across your router
// and routes.
export const Route = createFileRoute('/posts')({
  loader: ({ context: { fetchPosts } }) => fetchPosts(),
})
```

#### [使用路由上下文](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-route-context)

将全局上下文传递给路由器固然很好，但如果您想提供特定于路由的上下文怎么办？这时就需要beforeLoad选项了。beforeLoad 选项是一个在尝试加载路由之前运行的函数，它接收与loader相同的参数。除了重定向潜在匹配项、阻止加载器请求等功能外，它还可以返回一个将合并到路由上下文中的对象。

```tsx
// /routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  // Pass the fetchPosts function to the route context
  beforeLoad: () => ({
    fetchPosts: () => console.info('foo'),
  }),
  loader: ({ context: { fetchPosts } }) => {
    console.info(fetchPosts()) // 'foo'

    // ...
  },
})
```

#### [使用loaderDeps访问搜索参数](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-loaderdeps-to-access-search-params)

::: tip

您可能想知道为什么search不能直接在loader函数的参数中使用。我们特意这样设计是为了帮助您成功实现这一点。让我们来看看原因：

- 加载器函数中使用的搜索参数很好地表明，这些搜索参数也应该用于唯一标识正在加载的数据。例如，你可能有一个路由使用像pageIndex这样的搜索参数来唯一标识路由匹配中保存的数据。或者，假设一个/users/user路由使用搜索参数userId来标识应用程序中的特定用户，你可以像这样构建你的 URL：/users/user?userId=123。这意味着你的用户路由需要一些额外的帮助来识别特定用户。

- 在加载器函数中直接访问搜索参数可能会导致缓存和预加载出现错误，因为加载的数据并非当前 URL 路径名和搜索参数所独有。例如，你可能要求/posts路由预加载第 2 页的结果，但如果路由配置中没有区分页面，最终会在/posts或?page=1屏幕上获取、存储和显示第 2 页的数据，而不是在后台预加载！

- 在搜索参数和加载器功能之间设置一个阈值可以让路由器了解您的依赖关系和反应性。

  ```tsx
  // /routes/users.user.tsx
  export const Route = createFileRoute('/users/user')({
    validateSearch: (search) =>
      search as {
        userId: string
      },
    loaderDeps: ({ search: { userId } }) => ({
      userId,
    }),
    loader: async ({ deps: { userId } }) => getUser(userId),
  })
  ```

  

:::

该函数提供路由器的搜索参数，并返回一个依赖项对象，供加载器函数使用。当这些依赖项从一个导航更改为另一个导航时，无论staleTime是多少，都会导致路由重新加载。依赖项之间的比较将使用深度相等性检查。

假设一个/posts路由通过搜索参数offset和limit支持分页。为了让缓存唯一地存储这些数据，我们需要通过loaderDeps函数访问这些搜索参数。通过显式地标识它们，每个与/posts匹配的具有不同offset和limit 的路由就不会混淆！

一旦我们有了这些依赖，当依赖发生变化时，路线将始终重新加载。

```tsx
// /routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: ({ deps: { offset, limit } }) =>
    fetchPosts({
      offset,
      limit,
    }),
})
```

### 自定义链接

``` tsx
import * as React from 'react'
import { createLink, LinkComponent } from '@tanstack/react-router'

interface BasicLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  // Add any additional props you want to pass to the anchor element
}

const BasicLinkComponent = React.forwardRef<HTMLAnchorElement, BasicLinkProps>(
  (props, ref) => {
    return (
      <a ref={ref} {...props} className={'block px-3 py-2 text-blue-700'} />
    )
  },
)

const CreatedLinkComponent = createLink(BasicLinkComponent)

export const CustomLink: LinkComponent<typeof BasicLinkComponent> = (props) => {
  return <CreatedLinkComponent preload={'intent'} {...props} />
}
```

### [处理错误](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#handling-errors)

#### [使用routeOptions.errorComponent处理错误](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#handling-errors-with-routeoptionserrorcomponent)

routeOptions.errorComponent选项是在路由加载或渲染生命周期中发生错误时渲染的组件。它使用以下 props 进行渲染：

- 错误- 发生的错误
- reset - 重置内部CatchBoundary的函数

```tsx
// routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  errorComponent: ({ error, reset }) => {
    return (
      <div>
        {error.message}
        <button
          onClick={() => {
            // Reset the router error boundary
            reset()
          }}
        >
          retry
        </button>
      </div>
    )
  },
})
```

如果错误是路由加载的结果，则应该调用router.invalidate()，它将协调路由器重新加载和错误边界重置：

```tsx
// routes/posts.tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  errorComponent: ({ error, reset }) => {
    const router = useRouter()

    return (
      <div>
        {error.message}
        <button
          onClick={() => {
            // Invalidate the route to reload the loader, which will also reset the error boundary
            router.invalidate()
          }}
        >
          retry
        </button>
      </div>
    )
  },
})
```



#### [使用 TanStack Query 进行错误处理](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading#error-handling-with-tanstack-query)

如果在TanStack Query中使用Suspense时发生错误，您需要让查询知道您想要在重新渲染时重试。这可以通过使用useQueryErrorResetBoundary钩子提供的reset函数来实现。您可以在错误组件挂载后立即在 effect 中调用此函数。这将确保查询被重置，并在路由组件再次渲染时尝试再次获取数据。这还可以涵盖用户离开路由而不是点击重试按钮的情况。

```tsx
export const Route = createFileRoute('/')({
  loader: () => queryClient.ensureQueryData(postsQueryOptions),
  errorComponent: ({ error, reset }) => {
    const router = useRouter()
    const queryErrorResetBoundary = useQueryErrorResetBoundary()

    useEffect(() => {
      // Reset the query error boundary
      queryErrorResetBoundary.reset()
    }, [queryErrorResetBoundary])

    return (
      <div>
        {error.message}
        <button
          onClick={() => {
            // Invalidate the route to reload the loader, and reset any router error boundaries
            router.invalidate()
          }}
        >
          retry
        </button>
      </div>
    )
  },
})
```

### **数据突变**

#### [突变后使 TanStack 路由器失效](https://tanstack.com/router/latest/docs/framework/react/guide/data-mutations#invalidating-tanstack-router-after-a-mutation)

::: tip

`router.invalidate`是一个**用于手动使路由相关查询缓存失效**的核心方法。其核心目标是**强制 React Query 重新加载指定路由的查询数据**，确保用户看到的是最新数据（而非过时的缓存）。

**功能原理：使路由查询缓存失效**

`router.invalidate`的本质是**标记指定路由的查询为“无效”**，当用户再次访问这些路由时，React Query 会跳过缓存，直接触发数据请求（重新加载）。其底层逻辑如下：

1. **路由与查询的绑定**：TanStack Router 中，每个路由可以通过 `queries`配置关联一个或多个查询（`queryKey`）。这些查询的缓存状态与路由路径强相关。
2. **缓存失效标记**：调用 `router.invalidate(route)`后，React Query 会将该路由对应的所有查询标记为“无效”（`stale: true`）。
3. **触发重新加载**：当用户导航到被标记为无效的路由时，React Query 会检测到缓存无效，自动触发查询的重新加载（调用 `queryFn`获取最新数据）。

:::

TanStack 路由器内置短期缓存功能。因此，即使我们在卸载路由匹配后不再存储任何数据，如果路由器中存储的数据发生任何变化，则当前路由匹配的数据很可能会过期。

当进行与加载器数据相关的突变时，我们可以使用router.invalidate强制路由器重新加载所有当前路由匹配：

```tsx
const router = useRouter()

const addTodo = async (todo: Todo) => {
  try {
    await api.addTodo()
    router.invalidate()
  } catch {
    //
  }
}
```

### **导航阻塞**

有两种使用导航阻止的方法：

- 钩子/基于逻辑的阻塞
- 基于组件的阻塞

```tsx
import { useBlocker } from '@tanstack/react-router'

function MyComponent() {
  const [formIsDirty, setFormIsDirty] = useState(false)

  useBlocker({
    shouldBlockFn: () => {
      if (!formIsDirty) return false

      const shouldLeave = confirm('Are you sure you want to leave?')
      return !shouldLeave
    },
  })

  // ...
}
```

shouldBlockFn为您提供对当前和下一个位置的类型安全访问：

```tsx
import { useBlocker } from '@tanstack/react-router'

function MyComponent() {
  // always block going from /foo to /bar/123?hello=world
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: ({ current, next }) => {
      return (
        current.routeId === '/foo' &&
        next.fullPath === '/bar/$id' &&
        next.params.id === 123 &&
        next.search.hello === 'world'
      )
    },
    withResolver: true,
  })

  // ...
}
```

#### [基于组件的阻塞](https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#component-based-blocking)

```tsx
import { Block } from '@tanstack/react-router'

function MyComponent() {
  const [formIsDirty, setFormIsDirty] = useState(false)

  return (
    <Block
      shouldBlockFn={() => {
        if (!formIsDirty) return false

        const shouldLeave = confirm('Are you sure you want to leave?')
        return !shouldLeave
      }}
      enableBeforeUnload={formIsDirty}
    />
  )

  // OR

  return (
    <Block
      shouldBlockFn={() => formIsDirty}
      enableBeforeUnload={formIsDirty}
      withResolver
    >
      {({ status, proceed, reset }) => <>{/* ... */}</>}
    </Block>
  )
}
```

#### [带有解析器的基于钩子/逻辑的自定义 UI](https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#hooklogical-based-custom-ui-with-resolver)

```tsx
import { Block } from '@tanstack/react-router'

function MyComponent() {
  const [formIsDirty, setFormIsDirty] = useState(false)

  return (
    <Block shouldBlockFn={() => formIsDirty} withResolver>
      {({ status, proceed, reset }) => (
        <>
          {/* ... */}
          {status === 'blocked' && (
            <div>
              <p>Are you sure you want to leave?</p>
              <button onClick={proceed}>Yes</button>
              <button onClick={reset}>No</button>
            </div>
          )}
        </>
      )}
    </Block>
  )
}
```

### [**路由鉴权**](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)

#### [route.beforeLoad选项](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes#the-routebeforeload-option)

route.beforeLoad选项允许你指定一个在路由加载之前调用的函数。它接收与route.loader函数相同的所有参数。这是一个检查用户是否已通过身份验证的好地方，如果未通过身份验证，则将其重定向到登录页面。

::: tip

**需要注意的是，路由的beforeLoad函数会\*在其子路由的beforeLoad函数\*之前被调用。**它本质上是该路由及其所有子路由的中间件函数。

**如果在beforeLoad中抛出错误，则其子级都不会尝试加载**。

:::

#### [重定向](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes#redirecting)

虽然不是必需的，但某些身份验证流程需要重定向到登录页面。为此，你可以在beforeLoad中**抛出一个redirect()**：

```tsx
// src/routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: {
          // Use the current location to power a redirect after login
          // (Do not use `router.state.resolvedLocation` as it can
          // potentially lag behind the actual current location)
          redirect: location.href,
        },
      })
    }
  },
})
```

在用户身份验证完成后，通常的做法是将其重定向回他们之前尝试访问的页面。为此，您可以使用我们在原始重定向中添加的重定向搜索参数。由于我们将用原来的 URL 替换整个 URL，因此router.history.push比router.navigate更适合此操作：

```tsx
router.history.push(search.redirect)
```

#### [非重定向身份验证](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes#non-redirected-authentication)

一些应用程序选择不将用户重定向到登录页面，而是将用户保留在同一页面上并显示一个登录表单，该表单要么替换主内容，要么通过模态框将其隐藏。TanStack Router 也可以实现这一点，只需简单地短路渲染通常用于渲染子路由的<Outlet />即可：

```tsx
// src/routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  component: () => {
    if (!isAuthenticated()) {
      return <Login />
    }

    return <Outlet />
  },
})
```

#### [**如何设置基于角色的访问控制**](https://tanstack.com/router/latest/docs/framework/react/how-to/setup-rbac)

### **静态路由数据**

创建路由时，您可以选择在路由选项中指定staticData属性。此对象可以包含任何您想要的内容，只要它在创建路由时同步可用即可。

除了可以从路线本身访问此数据之外，您还可以从match.staticData属性下的任何匹配访问它。

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  staticData: {
    customData: 'Hello!',
  },
})
```

然后，您可以在任何可以访问路线的地方访问此数据，包括可以映射回其路线的匹配项。

 ```tsx
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => {
    const matches = useMatches()

    return (
      <div>
        {matches.map((match) => {
          return <div key={match.id}>{match.staticData.customData}</div>
        })}
      </div>
    )
  },
})

 ```

强制静态数据

如果要强制路由具有静态数据，则可以使用声明合并将类型添加到路由的静态选项：

```tsx
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    customData: string
  }
}
```

现在，如果您尝试创建没有customData属性的路线，您将收到类型错误：

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts')({
  staticData: {
    // Property 'customData' is missing in type '{ customData: number; }' but required in type 'StaticDataRouteOption'.ts(2741)
  },
})
```

