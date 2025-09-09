## **介绍**

TanStack Table 是一个**无头 UI**库，用于为 TS/JS、React、Vue、Solid、Qwik 和 Svelte 构建强大的表格和数据网格。

专门为表格UI组件提供逻辑、状态、处理和 API，但不提供样式和实现

### [列定义指南](https://tanstack.com/table/latest/docs/guide/column-defs#column-definitions-guide)

列定义是构建表的最重要部分。它负责：

- 构建用于所有操作（包括排序、过滤、分组等）的底层数据模型。
- 将数据模型格式化为表格中显示的内容
- 创建[页眉组](https://tanstack.com/table/latest/docs/api/core/header-group)、[页眉](https://tanstack.com/table/latest/docs/api/core/header)和[页脚](https://tanstack.com/table/latest/docs/api/core/column-def#footer)
- 创建仅用于显示的列，例如操作按钮、复选框、扩展器、迷你图等。

#### [列助手](https://tanstack.com/table/latest/docs/guide/column-defs#column-helpers)

虽然列定义最终只是普通的对象，但是从表核心中暴露了一个createColumnHelper函数，当使用行类型调用该函数时，它会返回一个实用程序，用于创建具有最高类型安全性的不同列定义类型。

```tsx
// Define your row shape
type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

const columnHelper = createColumnHelper<Person>()

// Make some columns!
const defaultColumns = [
  // Display Column
  columnHelper.display({
    id: 'actions',
    cell: props => <RowActions row={props.row} />,
  }),
  // Grouping Column
  columnHelper.group({
    header: 'Name',
    footer: props => props.column.id,
    columns: [
      // Accessor Column
      columnHelper.accessor('firstName', {
        cell: info => info.getValue(),
        footer: props => props.column.id,
      }),
      // Accessor Column
      columnHelper.accessor(row => row.lastName, {
        id: 'lastName',
        cell: info => info.getValue(),
        header: () => <span>Last Name</span>,
        footer: props => props.column.id,
      }),
    ],
  }),
  // Grouping Column
  columnHelper.group({
    header: 'Info',
    footer: props => props.column.id,
    columns: [
      // Accessor Column
      columnHelper.accessor('age', {
        header: () => 'Age',
        footer: props => props.column.id,
      }),
      // Grouping Column
      columnHelper.group({
        header: 'More Info',
        columns: [
          // Accessor Column
          columnHelper.accessor('visits', {
            header: () => <span>Visits</span>,
            footer: props => props.column.id,
          }),
          // Accessor Column
          columnHelper.accessor('status', {
            header: 'Status',
            footer: props => props.column.id,
          }),
          // Accessor Column
          columnHelper.accessor('progress', {
            header: 'Profile Progress',
            footer: props => props.column.id,
          }),
        ],
      }),
    ],
  }),
]
```

#### 创建访问器列

数据列的独特之处在于必须配置它们以提取数据数组中每个项目的原始值。

有 3 种方法可以实现此目的：

- 如果您的项目是对象，请使用与您想要提取的值相对应的对象键。
- 如果您的项目是嵌套数组，请使用与要提取的值相对应的数组索引。
- 使用访问函数返回您想要提取的值。

##### [对象键](https://tanstack.com/table/latest/docs/guide/column-defs#object-keys)

如果您的每个项目都是具有以下形状的对象：

```tsx
type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}
```

您可以像这样提取firstName值：

```tsx
columnHelper.accessor('firstName')

// OR

{
  accessorKey: 'firstName',
}
```

##### [数组索引](https://tanstack.com/table/latest/docs/guide/column-defs#array-indices)

如果每个项目都是具有以下形状的数组：

```tsx
type Sales = [Date, number]
```

您可以像这样提取数字值：

```tsx
columnHelper.accessor(1)

// OR

{
  accessorKey: 1,
}
```

##### [访问器函数](https://tanstack.com/table/latest/docs/guide/column-defs#accessor-functions)

如果您的每个项目都是具有以下形状的对象：

```tsx
type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}t
```

您可以像这样提取计算出的全名值：

```tsx
columnHelper.accessor(row => `${row.firstName} ${row.lastName}`, {
  id: 'fullName',
})

// OR

{
  id: 'fullName',
  accessorFn: row => `${row.firstName} ${row.lastName}`,
}
```

##### [唯一列 ID](https://tanstack.com/table/latest/docs/guide/column-defs#unique-column-ids)

***🧠 一种简单的记忆方法：如果您使用访问器函数定义列，请提供字符串标题或提供唯一的*id*属性。***

##### [列格式和渲染](https://tanstack.com/table/latest/docs/guide/column-defs#column-formatting--rendering)

默认情况下，列单元格会将其数据模型值显示为字符串。您可以通过提供自定义渲染实现来覆盖此行为。每个实现都会提供有关单元格、页眉或页脚的相关信息，并返回框架适配器可以渲染的内容，例如 JSX/Components/strings 等。这取决于您使用的适配器。

有几种格式化程序可供您使用：

- cell：用于格式化单元格。
- aggregatedCell：用于在聚合时格式化单元格。
- header：用于格式化标题。
- 页脚：用于格式化页脚。

###### [单元格格式](https://tanstack.com/table/latest/docs/guide/column-defs#cell-formatting)

您可以通过将函数传递给单元格属性并使用props.getValue()函数访问单元格的值来提供自定义单元格格式化程序：

```tsx
columnHelper.accessor('firstName', {
  cell: props => <span>{props.getValue().toUpperCase()}</span>,
})
```

行和表对象也提供了单元格格式化程序，允许你自定义单元格格式，而不仅仅是单元格值。下面的示例提供了firstName作为访问器，同时还显示了位于原始行对象上的带前缀的用户 ID：

```tsx
columnHelper.accessor('firstName', {
  cell: props => (
    <span>{`${props.row.original.id} - ${props.getValue()}`}</span>
  ),
})
```

### **表实例指南**

指包含表格状态和 API 的核心表格对象

#### 创建表实例

要创建表实例，需要两个选项： columns和data。还有许多其他表选项可用于配置功能和行为，但这两个选项是必需的。

```tsx
//react
const table = useReactTable({ columns, data })
```

#### [定义列](https://tanstack.com/table/latest/docs/guide/tables#defining-columns)

```tsx
const columns: ColumnDef<User>[] = [] //Pass User type as the generic TData type
//or
const columnHelper = createColumnHelper<User>() //Pass User type as the generic TData type
```

#### [表格状态](https://tanstack.com/table/latest/docs/guide/tables#table-state)

表实例包含所有表状态，可通过table.getState() API 访问。每个表功能都会在表状态中注册各种状态。例如，行选择功能会注册rowSelection状态，分页功能会注册pagination状态，等等。

每个功能在表实例上还会有相应的状态设置 API 和状态重置 API。例如，行选择功能将具有setRowSelection和resetRowSelection API 。

```tsx
table.getState().rowSelection //read the row selection state
table.setRowSelection((old) => ({...old})) //set the row selection state
table.resetRowSelection() //reset the row selection state
```

### **行模型指南**

```tsx
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

function Component() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(), //row model
  })
}
```

::: tip

getCoreRowModel函数是什么？为什么必须从 TanStack Table 导入它，然后再将其传回给自身？

答案是，TanStack Table 是一个模块化库。默认情况下，createTable 函数/钩子中并非包含每个功能的全部代码。您只需导入并包含根据要使用的功能正确生成行所需的代码即可。

:::

#### [什么是行模型？](https://tanstack.com/table/latest/docs/guide/row-models#what-are-row-models)

TanStack Table 的底层运行着行模型，它能以实用的方式转换原始数据，以满足数据网格功能（例如筛选、排序、分组、扩展和分页）的需求。生成并呈现在屏幕上的行不一定是传递给表的原始数据的 1:1 映射。它们可能经过排序、筛选、分页等操作。

#### [导入行模型](https://tanstack.com/table/latest/docs/guide/row-models#import-row-models)

您应该只导入所需的行模型。以下是所有可用的行模型：

```tsx
//only import the row models you need
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
}
//...
const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

表实例上可用的行模型

- **getRowModel** - 这是用于渲染表格行标记的主要行模型。它将使用所有其他行模型来生成最终用于渲染表格行的行模型。

  ```tsx
  <TableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="h-24 text-center"
          >
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  ```

  

- getCoreRowModel - 返回一个基本行模型，它只是传递给表的原始数据的 1：1 映射。

- getFilteredRowModel - 返回一个考虑列过滤和全局过滤的行模型。

- getPreFilteredRowModel - 在应用列过滤和全局过滤之前返回行模型。

- getGroupedRowModel - 返回对数据应用分组和聚合并创建子行的行模型。

- getPreGroupedRowModel - 在应用分组和聚合之前返回行模型。

- getSortedRowModel - 返回已应用排序的行模型。

- getPreSortedRowModel - 返回排序之前的行模型（行按原始顺序排列）。

- getExpandedRowModel - 返回考虑展开/隐藏子行的行模型。

- getPreExpandedRowModel - 返回仅包含根级行且不包含扩展子行的行模型。仍包含排序功能。

- getPaginationRowModel - 返回一个行模型，该模型仅包含根据分页状态应在当前页面上显示的行。

- getPrePaginationRowModel - 返回未应用分页的行模型（包括所有行）。

- getSelectedRowModel - 返回所有选定行的行模型（但仅基于传递到表的数据）。在 getCoreRowModel 之后运行。

- getPreSelectedRowModel - 在应用行选择之前返回行模型（仅返回 getCoreRowModel）。

- getGroupedSelectedRowModel - 返回分组后选定行的行模型。在 getSortedRowModel 之后运行，getSortedRowModel 又在 getGroupedRowModel 之后运行，getGroupedRowModel 又在 getFilteredRowModel 之后运行。

- getFilteredSelectedRowModel - 返回经过列过滤和全局过滤后选定行的行模型。在 getFilteredRowModel 之后运行。

[行模型数据结构](https://tanstack.com/table/latest/docs/guide/row-models#row-model-data-structure)

```tsx
console.log(table.getRowModel().rows) // array of rows
console.log(table.getRowModel().flatRows) // array of rows, but all sub-rows are flattened into the top level
console.log(table.getRowModel().rowsById['row-id']) // object of rows, where each row is keyed by its `id`
```

### [行指南](https://tanstack.com/table/latest/docs/guide/rows#rows-guide)

#### getRow

如果需要通过id访问特定行，则可以使用table.getRow表实例 API。

```tsx
table.getRow("1") //获取第一行的行对象，提供了很多的操作api和数据源
```

#### [获取选定的行](https://tanstack.com/table/latest/docs/guide/rows#get-selected-rows)

```tsx
const selectedRows = table.getSelectedRowModel().rows
```

#### [子行](https://tanstack.com/table/latest/docs/guide/rows#sub-rows)

如果您使用分组或扩展功能，您的行可能包含子行或父行引用。[扩展指南](https://tanstack.com/table/latest/docs/guide/expanding)中对此进行了更详细的讨论，但这里简要概述了处理子行的有用属性和方法。

- row.subRows：该行的子行数组。
- row.depth：相对于根行数组的行深度（如果嵌套或分组）。0 表示根级行，1 表示子行，2 表示孙行，等等。
- row.parentId：该行的父行的唯一 ID（在其 subRows 数组中包含此行的行）。
- row.getParentRow：返回该行的父行（如果存在）。

### 单元格指南

最常见的是，您将使用row.getAllCells或row.getVisibleCells API（如果您使用列可见性功能）

#### [访问单元格值](https://tanstack.com/table/latest/docs/guide/cells#access-cell-values)

建议使用cell.getValue或cell.renderValue API 来访问单元格中的数据值。使用这两个 API 中的任何一个都会缓存访问器函数的结果，从而保持渲染效率。两者之间的唯一区别在于，如果值未定义，cell.renderValue将返回值本身或renderFallbackValue ；而如果值未定义，cell.getValue将返回值本身或undefined 。

#### 从任意单元格访问其他行数据

由于每个单元格对象都与其父行相关联，因此您可以使用cell.row.original访问表中使用的原始行中的任何数据。

#### [单元格渲染](https://tanstack.com/table/latest/docs/guide/cells#cell-rendering)

您可以直接使用cell.renderValue或cell.getValue API 来渲染表格的单元格。但是，这些 API 只会返回原始单元格值（来自访问器函数）。如果您使用cell: () => JSX列定义选项，则需要使用适配器中的flexRender API 实用程序。

使用flexRender API 将允许使用任何额外的标记或 JSX 正确呈现单元格，并且它将使用正确的参数调用回调函数。

```tsx
import { flexRender } from '@tanstack/react-table'

const columns = [
  {
    accessorKey: 'fullName',
    cell: ({ cell, row }) => {
      return <div><strong>{row.original.firstName}</strong> {row.original.lastName}</div>
    }
    //...
  }
]
//...
<tr>
  {row.getVisibleCells().map(cell => {
    return <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
  })}
</tr>
```

### **标题组指南**

#### [获取标题组](https://tanstack.com/table/latest/docs/guide/header-groups#where-to-get-header-groups-from)

`table.getHeaderGroups`是最常用的 API

#### [标题组对象](https://tanstack.com/table/latest/docs/guide/header-groups#header-group-objects)

```tsx
<TableHeader>
  {table.getHeaderGroups().map((headerGroup) => (
    <TableRow key={headerGroup.id}>
      {headerGroup.headers.map((header) => {
        return (
          <TableHead key={header.id} colSpan={header.colSpan}>
            {header.isPlaceholder
              ? null
              : flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
          </TableHead>
        );
      })}
    </TableRow>
  ))}
</TableHeader>
```

### 列

#### [获取列](https://tanstack.com/table/latest/docs/guide/columns#get-column)

如果您只需要通过 ID 获取单个列，则可以使用table.getColumn API。

```tsx
const column = table.getColumn('firstName');
```

#### [列渲染](https://tanstack.com/table/latest/docs/guide/columns#column-rendering)

不一定非要使用列对象来直接渲染标题或单元格。相反，应该使用[标题](https://tanstack.com/table/latest/docs/guide/headers)和[单元格](https://tanstack.com/table/latest/docs/guide/cells)对象，正如上面讨论的那样。

### **表格状态**

TanStack Table 拥有一个简单的底层内部状态管理系统，用于存储和管理表格的状态。它还允许您选择性地提取任何需要管理的状态，并将其添加到您自己的状态管理中

#### [访问表状态](https://tanstack.com/table/latest/docs/framework/react/guide/table-state#accessing-table-state)

您无需设置任何特殊设置即可使表格状态正常工作。如果您未向state、initialState或任何on[State]Change表格选项传入任何内容，表格将在内部管理其自身的状态。您可以使用table.getState()表格实例 API访问此内部状态的任何部分。

```tsx
const table = useReactTable({
  columns,
  data,
  //...
})

console.log(table.getState()) //access the entire internal state
console.log(table.getState().rowSelection) //access just the row selection state
```

#### [自定义初始状态](https://tanstack.com/table/latest/docs/framework/react/guide/table-state#custom-initial-state)

如果您只需要为某些状态自定义其初始默认值，则仍然无需自行管理任何状态。您只需在表实例的initialState选项中设置值即可。

```tsx
const table = useReactTable({
  columns,
  data,
  initialState: {
    columnOrder: ['age', 'firstName', 'lastName'], //customize the initial column order
    columnVisibility: {
      id: false //hide the id column by default
    },
    expanded: true, //expand all rows by default
    sorting: [
      {
        id: 'age',
        desc: true //sort by age in descending order by default
      }
    ]
  },
  //...
})
```

#### 服务器端数据

```tsx
const [columnFilters, setColumnFilters] = React.useState([]) //no default filters
const [sorting, setSorting] = React.useState([{
  id: 'age',
  desc: true, //sort by age in descending order by default
}]) 
const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 })

