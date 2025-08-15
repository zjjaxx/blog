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

###### [顺序执行插件的options钩子来合并inputOptions值](https://cn.rollupjs.org/plugin-development/#options)

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

#### [执行插件的`buildStart`钩子](https://cn.rollupjs.org/plugin-development/#buildstart)

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

### 重要方法

#### generateModuleGraph

##### normalizeEntryModules标准化入口模块

```typescript
function normalizeEntryModules(
	entryModules: readonly string[] | Record<string, string>
): UnresolvedModule[] {
	if (Array.isArray(entryModules)) {
		return entryModules.map(id => ({
			fileName: null, // 最终输出文件的名称
			id, // 模块的唯一标识符，通常是文件路径
			implicitlyLoadedAfter: [],// 隐式加载顺序，表示此模块应该在哪些模块之后加载
			importer: undefined,// 导入此模块的父模块
			name: null // 模块的名称，用于生成输出文件名
		}));
	}
	return Object.entries(entryModules).map(([name, id]) => ({
		fileName: null,
		id,
		implicitlyLoadedAfter: [],
		importer: undefined,
		name
	}));
}
```

返回标准格式

##### 添加入口模块

```typescript
({ entryModules: this.entryModules, implicitEntryModules: this.implicitEntryModules } =
  await this.moduleLoader.addEntryModules(normalizeEntryModules(this.options.input), true));
```

可以看到调用的是moduleLoader实例的addEntryModules方法

#### build

##### 生成模块依赖图

```typescript
await this.generateModuleGraph();
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

##### 重要方法

###### hookReduceArg0 顺序执行和处理插件异步钩子和返回值

```typescript
let promise = Promise.resolve(argument0);
		for (const plugin of this.getSortedPlugins(hookName)) {
			promise = promise.then(argument0 =>
				this.runHook(
					hookName,
					[argument0, ...rest] as Parameters<FunctionPluginHooks[H]>,
					plugin,
					replaceContext
				).then(result => reduce.call(this.pluginContexts.get(plugin), argument0, result, plugin))
			);
		}
		return promise;
```

###### hookFirstAndGetPlugin

```typescript
for (const plugin of this.getSortedPlugins(hookName)) { // 遍历插件
  if (skipped?.has(plugin)) continue;
  const result = await this.runHook(hookName, parameters, plugin, replaceContext);
  if (result != null) return [result, plugin];
}
return null;
```

按“first”语义顺序执行插件的异步钩子，返回第一个非空结果以及产生该结果的插件

没有返回null

###### getSortedPlugins

```typescript
private getSortedPlugins(
		hookName: keyof FunctionPluginHooks | AddonHooks,
		validateHandler?: (handler: unknown, hookName: string, plugin: Plugin) => void
	): Plugin[] {
		return getOrCreate(this.sortedPlugins, hookName, () =>
			getSortedValidatedPlugins(hookName, this.plugins, validateHandler)
		);
	}
```

根据钩子名称对插件进行归类排序

###### runHook

```typescript
	private runHook<H extends AsyncPluginHooks | AddonHooks>(
		hookName: H,
		parameters: unknown[],
		plugin: Plugin,
		replaceContext?: ReplaceContext | null
	): Promise<unknown> {
		// We always filter for plugins that support the hook before running it
		const hook = plugin[hookName];
		const handler = typeof hook === 'object' ? hook.handler : hook;

		if (typeof hook === 'object' && 'filter' in hook && hook.filter) {
			if (hookName === 'transform') {
				const filter = hook.filter as HookFilter;
				const hookParameters = parameters as Parameters<FunctionPluginHooks['transform']>;
				const compiledFilter = getOrCreate(this.compiledPluginFilters.transformFilter, filter, () =>
					createFilterForTransform(filter.id, filter.code)
				);
				if (compiledFilter && !compiledFilter(hookParameters[1], hookParameters[0])) {
					return Promise.resolve();
				}
			} else if (hookName === 'resolveId' || hookName === 'load') {
				const filter = hook.filter;
				const hookParameters = parameters as Parameters<FunctionPluginHooks['load' | 'resolveId']>;
				const compiledFilter = getOrCreate(this.compiledPluginFilters.idOnlyFilter, filter, () =>
					createFilterForId(filter.id)
				);
				if (compiledFilter && !compiledFilter(hookParameters[0])) {
					return Promise.resolve();
				}
			}
		}

		let context = this.pluginContexts.get(plugin)!;
		if (replaceContext) {
			context = replaceContext(context, plugin);
		}

		let action: [string, string, Parameters<any>] | null = null;
		return Promise.resolve()
			.then(() => {
				if (typeof handler !== 'function') {
					return handler;
				}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
				const hookResult = (handler as Function).apply(context, parameters);

				if (!hookResult?.then) {
					// short circuit for non-thenables and non-Promises
					return hookResult;
				}

				// Track pending hook actions to properly error out when
				// unfulfilled promises cause rollup to abruptly and confusingly
				// exit with a successful 0 return code but without producing any
				// output, errors or warnings.
				action = [plugin.name, hookName, parameters];
				this.unfulfilledActions.add(action);

				// Although it would be more elegant to just return hookResult here
				// and put the .then() handler just above the .catch() handler below,
				// doing so would subtly change the defacto async event dispatch order
				// which at least one test and some plugins in the wild may depend on.
				return Promise.resolve(hookResult).then(result => {
					// action was fulfilled
					this.unfulfilledActions.delete(action!);
					return result;
				});
			})
			.catch(error_ => {
				if (action !== null) {
					// action considered to be fulfilled since error being handled
					this.unfulfilledActions.delete(action);
				}
				return error(logPluginError(error_, plugin.name, { hook: hookName }));
			});
	}

