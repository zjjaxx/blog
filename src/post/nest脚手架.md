

## 简介

nest-universal 通用模版脚手架

## [npm create命令](https://docs.npmjs.com/cli/v8/commands/npm-init)

```bash
npm init <package-spec> 
```

"npm init 命令可用于初始化新的或现有的 npm 包。此处的 initializer 是指名为 create- 的 npm 包，该包将通过 npm-exec 安装，然后执行其主二进制文件——通常用于创建或更新 package.json 文件，并运行其他与初始化相关的操作。

***npm create 是npm init的别名，而npx 又是npm exec的别名，npm exec此命令允许您从 npm 包（本地安装或远程获取的包）运行任意命令，如果请求的包在本地项目依赖项中不存在，则会将其安装到 npm 缓存中的某个文件夹中，该文件夹会在执行过程中添加到 `PATH` 环境变量中。此时会打印提示（可以通过提供 `--yes` 或 `--no` 来隐藏提示）。如果包在 `package.json` 中的 `bin` 字段中有一个条目，或者所有条目都是同一命令的别名，那么将使用该命令。***

init命令会转换为相应的npm exec操作，具体如下

- `npm init foo` -> `npm exec create-foo`
- `npm init @usr/foo` -> `npm exec @usr/create-foo`
- `npm init @usr` -> `npm exec @usr/create`
- `npm init @usr@2.0.0` -> `npm exec @usr/create@2.0.0`
- `npm init @usr/foo@2.0.0` -> `npm exec @usr/create-foo@2.0.0`

如果省略初始化配置（仅调用`npm init`），init将回退到旧版初始化行为。它会询问一系列问题，然后为你生成package.json文件



注意：如果用户已全局安装了 create- 包，npm init 将默认使用该版本。若希望 npm 使用最新版本或指定版本，必须明确声明：

```bash
npm init foo@latest
```

## 解析参数parseArgs

```typescript
 const { values: argv, positionals } = parseArgs({
    args: process.argv.slice(2), // 配置 parseArgs 时指定要解析的参数来源
    // 定义 parseArgs 要解析的命令行选项
    options: {
      force: {
        type: "boolean",
        short: "f",
      },
      version: {
        type: "boolean",
        short: "v",
      },
    },
    strict: true, // 严格模式，不允许未知参数
    allowPositionals: true, // 允许位置参数
  });
```

***positionals表示目录参数，可以是项目目录名和包名***

## 确认目录是否存在

- 判断路径是否存在

  ```js
  import { existsSync } from 'node:fs';
  
  if (existsSync('/etc/passwd'))
    console.log('The path exists.');
  ```

  如果路径存在则返回 true，否则返回 false。

- 读取目录内容。

  ```js
  const files = fs.readdirSync(dir);
  ```

  如果length大于0，则表明目录存在，否则表示不存在

## 目录存在则清空目录

- readdirSync读取目录内容，遍历每一个文件
- lstatSync读取文件信息，判断是否为目录，和**`statSync`**的区别是:若路径是软链接，需用 `lstatSync` 检测链接本身，而非其目标文件
- 如果是目录的话，则先递归执行该函数，然后rmdirSync删除该目录
- 如果是文件或则软链接的话，unlinkSync删除

## 目录不存在则创建

- mkdirSync

## 初始化package.json文件

- writeFileSync

## 渲染模版

- 获取模版路径 `const templateRoot = fileURLToPath(new URL("../template", import.meta.url));在commonjs 等效代码`const templateRoot = path.join(__dirname, '../template')`

  import.meta.url 表示当前文件路径

  fileURLToPath用于将文件 URL（如 `file://` 协议）转换为操作系统的本地路径格式。最终 `templateRoot` 变量存储的是 **模板目录的绝对路径**,例如：

  ```js
  // 结果示例（Unix系统）：
  '/Users/project/template'
  // 或 Windows系统：
  'C:\\project\\template'
  ```

- 开始渲染`base`模版 ,传入模版路径和要生成的项目路径和callbacks数组

  - 使用 fs.statSync 方法同步获取 base 路径对应的文件或目录的状态信息

  - 如果是目录，先判断是否是node_modules，如果是则跳过，不是则创建目录`   fs.mkdirSync(dest, { recursive: true });`如果父级不存在也一同创建。 readdirSync读取目录内容，遍历每一个文件,执行递归 return

  - 如果是文件，`path.basename()` 方法返回路径的最后一部分

    ```js
    path.basename('/foo/bar/baz/asdf/quux.html');
    // Returns: 'quux.html'
    ```

    - 如果是package.json文件，则合并package.json return
    - 如果是以`_`开头的文件，则将dest文件名中的 "_" 替换为 "."
    - 如果是_gitignore文件，则合并gitignore return
    - 如果是以`.data.mjs`结尾的文件, 向 callbacks 数组中添加一个异步回调函数，该函数会在处理模板文件时被调用，函数会动态导入`.data.mjs`结尾的模块，然后执行模块导出的getData函数把数据存放在以删除`.data.mjs`后缀作为key的对象中 return
    - copyFileSync同步将src复制到dest。默认情况下，如果dest已存在则会被覆盖。

- 同理渲染auth、cache、mail、swagger模版
- 定义dataStore，执行callbacks回调，往dataStore存入所有的文件和数据映射

## 渲染handlebars模版

- readdirSync读取目录内容，遍历每一个文件
- lstatSync读取文件信息，判断是否为目录
- 如果是目录的话，则先递归执行该函数
- 如果是文件的话，则判断是否以`.handlebars`结尾的
- 如果是的话，移除`.handlebars`后缀，然后根据文件路径从dataStore匹配渲染数据，渲染模版
- 生成文件，移除原来的模版文件

## 识别正在使用的包管理器

- `process.env.npm_config_user_agent`

## 输出结束语



