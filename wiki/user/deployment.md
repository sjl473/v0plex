# 部署指南

v0plex 构建生成标准的 Next.js 应用，可以部署到多种平台。本页面介绍常见的部署方式和注意事项。

## 构建过程

运行 build 命令时，v0plex 会执行一系列操作。首先运行 VMD 编译器，将 `dev/` 目录下的 Markdown 文件转换为 React 组件。然后运行词典生成脚本，为搜索功能准备数据。最后运行 Next.js 构建，生成优化后的静态文件。

```bash
pnpm run build
```

构建完成后，输出在 `.next/` 目录中。如果你配置了静态导出，输出在 `out/` 目录中。

开发模式下，运行 dev 命令会先执行 VMD 编译和词典生成，然后启动 Next.js 开发服务器。

```bash
pnpm run dev
```

开发服务器支持热重载。当你修改 Markdown 文件后，需要重新运行 VMD 编译才能看到变化。修改 React 组件或样式则会自动更新。

## Vercel 部署

Vercel 是 Next.js 的官方托管平台，提供最简单的部署体验。

### 连接仓库

在 Vercel 控制台中选择"New Project"，然后导入你的 Git 仓库。Vercel 会自动检测 Next.js 项目并使用正确的构建设置。

你需要确认构build命令是 `pnpm run build`，输出目录是 `.next`。其他设置保持默认即可。

### 环境变量

如果你的项目使用环境变量，可以在 Vercel 项目设置中添加。常见的环境变量包括 `GIT_TOKEN` 用于访问私有仓库、自定义 API 端点等。

### 自动部署

连接仓库后，每次推送到主分支都会自动触发新的部署。你也可以配置预览部署，每个 Pull Request 都会生成一个预览链接。

### 域名设置

在 Vercel 项目设置中可以添加自定义域名。Vercel 会自动配置 SSL 证书和 CDN。

## 静态导出

如果你想部署到 GitHub Pages、Netlify 等静态托管平台，需要导出为纯静态文件。

### 配置导出

在 `next.config.js` 中添加 `output: 'export'` 配置：

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
```

`images.unoptimized` 配置是必须的，因为静态导出不支持 Next.js 的图片优化功能。

### 构建静态文件

运行 build 命令后，静态文件会输出到 `out/` 目录：

```bash
pnpm run build
```

`out/` 目录包含可以直接部署的 HTML、CSS、JavaScript 和静态资源文件。

### 部署到 GitHub Pages

GitHub Pages 是免费的静态托管服务，适合个人项目和小型站点。

在项目根目录创建 `.github/workflows/deploy.yml` 文件，配置 GitHub Actions 自动部署：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

每次推送到 main 分支，GitHub Actions 会自动构建并部署到 GitHub Pages。

在 GitHub 仓库设置中，启用 GitHub Pages 并选择 `gh-pages` 分支作为源。

### 部署到 Netlify

Netlify 提供类似 Vercel 的托管体验，支持自动构建和部署。

在 Netlify 控制台中选择"New site from Git"，导入你的仓库。Build 命令设置为 `pnpm run build`，Publish 目录设置为 `out`。

你也可以在项目根目录创建 `netlify.toml` 文件预设构建配置：

```toml
[build]
  command = "pnpm run build"
  publish = "out"
```

### Base Path 设置

如果部署到子路径（如 `https://example.com/docs/`），需要配置 `basePath`：

```javascript
const nextConfig = {
  output: 'export',
  basePath: '/docs',
  images: {
    unoptimized: true,
  },
}
```

同时需要更新 `config/site.config.ts` 中的相关路径配置，确保静态资源引用正确。

## Docker 部署

Docker 提供一致的运行环境，适合自托管或云服务器部署。

### 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app

EXPOSE 3000

CMD ["pnpm", "start"]
```

这个 Dockerfile 使用多阶段构建，构建镜像较大但运行镜像较小。

### 构建和运行

构建 Docker 镜像：

```bash
docker build -t v0plex-site .
```

运行容器：

```bash
docker run -p 3000:3000 v0plex-site
```

站点会在 `http://localhost:3000` 提供访问。

### Docker Compose

如果需要与其他服务一起部署，可以使用 Docker Compose。创建 `docker-compose.yml`：

```yaml
version: '3'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

## CI/CD 集成

大多数现代 CI/CD 平台都能很好地支持 Next.js 项目。

### 测试

在 CI 中运行测试是一个好习惯：

```bash
pnpm run test:run
```

这会运行 `vmd_parser/__tests__/` 目录下的所有测试，确保解析器正常工作。

### 缓存依赖

CI 中应该缓存 pnpm 依赖以加速构建。大多数 CI 平台都支持缓存 `node_modules` 或 pnpm store。

### 构建检查

可以在 CI 中添加构建检查，确保每次提交都能成功构建：

```yaml
- run: pnpm install
- run: pnpm run build
```

## 性能优化

v0plex 生成的站点已经过优化，但仍有一些措施可以进一步提升性能。

### 图片优化

在 Markdown 中引用的图片会被原样复制。如果你使用大图片，建议先压缩或转换为 WebP 格式。

### 代码分割

Next.js 会自动进行代码分割。如果你的站点很大，可以考虑将某些页面设为动态导入。

### CDN 配置

大多数托管平台都提供 CDN。确保静态资源有正确的缓存头，让用户浏览器缓存这些文件。

## 监控和日志

部署后应该监控站点的运行状态。

### 错误追踪

Vercel 和 Netlify 都提供错误日志功能。对于自托管站点，可以使用 Sentry 等服务追踪错误。

### 访问分析

如果你想了解站点访问情况，可以集成 Google Analytics、Plausible 或 Umami 等分析工具。

## 常见问题

### 构建失败

构建失败通常是因为 Markdown 语法错误或配置问题。检查构建日志中的错误信息，v0plex 会报告具体的文件和行号。

### 页面 404

如果某些页面显示 404，检查页面是否正确生成。页面文件应该在 `app/page/` 目录下，每个页面有一个以哈希命名的子目录。

### 样式丢失

样式丢失可能是因为静态资源路径配置错误。检查 `IMAGE_WEB_PREFIX` 和 `basePath` 配置是否匹配你的部署环境。

### 语言切换不工作

语言切换依赖于正确的内容结构。确保每种语言的内容文件使用相同的数字前缀，这样 v0plex 才能匹配跨语言页面。
