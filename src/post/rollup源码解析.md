## 环境配置

### 项目clone代理

 设置http代理

```bash
git config --global http.proxy http://127.0.0.1:7890 
```

取消http代理

```bash
 git config --global --unset http.proxy
```

### 安装rust

```bash
brew install rust
```

### 依赖安装

新建`.npmrc`文件，设置npm安装代理

```.npmrc
registry=https://registry.npmjs.org/
proxy=http://127.0.0.1:7890/
https-proxy=http://127.0.0.1:7890/
```

### 报错处理

```
sudo npm cache clean --force
npm i --verbose 查看报错详细过程
```

### 跳过PUPPETEER安装

在.zshrc中设置

```
export PUPPETEER_SKIP_DOWNLOAD=1
```

### 打包解析

```json
{
"scripts": {   
	"build:js:node": "rollup --config rollup.config.ts --configPlugin typescript --configIsBuildNode --forceExit"
	}
}
```

打包`es`和`cjs`

::: tip

打包时通过插件`addCliEntry`打包脚手架

:::

### 打包时输出sourcemap

修改`rollup.config.ts`配置

```typescript
output: {
			banner: getBanner,
			chunkFileNames: 'shared/[name].js',
			dir: 'dist',
			entryFileNames: '[name]',
			exports: 'named',
			externalLiveBindings: false,
			format: 'cjs',
			freeze: false,
			generatedCode: 'es2015',
			interop: 'default',
			sourcemap: true
}
```

### 新建调试项目

`index.mjs 配置文件`

```js
import { rollup } from 'rollup';

// 请继续浏览下面的内容获取更多关于这个选项的细节
const inputOptions = {
    input: 'src/index.js'
};

// 你可以从相同的输入创建多个输出，
// 以生成例如 CommonJS 和 ESM 这样的不同格式
const outputOptionsList = [
    {
        file: 'output/index.js',
        format: 'esm'
    }
];

build();

async function build() {
    let bundle;
    let buildFailed = false;
    try {
        // 新建一个 bundle。如果你使用的是 TypeScript 或支持该特性的运行时，
        // 你可以这样写：
        //
        // await using bundle = await rollup(inputOptions);
        //
        // 这样做就不需要在下面显式地关闭释放 bundle。
        bundle = await rollup(inputOptions);

        // 一个文件名数组，表示此产物所依赖的文件
        console.log(bundle.watchFiles);

        await generateOutputs(bundle);
    } catch (error) {
        buildFailed = true;
        // 进行一些错误报告
        console.error(error);
    }
    if (bundle) {
        // 关闭打包过程
        await bundle.close();
    }
    process.exit(buildFailed ? 1 : 0);
}

async function generateOutputs(bundle) {
    for (const outputOptions of outputOptionsList) {
        // 生成特定于输出的内存中代码
        // 你可以在同一个 bundle 对象上多次调用此函数
        // 使用 bundle.write 代替 bundle.generate 直接写入磁盘
        await bundle.write(outputOptions);
        // const { output } = await bundle.generate(outputOptions);
        
        // for (const chunkOrAsset of output) {
        //     if (chunkOrAsset.type === 'asset') {
        //         // 对于资源文件，它包含：
        //         // {
        //         //   fileName: string,              // 资源文件名
        //         //   source: string | Uint8Array    // 资源文件内容
        //         //   type: 'asset'                  // 标志它是一个资源文件
        //         // }
        //         console.log('Asset', chunkOrAsset);
        //     } else {
        //         // 对于 chunk，它包含以下内容：
        //         // {
        //         //   code: string,                  // 生成的 JS 代码
        //         //   dynamicImports: string[],      // 此 chunk 动态导入的外部模块
        //         //   exports: string[],             // 导出的变量名
        //         //   facadeModuleId: string | null, // 与此 chunk 对应的模块的 ID
        //         //   fileName: string,              // chunk 文件名
        //         //   implicitlyLoadedBefore: string[]; // 仅在此 chunk 后加载的条目
        //         //   imports: string[],             // 此 chunk 静态导入的外部模块
        //         //   importedBindings: {[imported: string]: string[]} // 每个依赖项的导入绑定
        //         //   isDynamicEntry: boolean,       // 此 chunk 是否为动态入口点
        //         //   isEntry: boolean,              // 此 chunk 是否为静态入口点
        //         //   isImplicitEntry: boolean,      // 是否应在其他 chunk 之后仅加载此 chunk
        //         //   map: string | null,            // 如果存在，则为源映射
        //         //   modules: {                     // 此 chunk 中模块的信息
        //         //     [id: string]: {
        //         //       renderedExports: string[]; // 包含的导出变量名
        //         //       removedExports: string[];  // 已删除的导出变量名
        //         //       renderedLength: number;    // 此模块中剩余代码的长度
        //         //       originalLength: number;    // 此模块中代码的原始长度
        //         //       code: string | null;       // 此模块中的剩余代码
        //         //     };
        //         //   },
        //         //   name: string                   // 用于命名模式的此 chunk 的名称
        //         //   preliminaryFileName: string    // 此 chunk 带有哈希占位符的初始文件名
        //         //   referencedFiles: string[]      // 通过 import.meta.ROLLUP_FILE_URL_<id> 引用的文件
        //         //   type: 'chunk',                 // 表示这是一个 chunk
        //         // }
        //         console.log('Chunk', chunkOrAsset.modules);
        //     }
        // }
    }
}

```