//Use our controlled state values to fetch data
const tableQuery = useQuery({
  queryKey: ['users', columnFilters, sorting, pagination],
  queryFn: () => fetchUsers(columnFilters, sorting, pagination),
  //...
})

const table = useReactTable({
  columns,
  data: tableQuery.data,
  //...
  state: {
    columnFilters, //pass controlled state back to the table (overrides internal state)
    sorting,
    pagination
  },
  onColumnFiltersChange: setColumnFilters, //hoist columnFilters state into our own state management
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
})
//...
```

#### [状态改变回调](https://tanstack.com/table/latest/docs/framework/react/guide/table-state#on-state-change-callbacks)

[1.状态改变回调必须在**状态****选项****中具有其对应的状态值**](https://tanstack.com/table/latest/docs/framework/react/guide/table-state#1-state-change-callbacks-must-have-their-corresponding-state-value-in-the-state-option)

```tsx
const [sorting, setSorting] = React.useState([])
//...
const table = useReactTable({
  columns,
  data,
  //...
  state: {
    sorting, //required because we are using `onSortingChange`
  },
  onSortingChange: setSorting, //makes the `state.sorting` controlled
})
```

[2.**更新器可以是原始值，也可以是回调函数**。](https://tanstack.com/table/latest/docs/framework/react/guide/table-state#2-updaters-can-either-be-raw-values-or-callback-functions)

on[State]Change和onStateChange回调的工作方式与 React 中的setState函数完全相同。更新器值可以是新的状态值，也可以是接受先前状态值并返回新状态值的回调函数。

这意味着什么？这意味着，如果你想在任何on[State]Change回调中添加一些额外的逻辑，你可以这样做，但你需要检查新传入的更新器值是函数还是值。

```tsx
const [sorting, setSorting] = React.useState([])
const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

