# 部署指南

v0plex 构建生成标准的 Next.js 应用，可以部署到 Ngnix 服务器或者 Github Pages 上。

## 构建过程

运行 build 命令时，v0plex 会执行一系列操作。首先运行 VMD 编译器，将 `dev/` 目录下的 Markdown 文件转换为 React 组件。然后运行词典生成脚本，为搜索功能准备数据。最后运行 Next.js 构建，生成优化后的静态文件。

```bash
pnpm run build
```

构建完成后，输出在 `gh-page-output` 中：

```
├── gh-page-output
........... static deployment files
```

开发模式下，运行 dev 命令会启用热加载，但因为本项目对 Markdown 内容编译生成 tsx 页面，所以对于 `page/` 页面不能实现即时更新，需要第二次重启：

```bash
pnpm run dev
```

## 在离线网环境下部署（未完待续）

todo