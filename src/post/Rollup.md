## 背景

Rollup 允许你使用新的模块系统编写代码，然后将其编译回现有的支持格式，例如 CommonJS 模块、AMD 模块和 IIFE 样式脚本。这意味着你可以编写 *对未来兼容* 的代码，并且还可以获得以下几点收益

- Tree-Shaking
- Rollup 可以通过插件 [导入现有的 CommonJS 模块](https://github.com/rollup/plugins/tree/master/packages/commonjs)。

### 配置文件

它被称为 `rollup.config.js` 或 `rollup.config.mjs`，并位于项目的根目录中。除非使用 [`--configPlugin`](https://cn.rollupjs.org/command-line-interface/#configplugin-plugin) 或 [`--bundleConfigAsCjs`](https://cn.rollupjs.org/command-line-interface/#bundleconfigascjs) 选项，否则 Rollup 将直接使用 Node 导入该文件

你也可以使用其他语言编写配置文件，比如 TypeScript。为此，安装相应的 Rollup 插件，例如 `@rollup/plugin-typescript`，并使用 [`--configPlugin`](https://cn.rollupjs.org/command-line-interface/#configplugin-plugin) 选项：

```bash
rollup --config rollup.config.ts --configPlugin typescript
```

使用 `--configPlugin` 选项将始终强制将你的配置文件先转换为 CommonJS 格式。同时，查看 [Config Intellisense](https://cn.rollupjs.org/command-line-interface/#config-intellisense) 以获取在配置文件中使用 TypeScript 类型定义的更多方法。

***有点麻烦***

你可以使用 `defineConfig` 辅助函数，

```js
// rollup.config.js
import { defineConfig } from 'rollup';

export default defineConfig({
	/* 你的配置 */
});
```