const table = useReactTable({
  columns,
  data,
  //...
  state: {
    pagination,
    sorting,
  }
  //syntax 1
  onPaginationChange: (updater) => {
    setPagination(old => {
      const newPaginationValue = updater instanceof Function ? updater(old) : updater
      //do something with the new pagination value
      //...
      return newPaginationValue
    })
  },
  //syntax 2
  onSortingChange: (updater) => {
    const newSortingValue = updater instanceof Function ? updater(sorting) : updater
    //do something with the new sorting value
    //...
    setSorting(updater) //normal state update
  }
})
```

分页功能

::: warning

手动分页manualPagination必须开启，行模型重算会根据当前 pagination/pageCount 进行校正（越界/变更等），这一步也可能触发一次受控状态同步，从而又调到 onPaginationChange

:::

```tsx
  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    const nextPage = next.pageIndex + 1
    const nextPageSize = next.pageSize
    navigate({
      search: (prev) => ({
        ...(prev as SearchRecord),
        [pageKey]: nextPage <= defaultPage ? undefined : nextPage,
        [pageSizeKey]:
          nextPageSize === defaultPageSize ? undefined : nextPageSize,
      }),
    })
  }
```



### 功能指南

#### 列排序

如果您未提供columnOrder状态，TanStack Table 将直接使用columns数组中列的顺序。但是，您可以向columnOrder状态提供一个包含字符串列 ID 的数组来指定列的顺序。

```tsx
const table = useReactTable({
  //...
  initialState: {
    columnOrder: ['columnId1', 'columnId2', 'columnId3'],
  }
  //...
});
```

##### [管理列顺序状态](https://tanstack.com/table/latest/docs/guide/column-ordering#managing-column-order-state)

如果需要动态更改列顺序，或者在初始化表后设置列顺序，则可以像管理任何其他表状态一样管理columnOrder状态。

```tsx
const [columnOrder, setColumnOrder] = useState<string[]>(['columnId1', 'columnId2', 'columnId3']); //optionally initialize the column order
//...
const table = useReactTable({
  //...
  state: {
    columnOrder,
    //...
  }
  onColumnOrderChange: setColumnOrder,
  //...
});
```

#### [列固定](https://tanstack.com/table/latest/docs/guide/column-pinning#how-column-pinning-affects-column-order)

```tsx
const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
  left: [],
  right: [],
});
//...
const table = useReactTable({
  //...
  state: {
    columnPinning,
    //...
  }
  onColumnPinningChange: setColumnPinning,
  //...
});
```

默认值设置

```tsx
const table = useReactTable({
  //...
  initialState: {
    columnPinning: {
      left: ['expand-column'],
      right: ['actions-column'],
    },
    //...
  }
  //...
});
```

有一些有用的 Column API 方法可以帮助您实现列固定功能：

- [column.getCanPin](https://tanstack.com/table/latest/docs/api/features/column-pinning#getcanpin)：用于确定是否可以固定列。
- [column.pin](https://tanstack.com/table/latest/docs/api/features/column-pinning#pin)：用于将列固定在左侧或右侧。或用于取消固定列。
- [column.getIsPinned](https://tanstack.com/table/latest/docs/api/features/column-pinning#getispinned)：用于确定列固定的位置。
- [column.getStart](https://tanstack.com/table/latest/docs/api/features/column-pinning#getstart)：用于为固定列提供正确的左CSS 值。
- [column.getAfter](https://tanstack.com/table/latest/docs/api/features/column-pinning#getafter)：用于为固定列提供正确的 CSS 值。
- [column.getIsLastColumn](https://tanstack.com/table/latest/docs/api/features/column-pinning#getislastcolumn)：用于判断某一列是否是其固定组中的最后一列。可用于添加 box-shadow
- [column.getIsFirstColumn](https://tanstack.com/table/latest/docs/api/features/column-pinning#getisfirstcolumn)：用于判断某一列是否是其固定组中的第一列。可用于添加 box-shadow

#### [列大小调整](https://tanstack.com/table/latest/docs/api/features/column-sizing)

##### 列宽

默认情况下，列具有以下测量选项：

```tsx
export const defaultColumnSizing = {
  size: 150,
  minSize: 20,
  maxSize: Number.MAX_SAFE_INTEGER,
}
```

这些默认值可以按照顺序被tableOptions.defaultColumn和各个列定义覆盖。

```tsx
const columns = [
  {
    accessorKey: 'col1',
    size: 270, //set column size for this column
  },
  //...
]