```

- 主要功能是从插件中获取钩子函数

- 检查`transform`、`resolveId`、`load`钩子是否有过滤器，如果有的话直接结束

- 从`pluginContexts`取出插件上下文

- 把钩子函数放到微任务队列中，在微任务中执行钩子函数

  - 如果钩子函数是个同步函数，则返回结果

  - 如果钩子函数是异步函数，则用promise.resolve包裹返回的promise

    ::: tip

    虽然在这里直接返回hookResult会更优雅，
    并且将.then()处理程序放在下面.catch()处理程序的上方，
    但这样做会微妙地改变事实上的异步事件调度顺序，
    至少有一个测试和一些实际插件可能依赖于此。

    :::

###### hookParallel 并行执行异步任务

```typescript
async hookParallel<H extends AsyncPluginHooks & ParallelPluginHooks>(
		hookName: H,
		parameters: Parameters<FunctionPluginHooks[H]>,
		replaceContext?: ReplaceContext
	): Promise<void> {
		const parallelPromises: Promise<unknown>[] = [];
		for (const plugin of this.getSortedPlugins(hookName)) {
			if ((plugin[hookName] as { sequential?: boolean }).sequential) {
				await Promise.all(parallelPromises);
				parallelPromises.length = 0;
				await this.runHook(hookName, parameters, plugin, replaceContext);
			} else {
				parallelPromises.push(this.runHook(hookName, parameters, plugin, replaceContext));
			}
		}
		await Promise.all(parallelPromises);
	}
```

默认并行执行插件的钩子函数，通过sequential配置可以支持顺序和并行两种模式（***钩子函数可以使同步或则异步函数***）

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

::: tip

在插件钩子中，我们可以通过this获取插件上下文

- resolve

  跳过调用插件，执行剩余其它插件的resolveId钩子获取文件绝对路径

:::

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
		}, // 解析模块ID 
		setAssetSource: fileEmitter.setAssetSource, // 设置资源文件内容
	};
}
```



#### 新建模块加载器

```typescript
this.moduleLoader = new ModuleLoader(this, this.modulesById, this.options, this.pluginDriver);
```

##### 初始化类属性

```typescript
	private readonly hasModuleSideEffects: HasModuleSideEffects;// 判断模块是否有副作用的函数
	private readonly implicitEntryModules = new Set<Module>();// 隐式入口模块集合（通过动态导入发现的模块）
	private readonly indexedEntryModules: { index: number; module: Module }[] = [];// 带索引的入口模块数组，保持入口模块的顺序
	private latestLoadModulesPromise: Promise<unknown> = Promise.resolve();// 最新的模块加载Promise，用于协调异步加载
	private readonly moduleLoadPromises = new Map<Module, LoadModulePromise>();// 模块加载Promise的映射，避免重复加载
	private readonly modulesWithLoadedDependencies = new Set<Module>();// 依赖已加载完成的模块集合
	private nextChunkNamePriority = 0;// 下一个块名称的优先级，用于生成唯一的块名
	private nextEntryModuleIndex = 0;// 下一个入口模块的索引，用于分配入口模块的顺序
```