moduleA、moduleB自定义

## 源码解析

### 执行rollupInternal函数

#### 执行getInputOptions函数

获取InputOptions配置

##### getProcessedInputOptions处理input配置

###### normalizePluginOption标准化插件列表过滤空值

###### getSortedValidatedPlugins根据插件的options属性的order字段对插件进行归类排序，分为pre、normal、post插件

```typescript
	const plugins = getSortedValidatedPlugins(
		'options',
		await normalizePluginOption(inputOptions.plugins)
	);
```

```typescript
export function getSortedValidatedPlugins(
	hookName: keyof FunctionPluginHooks | AddonHooks,
	plugins: readonly Plugin[],
	validateHandler = validateFunctionPluginHandler
): Plugin[] {
	const pre: Plugin[] = [];
	const normal: Plugin[] = [];
	const post: Plugin[] = [];
	for (const plugin of plugins) {
		const hook = plugin[hookName];
		if (hook) {
			if (typeof hook === 'object') {
        // 校验handler是否为方法
				validateHandler(hook.handler, hookName, plugin);
				if (hook.order === 'pre') {
					pre.push(plugin);
					continue;
				}
				if (hook.order === 'post') {
					post.push(plugin);
					continue;
				}
			} else {
				validateHandler(hook, hookName, plugin);
			}
			normal.push(plugin);
		}
	}
	return [...pre, ...normal, ...post];
}
```

###### 顺序执行插件的options钩子来合并inputOptions值

