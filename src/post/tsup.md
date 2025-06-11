
## 简介

无需配置，用esbuild打包你的TypeScript库。

### 支持打包格式

- js
- json
- mjs
- ts
- tsx
- css 实验性支持

## 命令行语法

```bash
// tsup [...files]
tsup src/index.ts src/cli.ts
```

这将输出 dist/index.js 和 dist/cli.js。



## 打包逻辑

如果你使用tsup为Node.js应用程序/API构建，通常不需要打包依赖项，这甚至可能导致问题，例如在输出ESM格式时

默认情况下，tsup会打包所有通过import引入的模块，但会自动排除package.json中dependencies和peerDependencies声明的依赖项。你也可以使用external参数来标记其他需要排除的包



示例

```json
{
  "name": "my-project",
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

```typescript
import lodash from 'lodash';
import React from 'react';
import moment from 'moment';

console.log(lodash, React, moment);
```

**场景 1：默认行为**

直接运行 `tsup src/index.ts`：

- **自动排除的依赖**：`lodash`（在 `dependencies` 中）和 `react`（在 `peerDependencies` 中）。
- **会被打包的依赖**：`moment`（因为它不在 `dependencies` 或 `peerDependencies` 中，且没有手动排除）。

**输出结果**：

- 最终生成的 bundle（如 `dist/index.js`）中会包含 `moment` 的代码，但不会包含 `lodash` 和 `react`。

**场景 2：手动排除其他依赖**

假设我们想排除 `moment`，即使它不在 `dependencies` 或 `peerDependencies` 中。运行：

```bash
tsup src/index.ts --external moment
```

**结果**：

- `lodash`、`react`、`moment` 均被排除，不会打包进最终文件。
- 运行时需要确保这些依赖已通过其他方式安装（如用户项目中的 `node_modules`）。

***如果它未能排除某些包，该库还提供了一个特殊可执行文件`tsup-node`，可自动跳过捆绑任何Node.js包。***

```bash
tsup-node src/index.ts
```

## 配置文件打包

`tsup.config.ts`

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  outDir: 'bin',
  sourcemap: true,
  dts:true,
  watch:true,
  clean: true,
  target:"es5",
  minify:true,
  shims: true,
  format:['esm',"cjs"]
})
```

- entry  打包入口文件
- dts 声明文件，如果有多个打包格式会为每个打包文件生成一份声明文件。***请注意，任何非 TypeScript 编译器（tsc）生成的声明文件都不能保证完全无误，因此在发布前最好使用 tsc 或类似 @arethetypeswrong/cli 的工具对输出进行测试。***
- sourcemap 生成sourcemap映射文件，方便开发环境调试
- format 支持的格式有`esm`, `cjs`, (default) and `iife`. ***如果你的package.json中的type字段设置为module，文件名会略有不同***

​		如果您不希望使用.mjs或.cjs等扩展名（例如希望您的库能在不支持这些扩展		名的打包工具或环境中使用），可以启用`--legacy-output`标志：

- splitting 代码拆分目前仅适用于esm输出格式，且默认启用。若需在cjs输出格式中也启用代码拆分功能，可尝试使用实验性功能——`--splitting`标志，该特性旨在突破esbuild中仅限esm格式的限制。
- target 您可以通过tsup.config.ts中的target选项或--target标志来设置生成JavaScript和/或CSS代码的目标环境。***target的默认值取自tsconfig.json中的compilerOptions.target配置项，若未指定则默认为node14。更多信息请参阅esbuild的target选项文档。***

​        ES5 support 你可以使用 --target es5 将代码编译至 ES5 版本，在该目标环		境下，你的代码会先由 esbuild 转译为 ES2020，再通过 SWC 转译为 ES5。

​		***注意Polyfill没导入***

- watch 开启监听模式。这意味着在完成初始构建后，tsup将持续监控所有已解析文件的变更。
- minify 你也可以使用 --minify 标志来压缩输出，从而减小打包体积。

- Tree shaking esbuild默认启用了tree shaking功能，但有时效果不佳，因此tsup提供了额外选项让您改用Rollup进行tree shaking。

- Inject cjs and esm shims

  启用该选项后，在构建ESM/CJS模块时会自动填充部分代码以确保功能正常，例如仅CJS模块可用的__dirname变量以及仅ESM模块可用的import.meta.url属性。

- outDir 输出目录