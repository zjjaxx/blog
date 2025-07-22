##  优势

- TS友好，基于 Oxc 和 Rolldown 构建和生成声明文件（dts），速度极快！🚀
- 开发vue组件库很爽🚀
- 配置简单🚀
- 支持 Rollup、Rolldown、unplugin 插件以及部分 Vite 插件。
- 兼容 tsup 的主要选项和功能，确保平滑过渡。

::: tip

`tsdown` 被定位为 **[Rolldown Vite](https://github.com/vitejs/rolldown-vite) 库模式** 的核心基座，为库开发者提供长期稳定、功能完备的开发体验。

:::

## 入口文件

### 带别名的入口文件

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    main: 'src/index.ts',
    utils: 'src/utils.ts',
  },
})
```

此配置会生成两个打包文件：`src/index.ts`（输出为 `dist/main.js`）和 `src/utils.ts`（输出为 `dist/utils.js`）。

### 使用 Glob 模式

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/**/*.ts',
})
```

此配置会将 `src` 目录及其子目录中的所有 `.ts` 文件作为入口点。

## 配置文件

`tsdown` 还支持从配置文件返回一个**配置数组**。这允许您在一次运行中使用不同的设置构建多个输出

```typescript
import { defineConfig } from 'tsdown/config'

export default [
  defineConfig({
    entry: 'src/entry1.ts',
    platform: 'node',
  }),
  defineConfig({
    entry: 'src/entry2.ts',
    platform: 'browser',
  }),
]
```

## 声明文件 (dts)

::: tip

`tsdown` 内部使用 [rolldown-plugin-dts](https://github.com/sxzz/rolldown-plugin-dts) 来生成和打包 `.d.ts` 文件。该插件专为高效处理声明文件生成而设计，并与 `tsdown` 无缝集成。

:::

### 启用 dts 生成

如果您的 `package.json` 中包含 `types` 或 `typings` 字段，`tsdown` 会**默认启用**声明文件生成。

您也可以通过 CLI 的 `--dts` 选项或在配置文件中设置 `dts: true` 来显式启用 `.d.ts` 文件生成。

### 声明文件映射（Declaration Map）

声明文件映射允许 `.d.ts` 文件映射回其原始的 `.ts` 源文件，这在 monorepo 场景下对于导航和调试尤为有用。详细说明请参阅 [TypeScript 官方文档](https://www.typescriptlang.org/tsconfig/#declarationMap)。

您可以通过以下任一方式启用声明文件映射（无需同时设置）：

1. 在 `tsconfig.json` 中启用

   ```json
   {
     "compilerOptions": {
       "declarationMap": true
     }
   }
   ```

2. 在 tsdown 配置中启用

   ```typescript
   import { defineConfig } from 'tsdown'
   
   export default defineConfig({
     dts: {
       sourcemap: true,
     },
   })
   ```

### 性能注意事项

::: tip

如果速度对您的工作流程至关重要，建议在 `tsconfig.json` 中启用 `isolatedDeclarations`。

:::

`.d.ts` 生成的性能取决于您的 `tsconfig.json` 配置：

如果您的 `tsconfig.json` 中启用了 `isolatedDeclarations` 选项，`tsdown` 将使用 **oxc-transform** 进行 `.d.ts` 生成。这种方式**极其快速**，强烈推荐以获得最佳性能。

```json
{
  "compilerOptions": {
    "isolatedDeclarations": true
  }
}
```

如果未启用 `isolatedDeclarations`，`tsdown` 会回退使用 TypeScript 编译器生成 `.d.ts` 文件。虽然这种方式可靠，但相较于 `oxc-transform` 会慢一些。

## 输出格式

默认情况下，`tsdown` 会生成 [ESM](https://nodejs.org/api/esm.html)（ECMAScript 模块）格式的 JavaScript 代码

你可以通过format字段进行配置

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    fromVite: true,
    format: ['esm', 'cjs'],
    dts: {
      vue: true,
    },
  },
])
```

## 清理

默认情况下，`tsdown` 会在每次构建之前**清理输出目录**（`outDir`）。这可以确保移除之前构建中生成的文件，防止过时或未使用的文件留在输出目录中。

## 依赖处理

在使用 `tsdown` 打包时，依赖会被智能处理，以确保您的库保持轻量且易于使用。以下是 `tsdown` 如何处理不同类型依赖以及如何自定义此行为。

### 默认行为

默认情况下，`tsdown` **不会打包** 在 `package.json` 中 `dependencies` 和 `peerDependencies` 下列出的依赖,但是***会打包***项目中实际引用的 `devDependencies` 和幻影依赖

- **`dependencies`**：这些依赖会被视为外部依赖，不会被包含在打包文件中。当用户安装您的库时，npm（或其他包管理器）会自动安装这些依赖。

- **`peerDependencies`**：这些依赖同样被视为外部依赖。您的库的使用者需要手动安装这些依赖，尽管某些包管理器可能会自动处理。

  devDependencies` 和幻影依赖

