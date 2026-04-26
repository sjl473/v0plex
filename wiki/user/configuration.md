# 配置详解

站点配置文件位于 `config/site.config.ts`。这个文件控制着站点的方方面面，从内容源到多语言设置，从导航结构到页面标题格式。本页面详细说明每个配置项的作用和效果。

## 内容源配置

`CONTENT_SOURCE_CONFIG` 决定 v0plex 从哪里读取你的内容。这是最重要的配置项，直接影响你的工作流程。

### 本地模式

`USE_LOCAL_MARKDOWN` 设为 `true` 时，v0plex 从本地 `dev/` 目录读取内容。这是默认模式，适合大多数使用场景。

```typescript
CONTENT_SOURCE_CONFIG: {
  USE_LOCAL_MARKDOWN: true,
}
```

本地模式下，你需要在项目的 `dev/` 目录中创建内容文件。目录结构必须按照语言组织，每种语言一个文件夹。比如 `dev/zh/` 存放中文内容，`dev/en/` 存放英文内容。

本地模式有几个要求。`dev/` 目录必须存在。`dev/` 下至少有一个语言文件夹。每个语言文件夹内至少有一个 Markdown 文件。语言文件夹的名称必须与 `AVAILABLE_LANGUAGES` 中配置的 `folder` 字段匹配。

本地模式适合内容与代码在同一个仓库的情况，比如个人博客、项目文档、团队知识库等。

### 远程模式

`USE_LOCAL_MARKDOWN` 设为 `false` 时，v0plex 从 Git 仓库获取内容。你需要配置仓库地址和分支。

```typescript
CONTENT_SOURCE_CONFIG: {
  USE_LOCAL_MARKDOWN: false,
  GIT_CONFIG: {
    REPO_URL: 'https://github.com/your-org/content-repo',
    BRANCH: 'main',
  }
}
```

远程模式下，每次运行 build 或 dev 命令时，v0plex 会先删除本地的 `dev/` 目录，然后克隆配置的仓库。这意味着你对 `dev/` 目录的本地修改会在下次构建时丢失。

内容仓库的结构要求与本地模式相同，根目录下必须有 `dev/` 文件夹，`dev/` 下按语言组织内容。如果仓库结构与要求不符，构建会失败并报告错误。

远程模式适合内容与代码分离的情况，比如多人协作编辑内容、内容需要独立版本控制、内容来自其他组织等。

### @git 占位符行为

两种模式对 `@git` 占位符的处理不同。本地模式下，`@git` 使用 v0plex 项目本身的 git 历史。远程模式下，`@git` 使用内容仓库的 git 历史。

这意味着如果你想使用 `@git` 自动填充日期和作者，需要确保对应的 git 仓库有正确的提交历史。

## 多语言配置

v0plex 原生支持多语言站点。你可以配置支持哪些语言，以及如何处理语言切换。

### 可用语言

`AVAILABLE_LANGUAGES` 定义站点支持的所有语言。这是一个数组，每个元素描述一门语言。

```typescript
AVAILABLE_LANGUAGES: [
  { code: 'zh', name: 'Chinese', nativeName: '中文', folder: 'zh' },
  { code: 'en', name: 'English', nativeName: 'English', folder: 'en' },
]
```

每个语言配置包含四个字段。`code` 是语言代码，遵循 ISO 639-1 标准，如 `zh`、`en`、`ja`。`name` 是语言的英文名称，如 `Chinese`、`Japanese`。`nativeName` 是语言的本地名称，如 `中文`、`日本語`。`folder` 是内容文件夹名称，通常与 `code` 相同，但也可以不同。

添加新语言只需要在数组中添加新的配置项，然后在 `dev/` 目录下创建对应的文件夹并添加内容。

### 默认语言

`DEFAULT_LOCALE` 设置站点的默认语言。当用户首次访问站点时，如果浏览器中没有保存语言偏好，会显示这个语言的内容。

```typescript
DEFAULT_LOCALE: 'zh'
```

默认语言应该是 `AVAILABLE_LANGUAGES` 中配置的语言之一。

### 语言存储键

`LOCALE_STORAGE_KEY` 设置浏览器 localStorage 中存储用户语言偏好的键名。

