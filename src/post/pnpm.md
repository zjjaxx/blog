

## pnpm优势
### 相关资料
[pnpm官网](https://pnpm.io/zh/motivation)

### 面试回答
1. 节省磁盘空间
   跨项目地共享同一版本的依赖，所有的三方依赖都会被存储在硬盘上的某一位置，当软件包被被安装时，包里的文件会硬链接到这一位置，而不会占用额外的磁盘空间。 
   如果你用到了某依赖项的不同版本，只会将不同版本间有差异的文件添加到仓库，就像git一样
2. 提高安装速度
   pnpm 通过 ​全局存储 + 硬链接 技术，避免了传统工具的文件复制开销
3. 创建一个非扁平的 node_modules 目录
   解决了幽灵依赖的问题

## 常用命令

### 过滤

```bash
pnpm --filter <package_selector> <command>
```

### pnpm link(好像有什么bug)

```bash
pnpm setup
pnpm link --global
```

### pnpm unlink (好像有什么bug)

```bash
pnpm remove <pkg name> -g
```
## 依赖提升

在`.npmrc`中设置

```.npmrc
shamefully-hoist=true
```



## monorepo管理

### pnpm-workspace.yaml
```yaml
packages:
  # 匹配所有的packages
  - 'packages/*'
  # 匹配packages目录下的所有packages
  - 'packages/**'
```
##  工作空间协议 

 pnpm 支持 `workspace:` 协议。 当使用此协议时，pnpm 将拒绝解析除本地工作空间所包含包之外的任何内容。 因此，如果设置 `"foo": "workspace:2.0.0|*"`，那么此时 安装将失败，因为工作空间中不存在 `"foo@2.0.0"`。

## 发布流程

[在 pnpm 中使用 Changesets](https://pnpm.io/zh/using-changesets)