- **`devDependencies`**：在 `package.json` 中列为 `devDependencies` 的依赖，**只有在您的源码中实际被 import 或 require 时才会被打包**。

- **幻影依赖（Phantom Dependencies）**：存在于 `node_modules` 文件夹中但未明确列在 `package.json` 中的依赖，**只有在您的代码中实际被使用时才会被打包**。

### 自定义依赖处理

`tsdown` 提供了两个选项来覆盖默认行为：

#### `external`

`external` 选项允许您显式将某些依赖标记为外部依赖，确保它们不会被打包进您的库

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  external: ['lodash', /^@my-scope\//],
})
```

#### `noExternal`

noExternal` 选项允许您强制将某些依赖打包，即使它们被列为 `dependencies` 或 `peerDependencies

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  noExternal: ['some-package'],
})
```

### 声明文件中的依赖处理

## 构建目标（Target）

::: warning

仅限语法降级

`target` 选项仅影响语法转换。它不会为目标环境中可能不存在的 API 提供运行时 polyfill 或 shim。例如，如果您的代码使用了 `Promise`，但目标环境不支持原生 `Promise`，则不会自动添加 polyfill。

:::

`target` 设置决定了哪些 JavaScript 和 CSS 特性会被降级（转换为旧语法），哪些会在输出中保持原样。这使您可以控制打包代码与特定环境或 JavaScript 版本的兼容性。

例如，如果目标是 `es5` 或更低版本，箭头函数 `() => this` 将被转换为等效的 `function` 表达式。

### 默认目标行为

默认情况下，`tsdown` 会读取您的 `package.json` 中的 `engines.node` 字段，并自动将目标设置为所声明的最低兼容 Node.js 版本。这可以确保您的输出与您为包声明的运行环境兼容。

例如，如果您的 `package.json` 包含：

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 支持的目标

- ECMAScript 版本：`es5`、`es2015`、`es2020`、`esnext` 等
- 浏览器版本：`chrome100`、`safari18`、`firefox110` 等
- Node.js 版本：`node20.18`、`node16` 等

### 运行时辅助工具

在降级某些现代 JavaScript 特性时，`tsdown` 可能需要由 `@oxc-project/runtime` 包提供的运行时辅助工具。例如，将 `await` 表达式转换为旧语法时，需要使用辅助工具 `@oxc-project/runtime/helpers/asyncToGenerator`。

如果您的目标环境包含需要这些辅助工具的特性，您可能需要在项目中安装 `@oxc-project/runtime` 包

```bash
npm install @oxc-project/runtime
```

如果您希望**内联辅助函数**，而不是从运行时包中导入它们，可以将 `@oxc-project/runtime` 作为开发依赖进行安装：

```bash
npm install -D @oxc-project/runtime
```

### CSS 目标

`tsdown` 也可以将 CSS 特性降级以匹配您指定的浏览器目标。例如，如果目标是 `chrome108` 或更低版本，CSS 嵌套的 `&` 选择器将被展开为平铺结构。