const table = useReactTable({
  //override default column sizing
  defaultColumn: {
    size: 200, //starting column size
    minSize: 50, //enforced during column resizing
    maxSize: 500, //enforced during column resizing
  },
})
```

#### [列可见性](https://tanstack.com/table/latest/docs/framework/react/examples/column-visibility)

```tsx
const [columnVisibility, setColumnVisibility] = useState({
  columnId1: true,
  columnId2: false, //hide this column by default
  columnId3: true,
});

const table = useReactTable({
  //...
  state: {
    columnVisibility,
    //...
  },
  onColumnVisibilityChange: setColumnVisibility,
});
```

或者，如果您不需要管理表格之外的列可见性状态，您仍然可以使用initialState选项设置初始默认列可见性状态。

```tsx
const table = useReactTable({
  //...
  initialState: {
    columnVisibility: {
      columnId1: true,
      columnId2: false, //hide this column by default
      columnId3: true,
    },
    //...
  },
});
```

***如果同时为initialState和state指定了*columnVisibility*，则state初始化将优先执行，initialState将被忽略。请勿同时为initialState和state指定columnVisibility，只能指定其中一个。***

##### [禁用隐藏列](https://tanstack.com/table/latest/docs/guide/column-visibility#disable-hiding-columns)

默认情况下，所有列都可以隐藏或显示。如果您想阻止某些列被隐藏，请将这些列的enableHiding列选项设置为false 。

```tsx
const columns = [
  {
    header: 'ID',
    accessorKey: 'id',
    enableHiding: false, // disable hiding for this column
  },
  {
    header: 'Name',
    accessor: 'name', // can be hidden
  },
];
```

示例

```tsx
export function DataTableViewOptions<TData>({
  table,
  getColumnLabel,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='ms-auto hidden h-8 lg:flex'
        >
          <MixerHorizontalIcon className='size-4' />
          显示列
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        <DropdownMenuLabel>切换列</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllFlatColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnLabel(column.id)}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```



#### **列过滤指南**

##### [手动服务器端过滤](https://tanstack.com/table/latest/docs/guide/column-filtering#manual-server-side-filtering)

手动服务器端过滤不需要getFilteredRowModel表选项。您传递给表的数据应该已经过过滤。但是，如果您已传递getFilteredRowModel表选项，则可以通过将manualFiltering选项设置为true来指示表跳过该操作。

```tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // getFilteredRowModel: getFilteredRowModel(), // not needed for manual server-side filtering
  manualFiltering: true,
})
```



##### [列筛选状态](https://tanstack.com/table/latest/docs/guide/column-filtering#column-filter-state)

```tsx
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]) // can set initial column filter state here
//...
const table = useReactTable({
  columns,
  data,
  //...
  state: {
    columnFilters,
  },
  onColumnFiltersChange: setColumnFilters,
})
```