[sequential原理](https://cn.rollupjs.org/plugin-development/#build-hooks)

```typescript
for (const plugin of plugins) {
		const { name, options } = plugin;
		const handler = 'handler' in options! ? options.handler : options!;
		const processedOptions = await handler.call(
			{
				debug: getLogHandler(LOGLEVEL_DEBUG, 'PLUGIN_LOG', logger, name, logLevel),
				error: (error_): never =>
					error(logPluginError(normalizeLog(error_), name, { hook: 'onLog' })),
				info: getLogHandler(LOGLEVEL_INFO, 'PLUGIN_LOG', logger, name, logLevel),
				meta: { rollupVersion, watchMode },
				warn: getLogHandler(LOGLEVEL_WARN, 'PLUGIN_WARNING', logger, name, logLevel)
			},
			inputOptions
		);
		if (processedOptions) {
			inputOptions = processedOptions;
		}
	}
```

##### normalizeInputOptions标准化inputOptions

###### normalizePluginOption标准化插件列表过滤空值

###### 返回标准化inputOptions(***添加默认值***)

```typescript
	const options: NormalizedInputOptions & InputOptions = {
		//***
    // 省略不重要属性
    //***
		external: getIdMatcher(config.external),
		input: getInput(config),// 标准化config.input入口文件配置为数组
		makeAbsoluteExternalsRelative: config.makeAbsoluteExternalsRelative ?? 'ifRelativeSource',// 控制外部依赖路径的处理方式
		moduleContext: getModuleContext(config, context),//为模块设置上下文
		perf: config.perf || false,//启用性能监控
		plugins,// 插件
		preserveEntrySignatures: config.preserveEntrySignatures ?? 'exports-only',//控制入口模块的导出签名保留方式
		preserveSymlinks: config.preserveSymlinks || false,// 是否保留符号链接
		shimMissingExports: config.shimMissingExports || false,// 为缺失的导出创建垫片
		treeshake: getTreeshake(config)//配置代码摇树优化
	};
```

getIdMatcher 返回external匹配函数，指定外部依赖，不打包进bundle，可以根据正则和ID匹配第三方依赖

```
const getIdMatcher = <T extends any[]>(
	option:
		| undefined
		| boolean
		| string
		| RegExp
		| (string | RegExp)[]
		| ((id: string, ...parameters: T) => boolean | null | void)
): ((id: string, ...parameters: T) => boolean) => {
	if (option === true) {
		return () => true;
	}
	if (typeof option === 'function') {
		return (id, ...parameters) => (!id.startsWith('\0') && option(id, ...parameters)) || false;
	}
	if (option) {
		const ids = new Set<string>();
		const matchers: RegExp[] = [];
		for (const value of ensureArray(option)) {
			if (value instanceof RegExp) {
				matchers.push(value);
			} else {
				ids.add(value);
			}
		}
		return (id: string, ..._arguments) => ids.has(id) || matchers.some(matcher => matcher.test(id));
	}
	return () => false;
};
```

##### normalizePlugins标准化插件

遍历插件，如果插件名没有设置，添加默认插件名

`at position 1`、`at position 2`等

```
function normalizePlugins(plugins: readonly Plugin[], anonymousPrefix: string): void {
	for (const [index, plugin] of plugins.entries()) {
		if (!plugin.name) {
			plugin.name = `${anonymousPrefix}${index + 1}`;
		}
	}
}
```

#### 初始化graph模块依赖图

#### 执行catchUnfinishedHookActions

管理进程退出时的插件钩子检测，提供了更好的错误诊断信息

#### 执行插件的`buildStart`钩子

```typescript
await graph.pluginDriver.hookParallel('buildStart', [inputOptions]);
```

可以看到调用的是模块依赖图的插件驱动的hookParallel方法

#### 执行模块依赖图构建

```typescript
await graph.build();
```

## graph模块依赖图详解

```typescript
const graph = new Graph(inputOptions, watcher);
```

### 初始化类属性

```typescript
	readonly astLru = flru<ProgramNode>(5);// AST（抽象语法树）的LRU缓存，最多缓存5个AST节点
	readonly cachedModules = new Map<string, ModuleJSON>();// 缓存已解析的模块信息
	readonly deoptimizationTracker = new EntityPathTracker();// 跟踪需要反优化的实体路径
	entryModules: Module[] = [];// 存储入口模块列表
	readonly fileOperationQueue: Queue; // 文件操作队列，管理并发的文件读写操作
	readonly moduleLoader: ModuleLoader; // 模块加载器，负责加载和解析模块
	readonly modulesById = new Map<string, Module | ExternalModule>();// 通过ID索引所有模块（包括外部模块）
	needsTreeshakingPass = false; // 标记是否需要额外的摇树优化轮次
	readonly newlyIncludedVariableInits = new Set<ExpressionEntity>(); // 跟踪新包含的变量初始化表达式
	phase: BuildPhase = BuildPhase.LOAD_AND_PARSE;// 当前构建阶段
	readonly pluginDriver: PluginDriver;// 插件驱动器，管理所有插件的执行
	readonly pureFunctions: PureFunctions;// 存储纯函数信息，用于摇树优化
	readonly scope = new GlobalScope();// 全局作用域，管理变量和函数声明
	readonly watchFiles: Record<string, true> = Object.create(null); // 需要监听的文件列表（用于watch模式）
	watchMode = false;// 是否处于监听模式

	private readonly externalModules: ExternalModule[] = []; // 外部模块列表
	private implicitEntryModules: Module[] = []; // 隐式入口模块（通过动态导入发现的）
	private modules: Module[] = []; // 所有内部模块的数组
	declare private pluginCache?: Record<string, SerializablePluginCache>; // 插件缓存，存储插件的序列化缓存数据
```

### 执行构造函数

#### 新建插件驱动实例

```typescript
this.pluginDriver = new PluginDriver(this, options, options.plugins, this.pluginCache);
```

##### 初始化类属性

```typescript
	public readonly emitFile: EmitFile;// 文件发射器，允许插件生成额外的文件（如资源文件、CSS等）
	public finaliseAssets: () => void;// 完成资源文件的处理，确定最终的文件名和路径
	public getFileName: (fileReferenceId: string) => string;// 根据文件引用ID获取最终的文件名
	public readonly setChunkInformation: (facadeChunkByModule: ReadonlyMap<Module, Chunk>) => void;// 设置块信息，建立模块与块之间的映射关系 
	public readonly setOutputBundle: (
		bundle: OutputBundleWithPlaceholders,
		outputOptions: NormalizedOutputOptions
	) => void; // 设置输出包信息，包含所有生成的文件和配置

	private readonly fileEmitter: FileEmitter;// 内部文件发射器，处理插件的文件发射请求
	private readonly pluginContexts: ReadonlyMap<Plugin, PluginContext>;// 插件上下文映射，为每个插件提供独立的上下文
	private readonly plugins: readonly Plugin[];// 所有注册的插件列表
	private readonly sortedPlugins = new Map<AsyncPluginHooks, Plugin[]>();// 按钩子类型分组的插件，用于并行执行
	private readonly unfulfilledActions = new Set<HookAction>();// 未完成的钩子操作集合
	private readonly compiledPluginFilters = {
		idOnlyFilter: new WeakMap<Pick<HookFilter, 'id'>, PluginFilter | undefined>(),
		transformFilter: new WeakMap<HookFilter, TransformHookFilter | undefined>()
	};// 编译后的插件过滤器缓存，提高过滤性能

```

##### 执行构造函数

###### 新建文件发射器

```typescript
this.fileEmitter = new FileEmitter(
			graph,
			options,
			basePluginDriver && basePluginDriver.fileEmitter
		);
```

- 初始化类属性

  ```typescript
  private facadeChunkByModule: ReadonlyMap<Module, Chunk> | null = null;// 模块到其对应块的映射关系，用于确定模块属于哪个块
  	private readonly filesByReferenceId: Map<string, ConsumedFile>;// 通过引用ID索引所有已发射的文件
  	private nextIdBase = 1;// 下一个文件引用ID的基础值，用于生成唯一的引用ID
  	private output: FileEmitterOutput | null = null; // 当前输出配置，包含输出目录、文件名模式等信息
  	private outputFileEmitters: FileEmitter[] = [];// 当前输出配置，包含输出目录、文件名模式等信息
  ```

- 执行构造函数

  初始化通过引用ID索引所有已发射的文件Map

  ```typescript
  this.filesByReferenceId = baseFileEmitter
  			? new Map(baseFileEmitter.filesByReferenceId)
  			: new Map();
  ```

###### 方法委托：将 FileEmitter 的方法委托给 PluginDriver

::: tip

这样设计使得PluginDriver可以方便地使用FileEmitter 发射功能，而不需要直接访问 FileEmitter 实例。避免FileEmitter 实例暴露

:::

```typescript
this.emitFile = this.fileEmitter.emitFile.bind(this.fileEmitter);
this.getFileName = this.fileEmitter.getFileName.bind(this.fileEmitter);
this.finaliseAssets = this.fileEmitter.finaliseAssets.bind(this.fileEmitter);
this.setChunkInformation = this.fileEmitter.setChunkInformation.bind(this.fileEmitter);
this.setOutputBundle = this.fileEmitter.setOutputBundle.bind(this.fileEmitter);
```

###### 为每个插件生成一个插件上下文，插件上下文包含了插件在 Rollup 构建过程中需要的所有方法和属性。

```typescript
this.plugins = [...(basePluginDriver ? basePluginDriver.plugins : []), ...userPlugins];
const existingPluginNames = new Set<string>();

this.pluginContexts = new Map(
  this.plugins.map(plugin => [
    plugin,
    getPluginContext(plugin, pluginCache, graph, options, this.fileEmitter, existingPluginNames)
  ])
);
```

```typescript
export function getPluginContext(
	plugin: Plugin,
	pluginCache: Record<string, SerializablePluginCache> | void,
	graph: Graph,
	options: NormalizedInputOptions,
	fileEmitter: FileEmitter,
	existingPluginNames: Set<string>
): PluginContext {
	// 省略缓存相关代码。。。
	return {
    // 省略不重要属性。。。
		addWatchFile(id) {
			graph.watchFiles[id] = true;
		}, // 添加需要监听的文件
		cache: cacheInstance, // 插件缓存实例
		emitFile: fileEmitter.emitFile.bind(fileEmitter),// 发射文件
		getFileName: fileEmitter.getFileName, // 获取文件最终名称
		getModuleIds: () => graph.modulesById.keys(), // 获取所有模块ID
		getModuleInfo: graph.getModuleInfo, // 获取模块信息
		getWatchFiles: () => Object.keys(graph.watchFiles), // 获取监听的文件列表
		load(resolvedId) {
			return graph.moduleLoader.preloadModule(resolvedId);
		}, // 预加载模块
		meta: {
			rollupVersion,
			watchMode: graph.watchMode
		}, // 元信息
		parse: parseAst, // 解析代码为AST
		resolve(source, importer, { attributes, custom, isEntry, skipSelf } = BLANK) {
			skipSelf ??= true;
			return graph.moduleLoader.resolveId(
				source,
				importer,
				custom,
				isEntry,
				attributes || EMPTY_OBJECT,
				skipSelf ? [{ importer, plugin, source }] : null
			);
		}, // 解析模块ID 和path.resolve类似作用
		setAssetSource: fileEmitter.setAssetSource, // 设置资源文件内容
	};
}
```






###### getResolvedIdWithDefaults 标准化resolveId

```typescript
	private getResolvedIdWithDefaults(
		resolvedId: NormalizedResolveIdWithoutDefaults | null,
		attributes: Record<string, string>
	): ResolvedId | null {
		if (!resolvedId) {
			return null;
		}
		const external = resolvedId.external || false;
		return {
			attributes: resolvedId.attributes || attributes, // 导入属性
			external, // 外部模块标识
			id: resolvedId.id, // 模块绝对路径
			meta: resolvedId.meta || {}, // 元数据
			moduleSideEffects:
				resolvedId.moduleSideEffects ?? this.hasModuleSideEffects(resolvedId.id, !!external), // 模块副作用,默认返回true
			resolvedBy: resolvedId.resolvedBy ?? 'rollup',// 解析来源,如果是插件则用的是插件名称name
			syntheticNamedExports: resolvedId.syntheticNamedExports ?? false // 合成命名导出
		};
	}
```



###### loadEntryModule




    ```typescript
    const pluginResult = await resolveIdViaPlugins(
     		source,
     		importer,
     		pluginDriver,
     		moduleLoaderResolveId,
     		skip,
     		customOptions,
     		isEntry,
     		attributes
     	);
    ```

    - 在函数中调用插件驱动的hookFirstAndGetPlugin方法，

      按“first”语义顺序执行插件的异步钩子，返回第一个非空结果以及产生该结果的插件
      
      ```typescript
      return pluginDriver.(
      		'resolveId',
      		[source, importer, { attributes, custom: customOptions, isEntry }],
      		replaceContext,
      		skipped
      	);
      ```
      
    

  - 如果结果不为null,则返回标准格式

    ```
    {
        id: resolveIdResult,
        resolvedBy: plugin.name
    }
    ```
  
  - 如果不是入口模块,并且不是相对路径和绝对路径，则不处理，`return null`
  
  - 默认处理模块路径
  
    - 赋值importer 
  
      ```typescript
      	importer ? resolve(dirname(importer), source) : resolve(source),
      ```
  
    - 确保文件名在目录中确实存在，返回文件的绝对路径
  
      ```typescript
      return (
      		(await findFile(file, preserveSymlinks, fs)) ??
      		(await findFile(file + '.mjs', preserveSymlinks, fs)) ??
      		(await findFile(file + '.js', preserveSymlinks, fs))
      	);
      ```
  
      ```typescript
      async function findFile(
      	file: string,
      	preserveSymlinks: boolean,
      	fs: RollupFsModule
      ): Promise<string | undefined> {
      	try {
      		const stats = await fs.lstat(file); // 获取文件状态
      		if (!preserveSymlinks && stats.isSymbolicLink()) 
      			return await findFile(await fs.realpath(file), preserveSymlinks, fs); 
          // 当 preserveSymlinks = false 时，跟随符号链接,使用 fs.realpath() 获取符号链接指向的真实路径,递归调用 findFile 继续查找真实文件
      		if ((preserveSymlinks && stats.isSymbolicLink()) || stats.isFile()) {
      			// check case
      			const name = basename(file);
      			const files = await fs.readdir(dirname(file));
      			
      			if (files.includes(name)) return file;
      		}
      	} catch {
      		// suppress
      	}
      }
      ```

- 如果`resolveIdResult===false` 或者有`external为true`，则不处理
- 调用getResolvedIdWithDefaults方法获取标准化的ResolvedId

- 调用fetchModule方法

###### addEntryModules

- 记录第一个新入口模块的索引，并更新下一个索引值

  ```typescript
  const firstEntryModuleIndex = this.nextEntryModuleIndex;
  this.nextEntryModuleIndex += unresolvedEntryModules.length;
  ```

- 记录第一个新入口模块的块名称优先级，并更新下一个优先级值

  ```typescript
  const firstChunkNamePriority = this.nextChunkNamePriority;
  this.nextChunkNamePriority += unresolvedEntryModules.length;
  ```

- 并行加载所有未解析的入口模块

  ```typescript
  Promise.all(
    unresolvedEntryModules.map(({ id, importer }) =>
      this.loadEntryModule(id, true, importer, null)
    )
  )
  ```

- 遍历加载完成的模块，为每个模块设置属性

  ```typescript
  for (const [index, entryModule] of entryModules.entries()) {
          entryModule.isUserDefinedEntryPoint =
            entryModule.isUserDefinedEntryPoint || isUserDefined;
          addChunkNamesToModule(
            entryModule,
            unresolvedEntryModules[index],
            isUserDefined,
            firstChunkNamePriority + index
          );
          const existingIndexedModule = this.indexedEntryModules.find(
            indexedModule => indexedModule.module === entryModule
          );
          if (existingIndexedModule) {
            existingIndexedModule.index = Math.min(
              existingIndexedModule.index,
              firstEntryModuleIndex + index
            );
          } else {
            this.indexedEntryModules.push({
              index: firstEntryModuleIndex + index,
              module: entryModule
            });
          }
        }
        this.indexedEntryModules.sort(({ index: indexA }, { index: indexB }) =>
          indexA > indexB ? 1 : -1
        );
  ```

##### 执行构造函数

```typescript
	this.hasModuleSideEffects = options.treeshake
			? options.treeshake.moduleSideEffects
			: () => true;
```

如果有treeshake配置，则使用options.treeshake.moduleSideEffects

#### 新建队列

```typescript
this.fileOperationQueue = new Queue(options.maxParallelFileOps);
```

一个用于控制并发任务执行的队列，根据maxParallelFileOps数量，开启多个while循环，每个循环中顺序执行异步任务