##### 重要方法

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

- resolve文件路径

  ```typescript
  const resolveIdResult = await resolveId(
  			unresolvedId,// 入口文件
  			importer,// 导入模块的父模块id；入口模块解析时可能是 undefined。
  			this.options.preserveSymlinks,//  解析路径时是否保留符号链接
  			this.pluginDriver,
  			this.resolveId,// 模块加载器的解析函数，用于插件中的递归解析，标准化resolveId结果，并补充默认值
  			null,
  			EMPTY_OBJECT,
  			true, // 是否是入口文件
  			EMPTY_OBJECT,
  			this.options.fs
  		);
  ```

  - 调用resolveIdViaPlugins函数

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

    - [在函数中调用插件驱动的hookFirstAndGetPlugin方法](https://cn.rollupjs.org/plugin-development/#resolveid)，

      按“first”语义顺序执行插件的异步钩子，返回第一个非空结果以及产生该结果的插件

      ```typescript
      return pluginDriver.hookFirstAndGetPlugin(
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

    - 获取入口文件路径，赋值importer 

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

###### fetchModule

- 尝试从modulesById获取该模块

  ```typescript
  const existingModule = this.modulesById.get(id);
  ```

- 不存在则新建模块

  ```typescript
  	const module = new Module(
  			this.graph,
  			id,
  			this.options,
  			isEntry,
  			moduleSideEffects,
  			syntheticNamedExports,
  			meta,
  			attributes
  		);
  ```

- 存储模块到map对象中

  ::: tip

  modulesById属性在graph对象中

  :::

  ```typescript
  this.modulesById.set(id, module);
  ```

- 调用addModuleSource方法加载模块

  ```typescript
  const loadPromise: LoadModulePromise = this.addModuleSource(id, importer, module).then(() => [
      this.getResolveStaticDependencyPromises(module),
      this.getResolveDynamicImportPromises(module),
      loadAndResolveDependenciesPromise
    ]);
  ```

###### addModuleSource

- [调用插件驱动hookFirstAndGetPlugin方法，按“first”语义顺序执行插件的`load`异步钩子](https://cn.rollupjs.org/plugin-development/#load)，返回第一个非空结果,如果返回null,则`fs.readFile`读取文件

  ```typescript
  let source: LoadResult;
  try {
    source = await this.graph.fileOperationQueue.run(async () => {
      const content = await this.pluginDriver.hookFirst('load', [id]);
      if (content !== null) return content;
      this.graph.watchFiles[id] = true;
      return (await this.options.fs.readFile(id, { encoding: 'utf8' })) as string;
    });
  } catch (error_: any) {
    let message = `Could not load ${id}`;
    if (importer) message += ` (imported by ${relativeId(importer)})`;
    message += `: ${error_.message}`;
    error_.message = message;
    throw error_;
  }
  ```

- 标准化返回结果

  ```typescript
  { code: source }
  ```

- 如果是自定义load返回结果有其它返回参数，则更新*module*的info属性

  ```typescript
  module.updateOptions(sourceDescription);
  ```

- 调用transform函数转化模块源码

  [顺序执行和处理插件异步`transform`钩子和返回值](https://cn.rollupjs.org/plugin-development/#transform)

  ```typescript
  const id = module.id;
  const sourcemapChain: DecodedSourceMapOrMissing[] = [];
  
  let originalSourcemap = source.map === null ? null : decodedSourcemap(source.map);
  const originalCode = source.code;
  let ast = source.ast;
  const transformDependencies: string[] = [];
  const emittedFiles: EmittedFile[] = [];
  let customTransformCache = false;
  const useCustomTransformCache = () => (customTransformCache = true);
  let pluginName = '';
  let currentSource = source.code;
  
  let code: string;
  
  try {
    code = await pluginDriver.hookReduceArg0(
      'transform',
      [currentSource, id],
      transformReducer,
      (pluginContext, plugin): TransformPluginContext => {
        pluginName = plugin.name;
        return {
          ...pluginContext,
          addWatchFile(id: string) {
            transformDependencies.push(id);
            pluginContext.addWatchFile(id);
          },
          cache: customTransformCache
            ? pluginContext.cache
            : getTrackedPluginCache(pluginContext.cache, useCustomTransformCache),
          debug: getLogHandler(pluginContext.debug),
          emitFile(emittedFile: EmittedFile) {
            emittedFiles.push(emittedFile);
            return pluginDriver.emitFile(emittedFile);
          },
          error(
            error_: RollupError | string,
            pos?: number | { column: number; line: number }
          ): never {
            if (typeof error_ === 'string') error_ = { message: error_ };
            if (pos) augmentCodeLocation(error_, pos, currentSource, id);
            error_.id = id;
            error_.hook = 'transform';
            return pluginContext.error(error_);
          },
          getCombinedSourcemap() {
            const combinedMap = collapseSourcemap(
              id,
              originalCode,
              originalSourcemap,
              sourcemapChain,
              log
            );
            if (!combinedMap) {
              const magicString = new MagicString(originalCode);
              return magicString.generateMap({ hires: true, includeContent: true, source: id });
            }
            if (originalSourcemap !== combinedMap) {
              originalSourcemap = combinedMap;
              sourcemapChain.length = 0;
            }
            return new SourceMap({
              ...combinedMap,
              file: null as never,
              sourcesContent: combinedMap.sourcesContent!
            });
          },
          info: getLogHandler(pluginContext.info),
          setAssetSource() {
            return this.error(logInvalidSetAssetSourceCall());
          },
          warn: getLogHandler(pluginContext.warn)
        };
      }
    );
  } catch (error_: any) {
    return error(logPluginError(error_, pluginName, { hook: 'transform', id }));
  }
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

## 模块详解

### 初始化类属性

```typescript
readonly alternativeReexportModules = new Map<Variable, Module>(); // 存储变量的替代重新导出模块
readonly chunkFileNames = new Set<string>(); // 存储模块所属的所有代码块文件名,该模块的代码出现在这几个文件中
chunkNames: {
  isUserDefined: boolean;
  name: string;
  priority: number;
}[] = []; // 存储模块的块名称配置
readonly cycles = new Set<symbol>(); // 检测模块间的循环依赖
readonly dependencies = new Set<Module | ExternalModule>(); // 存储模块的静态依赖
readonly dynamicDependencies = new Set<Module | ExternalModule>();// 存储模块的动态依赖
readonly dynamicImporters: string[] = []; // 存储通过动态导入引用此模块的模块ID列表
readonly dynamicImports: DynamicImport[] = []; // 存储模块中的动态导入语句
excludeFromSourcemap: boolean; // 控制模块是否从 sourcemap 中排除
execIndex = Infinity; // 模块在构建过程中的执行顺序索引
hasTreeShakingPassStarted = false; // 标记模块是否已开始摇树优化
readonly implicitlyLoadedAfter = new Set<Module>(); // 存储此模块应该在哪些模块之后隐式加载
readonly implicitlyLoadedBefore = new Set<Module>(); // 存储此模块应该在哪些模块之前隐式加载
readonly importDescriptions = new Map<string, ImportDescription>(); // 存储导入语句的详细描述
readonly importMetas: MetaProperty[] = []; // 存储模块中的 import.meta 使用
importedFromNotTreeshaken = false; // 标记模块是否从未进行摇树优化的模块导入
shebang: undefined | string; // 存储文件开头的 shebang 行
readonly importers: string[] = []; // 导入此模块的模块ID列表
readonly includedDynamicImporters: Module[] = []; // 存储包含此模块的动态导入者模块实例
readonly includedDirectTopLevelAwaitingDynamicImporters = new Set<Module>(); // 存储直接使用顶层 await 等待动态导入的模块
readonly includedImports = new Set<Variable>(); // 存储已被包含的导入变量
readonly info: ModuleInfo; // 存储模块的元信息
isExecuted = false; // 标记模块是否已执行
isUserDefinedEntryPoint = false; // 标记是否为用户定义的入口点
declare magicString: MagicString; // 用于代码操作的字符串库
declare namespace: NamespaceVariable; // 模块的命名空间变量
needsExportShim = false; // 标记是否需要导出垫片
declare originalCode: string; // 存储模块的原始源代码
declare originalSourcemap: ExistingDecodedSourceMap | null; // 存储模块的原始 sourcemap
preserveSignature: PreserveEntrySignaturesOption; // 控制入口模块导出签名的保留方式
declare resolvedIds: ResolvedIdMap; // 存储模块中导入的解析结果
declare scope: ModuleScope; // 模块的作用域
readonly sideEffectDependenciesByVariable = new Map<Variable, Set<Module>>(); // 存储变量到副作用依赖模块的映射
declare sourcemapChain: DecodedSourceMapOrMissing[]; // 存储 sourcemap 转换链
readonly sourcesWithAttributes = new Map<string, Record<string, string>>(); // 存储带属性的导入源
declare transformFiles?: EmittedFile[]; // 存储插件生成的文件

private allExportNames: Set<string> | null = null; // 缓存所有导出名称，避免重复计算
private allExportsIncluded = false; // 标记是否所有导出都被包含
private ast: Program | null = null; // 存储解析后的 JavaScript AST
declare private astContext: AstContext; // AST 操作的上下文
private readonly context: string; // 模块的上下文信息
declare private customTransformCache: boolean; // 标记是否有自定义转换缓存
private readonly exportAllModules: (Module | ExternalModule)[] = []; // 存储 export * 的模块列表
private readonly exportAllSources = new Set<string>(); 
private exportNamesByVariable: Map<Variable, string[]> | null = null;// 缓存变量到导出名称的映射
private readonly exportShimVariable = new ExportShimVariable(this);// 导出垫片变量
private readonly exports = new Map<string, ExportDescription>(); // 存储模块的导出信息
private readonly namespaceReexportsByName = new Map<
  string,
  [variable: Variable | null, options?: VariableOptions]
>(); // 存储命名空间重新导出
private readonly reexportDescriptions = new Map<string, ReexportDescription>(); // 存储重新导出的描述

private relevantDependencies: Set<Module | ExternalModule> | null = null; // 缓存相关依赖，避免重复计算
private readonly syntheticExports = new Map<string, SyntheticNamedExportVariable>(); // 存储合成导出（插件生成）
private syntheticNamespace: Variable | null | undefined = null; // 合成命名空间
private transformDependencies: string[] = []; // 存储转换依赖
private transitiveReexports: string[] | null = null; // 缓存传递性重新导出
```

### 构造函数

#### 构建模块信息对象

创建模块的元信息对象，提供统一的查询接口

```typescript
const module = this;
const {
			dynamicImports,
			dynamicImporters,
			exportAllSources,
			exports,
			implicitlyLoadedAfter,
			implicitlyLoadedBefore,
			importers,
			reexportDescriptions,
			sourcesWithAttributes
		} = this;

		this.info = {
			ast: null,
			attributes,
			code: null,
			get dynamicallyImportedIdResolutions() {
				return dynamicImports
					.map(({ argument }) => typeof argument === 'string' && module.resolvedIds[argument])
					.filter(Boolean) as ResolvedId[];
			},
			get dynamicallyImportedIds() {
				// We cannot use this.dynamicDependencies because this is needed before
				// dynamicDependencies are populated
				return dynamicImports.map(({ id }) => id).filter((id): id is string => id != null);
			},
			get dynamicImporters() {
				return dynamicImporters.sort();
			},
			get exportedBindings() {
				const exportBindings: Record<string, string[]> = { '.': [...exports.keys()] };

				for (const [name, { source }] of reexportDescriptions) {
					(exportBindings[source] ??= []).push(name);
				}

				for (const source of exportAllSources) {
					(exportBindings[source] ??= []).push('*');
				}

				return exportBindings;
			},
			get exports() {
				return [
					...exports.keys(),
					...reexportDescriptions.keys(),
					...[...exportAllSources].map(() => '*')
				];
			},
			get hasDefaultExport() {
				// This information is only valid after parsing
				if (!module.ast) {
					return null;
				}
				return module.exports.has('default') || reexportDescriptions.has('default');
			},
			id,
			get implicitlyLoadedAfterOneOf() {
				return Array.from(implicitlyLoadedAfter, getId).sort();
			},
			get implicitlyLoadedBefore() {
				return Array.from(implicitlyLoadedBefore, getId).sort();
			},
			get importedIdResolutions() {
				return Array.from(
					sourcesWithAttributes.keys(),
					source => module.resolvedIds[source]
				).filter(Boolean);
			},
			get importedIds() {
				// We cannot use this.dependencies because this is needed before
				// dependencies are populated

				return Array.from(
					sourcesWithAttributes.keys(),
					source => module.resolvedIds[source]?.id
				).filter(Boolean);
			},
			get importers() {
				return importers.sort();
			},
			isEntry,
			isExternal: false,
			get isIncluded() {
				if (graph.phase !== BuildPhase.GENERATE) {
					return null;
				}
				return module.isIncluded();
			},
			meta: { ...meta },
			moduleSideEffects,
			syntheticNamedExports
		};
```

