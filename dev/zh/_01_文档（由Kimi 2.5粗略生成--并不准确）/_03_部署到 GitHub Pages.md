---
title: 部署到 GitHub Pages
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex->v0plex@outlook.com
has_custom_tsx: false
tags: [guide, deployment]
---

# 部署到 GitHub Pages

GitHub Pages 是托管静态站点的便捷选择，它与 GitHub 仓库无缝集成，支持自定义域名，并提供免费的 HTTPS 证书。本章介绍如何将 v0plex 生成的站点部署到 GitHub Pages。

## 准备工作

在开始部署之前，需要完成一些准备工作。首先，确保你已经在 GitHub 上创建了仓库，并且本地项目已连接到该仓库。如果你是通过 fork 获取的 v0plex，这一步骤已经完成。

其次，确认 `next.config.mjs` 中的配置适合你的部署需求。该文件已经预配置了静态导出设置: `output: 'export'` 启用静态导出模式，`distDir: 'gh-page-output'` 指定输出目录，`trailingSlash: true` 确保 URL 以斜杠结尾，这对静态托管服务更友好。如果你的仓库不是用户或组织站点（即仓库名不是 `username.github.io`），还需要设置 `basePath` 为仓库名。

例如，如果仓库名为 `my-docs`，配置应修改为: 

```javascript
const nextConfig = {
    output: 'export',
    distDir: 'gh-page-output',
    basePath: '/my-docs',
    trailingSlash: true,
    // ...其他配置
}
```

## 配置 GitHub Actions

GitHub Pages 支持通过 GitHub Actions 自动部署，这意味着每次推送到主分支时，站点都会自动重新构建和发布。

在项目根目录创建 `.github/workflows/deploy.yml` 文件，内容如下: 

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Build site
        run: |
          pnpm vmd:gen
          pnpm lex:gen
          pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./gh-page-output

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

这个工作流定义了两个任务: build 任务在 Ubuntu 环境中安装依赖、构建站点并上传构建产物；deploy 任务将产物部署到 GitHub Pages。`workflow_dispatch` 触发器允许你手动触发部署，这在调试时很有用。

## 启用 GitHub Pages

配置好工作流后，需要在 GitHub 仓库设置中启用 Pages 功能。

进入仓库的 Settings 页面，找到左侧菜单中的 Pages 选项。在 Build and deployment 部分，选择 Source 为 GitHub Actions。保存后，GitHub 会自动检测仓库中的工作流文件。

回到代码仓库页面，点击 Actions 标签，你应该能看到刚刚创建的 Deploy to GitHub Pages 工作流。由于尚未触发，列表可能是空的。进行一次推送操作或手动触发工作流来测试部署。

## 首次部署

将工作流文件提交到仓库: 

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

推送后，GitHub Actions 会自动触发构建流程。进入 Actions 页面查看进度，整个流程通常需要 2 到 5 分钟。如果一切正常，build 任务会显示绿色对勾，随后 deploy 任务执行并显示部署成功的消息。

部署完成后，访问 `https://username.github.io/repository-name`（将 username 和 repository-name 替换为你的实际值）查看站点。如果配置了用户站点（仓库名为 `username.github.io`），访问地址则为 `https://username.github.io`。

## 配置自定义域名

GitHub Pages 支持自定义域名，可以为你的文档站点配置更专业的地址。

在 `gh-page-output` 目录（或静态文件源目录）创建名为 `CNAME` 的文件，内容为一行自定义域名，例如 `docs.example.com`。在 GitHub 仓库的 Pages 设置中，找到 Custom domain 部分，输入相同的域名并保存。

接下来，在你的 DNS 提供商处添加记录。如果主域名是 `example.com`，需要添加一条 CNAME 记录，将 `docs` 子域名指向 `username.github.io`。如果主域名使用 APEX 记录（裸域名），则需要添加 A 记录指向 GitHub Pages 的 IP 地址（可在 GitHub 文档中查询最新地址）。

DNS 变更可能需要几分钟到几小时生效。GitHub 会自动检测 DNS 配置并提供 HTTPS 证书。

## 验证部署结果

部署后应该验证几个关键点。首先，首页能够正常加载，没有 404 错误。其次，导航链接能够正确跳转，URL 结构符合预期。第三，图像资源显示正常，没有被跨域或路径问题阻止。第四，搜索功能工作正常，能够返回中文搜索结果。

如果发现资源加载失败，检查浏览器的开发者工具网络面板，确认请求 URL 是否正确。常见问题是 `basePath` 配置不当，导致资源路径错误。

## 故障排除

部署过程中可能遇到的问题及解决方案: 

如果 Actions 工作流失败，点击失败的运行记录查看详细日志。常见原因包括依赖安装失败、构建命令错误或权限配置问题。

如果站点部署后显示空白，可能是 Next.js 的静态导出配置有问题。检查 `next.config.mjs` 中的 `output` 是否为 `'export'`，以及 `distDir` 是否与工作流中的路径一致。

如果自定义域名不生效，确认 CNAME 文件已正确提交到仓库，并且 DNS 记录指向了正确的目标。GitHub Pages 的 Custom domain 设置页面会显示 DNS 检查状态。

如果 CSS 或 JavaScript 文件加载失败，通常是路径问题。检查浏览器控制台中的错误信息，确认资源 URL 是否包含了正确的 `basePath`。