要启用 CSS 降级，您需要手动安装 [`unplugin-lightningcss`](https://github.com/unplugin/unplugin-lightningcss)：

```bash
npm install -D unplugin-lightningcss
```

安装后，只需在配置或 CLI 选项中设置您的浏览器目标（例如 `target: 'chrome100'`），CSS 降级将会自动启用。

## 运行平台（Platform）

运行平台用于指定打包后 JavaScript 代码的目标运行环境。

默认情况下，`tsdown` 针对 `node` 运行时进行打包，但您可以通过 `--platform` 选项自定义目标平台：

### 可用平台

- **`node`：** 针对 [Node.js](https://nodejs.org/) 运行时及兼容环境（如 Deno 和 Bun）。这是默认平台，Node.js 内置模块（如 `fs`、`path`）会被自动解析。适合工具链或服务端项目。
- **`browser`：** 针对 Web 浏览器（如 Chrome、Firefox）。适用于前端项目。如果您的代码使用了 Node.js 内置模块，将会显示警告，您可能需要使用 polyfill 或 shim 来确保兼容性。
- **`neutral`：** 与平台无关的目标，不对特定运行时环境做假设。如果您的代码需要在多个环境中运行，或者您希望完全控制运行时行为，可以选择此选项。特别适合用于 Node.js 和浏览器环境的库或共享代码。

## 源映射（Source Map）

源映射是连接原始开发代码与在浏览器或其他环境中运行的优化代码的桥梁，大大简化了调试过程。它允许您将错误和日志追溯到原始的源文件，即使代码已经被压缩或打包。

您可以通过使用 `--sourcemap` 选项指示 `tsdown` 生成源映射

## Shims（兼容代码）

Shims 是一些小型代码片段，用于在不同的模块系统（如 CommonJS (CJS) 和 ECMAScript Modules (ESM)）之间提供兼容性。在 `tsdown` 中，shims 用于弥合这些系统之间的差异，确保您的代码能够在不同环境中顺畅运行。

### ESM 中的 CommonJS 变量

在 CommonJS 中，`__dirname` 和 `__filename` 是内置变量，分别提供当前模块的目录路径和文件路径。然而，这些变量在 ESM 中**默认不可用**。

为了提高兼容性，当启用 `shims` 选项时，`tsdown` 会为 ESM 输出自动生成这些变量。

### ESM 中的 `require` 函数

当在 ESM 输出中使用 `require` 函数且 `platform` 设置为 `node` 时，无论是否启用 `shims`，`tsdown` 都会**自动注入基于 Node.js `createRequire` 的 `require` shim**。这样可以确保您在 Node.js 环境下的 ESM 模块中无需手动设置即可直接使用 `require`。

### CommonJS 中的 ESM 变量

即使未启用 `shims` 选项，`tsdown` 也会在 CommonJS 输出中自动生成以下 ESM 特定变量的 shims：

- `import.meta.url`
- `import.meta.dirname`
- `import.meta.filename`

这些变量用于确保在 CommonJS 环境中使用 ESM 特性时的兼容性

## 自动生成包导出

::: tip

`tsdown` 提供了一个实验性功能，可以自动推断并生成 `package.json` 中的 `exports`、`main`、`module` 和 `types` 字段。这有助于确保您的包导出始终与构建输出保持同步且正确。

:::

### 启用自动导出

您可以在 `tsdown` 配置文件中设置 `exports: true` 来启用此功能：

### 导出所有文件

默认情况下，仅导出入口文件。如果您希望导出所有文件（包括未列为入口的文件），可以启用 `exports.all` 选项：

```typescript
export default defineConfig({
  exports: {
    all: true,
  },
})
```

### 开发时源码链接

在开发过程中，您可能希望 `exports` 字段直接指向源码文件，以便更好地调试和获得编辑器支持。可以通过设置 `exports.devExports` 为 `true` 来启用。启用后，`package.json` 中生成的 `exports` 字段会链接到您的源码。构建产物的导出信息会写入 `publishConfig` 字段，在使用 `yarn` 或 `pnpm` 的 `pack`/`publish` 命令时会覆盖顶层的 `exports` 字段