```typescript
LOCALE_STORAGE_KEY: 'v0plex-locale'
```

通常不需要修改这个配置，除非你的站点与其他应用共享 localStorage 空间，需要避免键名冲突。

### 语言支持信息

`AVAILABLE_LANGUAGES_SUPPORT` 提供更详细的语言支持信息，用于语言选择器等 UI 组件。

```typescript
AVAILABLE_LANGUAGES_SUPPORT: [
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    folder: 'zh',
    support: 'full',      // 支持程度：full 或 partial
    progress: 100,        // 翻译进度百分比
  }
]
```

`support` 字段表示支持程度。`full` 表示内容完整，`partial` 表示部分内容可能缺失。`progress` 字段表示翻译进度，可以用于显示进度条。

## 站点元数据

`SITE_METADATA` 设置站点的基本信息，这些信息会显示在浏览器标签、搜索结果等地方。

### 站点标题

`title` 是站点的名称，会显示在浏览器标签和页面标题中。

```typescript
SITE_METADATA: {
  title: '我的文档站点',
}
```

### 站点图标

`icons` 设置站点的图标，支持多种尺寸和格式。

```typescript
SITE_METADATA: {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}
```

图标文件应该放在 `public/` 目录下。配置中的路径是相对于站点根目录的 URL 路径。

## 页面标题格式

`SITE_TITLE_BASE` 定义页面标题的格式模板。页面标题是显示在浏览器标签上的文字。

```typescript
SITE_TITLE_BASE: '{page} - {site}'
```

模板支持两个占位符。`{page}` 会被替换为当前页面的标题，即 frontmatter 中的 `title` 字段。`{site}` 会被替换为站点名称，即 `SITE_METADATA.title`。

例如，如果页面标题是"快速开始"，站点名称是"开发文档"，生成的页面标题就是"快速开始 - 开发文档"。

你可以根据需要调整格式，比如 `{site} | {page}` 会生成"开发文档 | 快速开始"。

## URL 前缀

`URL_PREFIX` 设置生成页面的 URL 路径前缀。

```typescript
URL_PREFIX: 'page'
```

这个配置决定了页面 URL 的结构。如果设置为 `page`，生成的页面 URL 类似 `/page/abc123`。如果设置为 `docs`，URL 类似 `/docs/abc123`。

修改这个配置后，需要重新构建站点。旧的 URL 会失效，如果有外部链接指向你的站点，需要设置重定向。

## 布局配置

`LAYOUT_CONFIG` 控制站点布局的尺寸参数。这些参数影响侧边栏宽度、内容区域边距等。

```typescript
LAYOUT_CONFIG: {
  SIDEBAR_WIDTH: 300,
  RIGHT_SIDEBAR_WIDTH: 300,
  LEFT_CONTENT_OFFSET: {
    pc: '1.25rem',
    tablet: '1rem',
    mobile: '0.5rem',
  },
}
```

`SIDEBAR_WIDTH` 是左侧导航栏的宽度，单位是像素。`RIGHT_SIDEBAR_WIDTH` 是右侧目录栏的宽度。`LEFT_CONTENT_OFFSET` 是内容区域的左边距，根据屏幕尺寸不同使用不同的值。

修改这些配置主要影响样式。如果你修改了宽度值，可能需要同步修改相关的 CSS 样式以确保布局正确。

## 构建配置

`BUILD_CONFIG` 定义构建过程的路径和设置。大多数情况下不需要修改这些配置。

```typescript
BUILD_CONFIG: {
  PUBLIC_DIR: 'public',
  APP_DIR: 'app',
  OUT_DIR: 'page',
  VMD_CODE_DIR: 'vmdcode',
  VMD_IMAGE_DIR: 'vmdimage',
  VMD_JSON_DIR: 'vmdjson',
  URL_PREFIX: 'page',
  EXCLUDED_DIRS: ['node_modules', '.git'],
  SITE_DATA_JSON: 'site-data.json',
  COMPONENT_IMPORT_PATH: '@/components/vmd/vmdimporter',
  IMAGE_WEB_PREFIX: '/vmdimage/',
  GITHUB_REPO_BASE_URL: '',
}
```

