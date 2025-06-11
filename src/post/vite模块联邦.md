
## [vite-plugin-federation优势](https://github.com/originjs/vite-plugin-federation/blob/main/README-zh.md)

- 模块共享（支持工具函数、业务组件、甚至整个路由系统）

- 可独立开发、测试和部署
- 构建产物体积减少，远程模块不参与本地构建
- 第三方依赖（如 Vue、Axios）通过共享机制统一版本管理，减少维护多个版本带来的复杂度

## 使用时注意事项

- 只有Host端支持dev模式，Remote端需要使用`vite build`生成RemoteEntry.js包。您可以使用`vite build --watch`到达类似热更新的效果。remote 端可通过`http-server ./ -p=8888 --cors`启动本地服务
- 静态导入可能会依赖到浏览器`Top-level await`特性，因此需要将配置文件中的build.target设置为`next`或使用插件[`vite-plugin-top-level-await`](https://github.com/Menci/vite-plugin-top-level-await)。您可以在此查看Top-level await的[浏览器兼容性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#browser_compatibility)
- 在共享全局状态时，要把pinia加入share数组中作为单例模式
- 在共享路由时，如果该路由是以动态import形式导入的路由懒加载的形式，则要配置`base`域名路径

