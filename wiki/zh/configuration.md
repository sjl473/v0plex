# 用户入门：目录和配置结构详解

## 目录结构

v0plex 的目录结构如下：

```
.
├── LICENSE
├── README.md
├── app
│   ├── client-layout.module.css
│   ├── client-layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page // rendered react tsx pages
│   │   ├── 1aa8abad
│   │   │   └── page.tsx
│   │   ├── 3984af33
│   │   │   └── page.tsx
│   │   ├── 406e1cb8
│   │   │   └── page.tsx
........
│   ├── page.module.css
│   └── page.tsx // first page
├── components
│   ├── common
│   ....... common react component
│   └── vmd
│   ......... vmd extension
├── config
│   └── site.config.ts
├── dev
│   ├── assets
│   │   └── images
│   │       └── pasted_file.png
│   ├── en
│   │   ├── _01_foo bar foo
│   │   │   ├── _00_bar bar bar.md
│   │   │   ├── _01_foo foo foo.md
........................................
│   └── zh
│       ├── _01_符符符
│       │   ├── _00_吧 吧 吧.md
│       │   ├── _01_吧 吧 符.md
.......................................
├── gh-page-output
........... static deployment files
├── next-env.d.ts
├── next.config.mjs
├── node_modules
............... node modules
├── package.json
├── pnpm-lock.yaml
├── public
│   ├── mathjax-fonts
│   │   ├── MathJax_AMS-Regular.woff
│   │   ├── MathJax_Calligraphic-Bold.woff
│   │   ├── MathJax_Calligraphic-Regular.woff
│   │   ├── MathJax_Fraktur-Bold.woff
............... various font static file
│   ├── tex-chtml-full-speech.js
│   ├── v0plex_avatar.svg
│   ├── vmdcode
│   │   ├── 0012a3fa000c5dc26ee658c3c58e12cecd58d6455cec3d5621f0c787675b38aa.txt
│   │   ├── 005d0b7e5c261dcc5e2f8568e69a0b30e889a3275b55b18ec20a7deef0081e90.txt
................... static code file after rendering
│   ├── vmdimage
│   │   ├── 0008d9e3ab277968c79f72cf5319d7e5102094d6cbbede57ce7f6b1b2e1d2a4e.png
│   │   ├── 06094bb49c11ae3e6adc907eefa06c9ae72cdace3382405b3b05352d8b7ee40d.png
.................. static code file after rendering
│   └── vmdjson
│       └── site-data.json
├── scripts
│   └── search-script
│       ├── english_words.txt
│       ├── ignore_files.txt
│       ├── lex.py
│       ├── stopwords.txt
│       └── user_dict.txt
├── tsconfig.json
├── types
│   ├── css.d.ts
│   └── react-syntax-highlighter.d.ts
├── vitest.config.ts
├── vmd_parser
│   ├── __tests__
│   │   ├── compiler.test.ts
│   │   └── fixtures
│   │       └── markdown
│   │           ├── invalid_example.md
│   │           └── valid_example.md
│   ├── convert_to_vmd.ts
│   ├── extensions.ts
│   ├── main.ts
│   ├── state_machine.ts
│   ├── syntax_validator.ts
│   ├── types.ts
│   └── vmd_util.ts
└── wiki
....... wiki for this project
```

站点配置文件位于 `config/site.config.ts`。这个文件控制着 v0plex 的基本配置。

## 配置 Markdown 仓库

`CONTENT_SOURCE_CONFIG` 决定 v0plex 从哪里读取 Markdown，推荐使用远程 Github / Gitlab 仓库作为 Markdow 配置源。如：

```typescript
export const CONTENT_SOURCE_CONFIG = {
  USE_LOCAL_MARKDOWN: false,
  GIT_CONFIG: {
    REPO_URL: 'https://github.com/sjl473/v0plex-markdown',
    BRANCH: 'main',
  },
} as const;
```

此段配置表示 v0plex 会从 `https://github.com/sjl473/v0plex-markdown` 的 `main` 分支拉去 Markdown 作为本项目的文档来源。当 `USE_LOCAL_MARKDOWN: true` 时，v0plex 不会从远端拉取 Markdown，而是使用本地 `dev/` 文件夹的 Markdown 做文档源。

