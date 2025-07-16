import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/blog/", // 部署到github时需要设置
  title: "前端博客",
  description: "",
  srcDir: "src/post",
  themeConfig: {
    outline: "deep",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "面试", link: "/项目介绍" },
      { text: "源码", link: "/vue3源码熟读" },
      { text: "学习笔记", link: "/模块系统" },
      { text: "开源", link: "/预渲染插件" },
      { text: "生活知识", link: "/租房" },
    ],

    sidebar: [
      {
        text: "面试",
        items: [
          { text: "项目介绍", link: "/项目介绍" },
          { text: "CSS", link: "/CSS" },
          { text: "DOM+JS", link: "/DOM+JS" },
          { text: "HR面以及待遇问题", link: "/HR面以及待遇问题" },
        ],
      },
      {
        text: "源码",
        items: [
          { text: "vue3源码熟读", link: "/vue3源码熟读" },
          { text: "element-plus源码解析", link: "/element-plus源码解析" },
          { text: "vue-router源码解析", link: "/vue-router源码解析" },  
          { text: "微前端", link: "/微前端" },
        ],
      },
      {
        text: "学习笔记",
        items: [
          { text: "模块系统", link: "/模块系统" },
          { text: "vue3项目实践", link: "/vue3项目实践" },
          { text: "react", link: "/react" },  
          { text: "typescript", link: "/typescript" },
          { text: "原子化CSS", link: "/原子化CSS" },
          { text: "算法", link: "/算法" },
          { text: "gsap", link: "/gsap" },
          { text: "JSONSchema", link: "/JSON-schema" },
          { text: "nest", link: "/nest" },
          { text: "pnpm", link: "/pnpm" },
          { text: "rxjs", link: "/rxjs" },
          { text: "sass", link: "/sass" },
          { text: "tsup", link: "/tsup" },
          { text: "Rollup", link: "/Rollup" },
          { text: "vitepress", link: "/vitepress" },
          { text: "vite模块联邦", link: "/vite模块联邦" },
        ],
      },
      {
        text: "开源",
        items: [
          { text: "预渲染插件", link: "/预渲染插件" },
          { text: "性能指标可视化插件", link: "/性能指标可视化插件" },
          { text: "组件库", link: "/组件库" },
          { text: "nest脚手架", link: "/nest脚手架" },
        ],
      },
      {
        text: "生活知识",
        items: [{ text: "租房", link: "/租房" },{ text: "菜谱", link: "/菜谱" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/zjjaxx/blog" },
    ],
  },
});