`PUBLIC_DIR` 是静态资源目录，处理后的图片和代码文件会放在这里。`APP_DIR` 是 Next.js 应用目录，生成的页面组件放在这里。`OUT_DIR` 是页面输出目录名，生成的页面组件放在 `app/OUT_DIR/` 下。`VMD_CODE_DIR` 是提取的代码文件存放目录名。`VMD_IMAGE_DIR` 是处理后的图片存放目录名。`VMD_JSON_DIR` 是 JSON 数据文件存放目录名。`EXCLUDED_DIRS` 是扫描目录时要跳过的目录。`SITE_DATA_JSON` 是导航数据文件名。`COMPONENT_IMPORT_PATH` 是 VMD 组件的导入路径。`IMAGE_WEB_PREFIX` 是图片的 Web URL 前缀。`GITHUB_REPO_BASE_URL` 是 GitHub 仓库地址，用于生成"编辑此页"链接。

如果你需要修改这些配置，确保同步更新相关的构建脚本和样式引用。

## 标签配置

`TAGS_CONFIG` 定义可以在 frontmatter 中使用的标签。

```typescript
TAGS_CONFIG: {
  tags: ['welcome', 'tutorial', 'api', 'guide', 'reference', 'advanced'],
}
```

在 Markdown 文件的 frontmatter 中使用标签时，标签值必须在这个数组中定义。如果你想使用新标签，需要先在这里添加。

标签用于分类和组织页面。你可以根据站点的实际需求定义标签，比如按内容类型分为 `tutorial`、`reference`、按难度分为 `beginner`、`intermediate`、`advanced`、按主题分为 `installation`、`configuration`、`deployment`。

## 国际化字符串

`I18N_STRINGS` 定义各语言的翻译字符串，用于站点 UI 元素的本地化。

```typescript
I18N_STRINGS: {
  zh: {
    navigation: {
      previous: '上一篇',
      next: '下一篇',
    },
    lastUpdated: '最后更新于',
    editPage: '编辑此页',
    onThisPage: '本页目录',
    search: '搜索',
  },
  en: {
    navigation: {
      previous: 'Previous',
      next: 'Next',
    },
    lastUpdated: 'Last updated',
    editPage: 'Edit this page',
    onThisPage: 'On this page',
    search: 'Search',
  },
}
```

当你添加新语言时，需要在这里添加对应的翻译字符串。如果某个语言的某些字符串缺失，会回退到默认语言的字符串。

## 日期格式

`DATE_FORMATS` 定义各语言的日期显示格式。

```typescript
DATE_FORMATS: {
  zh: 'yyyy年MM月dd日',
  en: 'MMMM d, yyyy',
}
```

格式字符串遵循 date-fns 库的格式规范。`yyyy` 是四位年份，`MM` 是两位月份，`dd` 是两位日期，`MMMM` 是月份全名。

添加新语言时，可以在这里设置该语言的日期格式偏好。

## 配置示例

下面是一个完整的配置示例，展示了一个中英文双语站点的配置。

```typescript
// 内容源：使用本地dev目录
CONTENT_SOURCE_CONFIG: {
  USE_LOCAL_MARKDOWN: true,
}

// 支持中文和英文
AVAILABLE_LANGUAGES: [
  { code: 'zh', name: 'Chinese', nativeName: '中文', folder: 'zh' },
  { code: 'en', name: 'English', nativeName: 'English', folder: 'en' },
]

// 默认中文
DEFAULT_LOCALE: 'zh'

// 站点信息
SITE_METADATA: {
  title: '我的文档',
  icons: {
    icon: '/favicon.ico',
  },
}

// 页面标题格式
SITE_TITLE_BASE: '{page} | {site}'

// URL 前缀
URL_PREFIX: 'docs'

// 标签
TAGS_CONFIG: {
  tags: ['getting-started', 'tutorial', 'api', 'advanced'],
}
```

这个配置对应的目录结构是：

```
dev/
├── zh/
│   ├── 01_getting-started.md
│   └── 02_tutorial/
│       └── 01_basics.md
└── en/
    ├── 01_getting-started.md
    └── 02_tutorial/
        └── 01_basics.md
```

生成的页面 URL 类似 `/docs/abc123`，浏览器标签显示"快速开始 | 我的文档"。
