# v0plex

v0plex 是一个基于 Next.js 的静态文档站点生成器。你只需要用 Markdown 和 VMD 扩展语法编写内容，v0plex 会将其编译成高性能的 React 网站。

## 文档导航

根据你的身份选择相应的文档路径。

如果你是用户，想要使用 v0plex 编写和部署网站，请阅读用户文档。如果你是开发者，想要修改 v0plex 源码或贡献代码，请阅读开发者文档。

### 用户文档

用户文档帮助你从零开始使用 v0plex 创建文档站点。

你需要阅读以下文档：

`wiki/user/vmd-syntax.md` 介绍 VMD 扩展语法，包括 frontmatter、数学公式、提示框、文章布局等。

`wiki/user/configuration.md` 说明站点配置选项，包括内容源、多语言、布局等设置。

`wiki/user/deployment.md` 介绍如何部署站点到 Vercel、GitHub Pages 等平台。

`wiki/user/i18n.md` 说明如何创建多语言站点。

### 开发者文档

开发者文档面向需要修改 v0plex 源码的开发者。

你需要阅读以下文档：

`wiki/developer/components.md` 介绍 VMD 组件系统的实现细节。

`wiki/developer/parser-internals.md` 说明解析器的编译管道和内部机制。

`wiki/developer/contributing.md` 介绍如何为项目贡献代码。

`wiki/developer/changelog.md` 记录版本更新历史。

## 文件结构

wiki 目录的组织方式：

```
wiki/
├── developer/
│   ├── changelog.md
│   ├── components.md
│   ├── contributing.md
│   └── parser-internals.md
└── user/
    ├── configuration.md
    ├── deployment.md
    ├── i18n.md
    └── vmd-syntax.md
```

项目整体的文件结构：

```
v0plex/
├── app/                    # Next.js 应用目录
├── components/             # React 组件
├── config/                 # 配置文件
├── public/                 # 静态资源
├── scripts/                # 构建脚本
├── types/                  # 类型定义
├── vmd_parser/             # VMD 解析器核心
└── wiki/                   # 项目文档
```

## 快速开始

安装依赖：

```bash
pnpm install
```

开发模式运行：

```bash
pnpm run dev
```

构建生产版本：

```bash
pnpm run build
```

运行测试：

```bash
pnpm run test
```

## 基本使用

你的所有内容放在 `dev/` 目录下，按语言分开存放。最简单的目录结构如下：

```
dev/
└── zh/
    └── 01_first-page.md
```

每个 Markdown 文件开头需要 frontmatter：

```yaml
---
title: 页面标题
---
```

然后使用 Markdown 和 VMD 扩展语法编写正文。详细的语法说明请阅读 `wiki/user/vmd-syntax.md`。

## 许可证

本项目采用 MIT 许可证。