```typescript
export const CONTENT_SOURCE_CONFIG: {
  USE_LOCAL_MARKDOWN: true,
}
```

本地模式下，用户需要在项目的 `dev/` 目录中创建内容文件。目录结构必须按照语言组织，首支持的语言简称有：

```typescript
// export const ENABLED_LANGUAGES: Locale[] = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt'];
export const ENABLED_LANGUAGES: Locale[] = ['en', 'zh'];
```

远程模式下（`USE_LOCAL_MARKDOWN: false`）每次运行 build 或 dev 命令时，v0plex 会先默认删除本地的 `dev/` 目录，然后克隆配置的仓库。这意味着用户如选用远程模式对 `dev/` 目录的本地修改会在下次构建时丢失。

v0plex 保留本地模式 `USE_LOCAL_MARKDOWN: false` 但不推荐使用，建议将变量 `USE_LOCAL_MARKDOWN: true`，对 Markdown 等文字内容和 tsx 代码内容分为两个仓库存放。

### 在 Markdown Frontmatter 中对 @git 占位符的处理

两种模式对 `@git` 占位符的处理不同。本地模式下，`@git` 使用 v0plex 项目本身的 git 历史。远程模式下，`@git` 使用内容仓库的 git 历史。

- `created_at: @git` — 取文件首次 git 提交的日期（最早提交）。
- `last_updated_at: @git` — 取文件最近一次 git 修改的日期（最新提交）。
- `author: @git` — 获取该文件在 git 历史中的 **所有提交者**，按提交时间从旧到新排列，并自动去重（以邮箱为唯一标识）。如果该文件没有 git 提交历史，则回退到使用当前 git 配置的 `user.name` 和 `user.email`。

用户如使用 `@git` 自动填充日期和作者，需要确保对应的 git 仓库有符合预期的提交历史。

## 语言支持

每种语言一个文件夹。比如 `dev/zh/` 存放中文内容，`dev/en/` 存放英文内容。如果用户只想 enable 两种语言（中文或者英文），只需要参考上述配置即可。

v0plex Markdown 仓库的每个语言文件夹内至少有一个 Markdown 文件。语言文件夹的名称必须与 `AVAILABLE_LANGUAGES` 中配置的 `folder` 字段匹配。如用户想要使用韩文，则应该将文件夹命名为 `ko`。

`DEFAULT_LOCALE` 设置站点的默认语言。当用户首次访问站点时，如果浏览器中没有保存语言偏好，会显示这个语言的内容，如下首选语言为中文。默认语言应该是 `AVAILABLE_LANGUAGES` 中配置的语言之一。

```typescript
DEFAULT_LOCALE: 'zh'
```

### Metadata

以下配置可更改网站在浏览器上的标题和网站 logo。

```typescript
// ----------------------------------------------------------------------------
// ‼️ SITE TITLE
// ----------------------------------------------------------------------------
export const SITE_TITLE_BASE = 'v0plex';

export function getPageTitle(articleTitle?: string): string {
  return articleTitle ? `${articleTitle} | ${SITE_TITLE_BASE}` : SITE_TITLE_BASE;
}

// ----------------------------------------------------------------------------
// ‼️ SITE METADATA - Avatar
// ----------------------------------------------------------------------------

export const SITE_METADATA = {
  title: SITE_TITLE_BASE,
  icons: {
    icon: '/v0plex_avatar.svg', // 以 public 为默认路径下的图标
  },
} as const;
```


## Frontmatter tags（未实施完）

`TAGS_CONFIG` 定义可以在 frontmatter 中使用的标签。用户需确保 Markdown 文章中出现的 tags 不超过此变量定义的范围

```typescript
// ----------------------------------------------------------------------------
// TAGS CONFIGURATION - Allowed frontmatter tag values
// ----------------------------------------------------------------------------
export const TAGS_CONFIG = {
  tags: [
    'welcome',
    'tutorial',
    'test',
    'combo',
    'final',
    'guide',
    'reference',
    'api',
    'getting-started',
    'advanced',
    'troubleshooting',
    'release-notes',
    'changelog'
  ] as string[],
} as const;
```