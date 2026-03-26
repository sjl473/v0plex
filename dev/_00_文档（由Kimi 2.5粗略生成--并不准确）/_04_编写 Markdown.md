---
title: 编写 Markdown
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
tags: [guide, reference]
---

# 编写 Markdown

v0plex 的内容完全基于 Markdown 格式，这是一种轻量级标记语言，设计目标是易读易写。本章介绍 v0plex 支持的 Markdown 语法，以及内容组织的最佳实践。

## 文件组织规范

v0plex 使用文件系统来组织内容层次结构。所有内容存储在 `dev/` 目录中，支持无限层级的文件夹嵌套。

文件和文件夹的命名遵循特定约定：以 `_NN_` 前缀开头，其中 `NN` 是两位数字（不足两位需补零），用于控制内容在导航树中的排序。前缀之后是内容的标识名称，可以包含空格和中文。例如：

```
dev/
├── _00_入门指南/
│   ├── _01_安装.md
│   ├── _02_快速开始.md
│   └── _03_常见问题.md
├── _01_进阶主题/
│   ├── _01_配置详解.md
│   └── _02_自定义组件/
│       └── _01_创建组件.md
└── _02_API 参考/
    └── _01_接口文档.md
```

这种命名方式使得排序完全由作者控制，不受文件系统或字母顺序的影响。同时，层次结构清晰地反映了内容的逻辑关系，读者通过导航栏能够直观地理解内容的组织结构。

## Frontmatter 格式

每个 Markdown 文件必须以 YAML frontmatter 开头，用三对短横线 `---` 包围。Frontmatter 定义了文档的元数据，v0plex 支持以下字段：

```yaml
---
title: 文档标题
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: 作者名称
has_custom_tsx: false
description: 文档的简短描述
---
```

`title` 是文档的显示标题，会出现在页面顶部、浏览器标签页和导航链接中。`created_at` 和 `last_updated_at` 使用 ISO 8601 日期格式（YYYY-MM-DD），分别表示文档的创建时间和最后更新时间。`author` 是作者名称，可以是人名、团队名或组织名。`has_custom_tsx` 是布尔值，表示该文档是否关联了自定义 TSX 组件，默认为 false。`description` 是可选的简短描述，用于 SEO 和搜索摘要。

Frontmatter 中不允许使用 Tab 字符进行缩进，必须使用空格。字段名后面紧跟冒号和空格，然后是值。字符串值通常不需要引号，但如果包含特殊字符或冒号，建议使用引号包裹。

## 基础 Markdown 语法

v0plex 完整支持 CommonMark 规范的基础语法。

段落由空行分隔。连续的文本行会被合并为一个段落，除非使用行尾两个空格或 HTML 的 `<br>` 标签强制换行。通常建议通过合理分段而非强制换行来控制文本流，这样在不同宽度的屏幕上都有更好的阅读体验。

标题使用井号表示，一级标题用一个井号，二级用两个，最多支持到六级标题。v0plex 会自动为每个标题生成锚点链接，读者可以通过点击标题旁的链接图标快速定位。

```markdown
# 一级标题
## 二级标题
### 三级标题
```

强调样式有三种：用双星号或双下划线包裹的文本显示为粗体，用单星号或单下划线包裹的显示为斜体，用三个星号包裹的同时显示为粗斜体。删除线用双波浪线表示。

```markdown
**粗体文本** 或 __粗体文本__
*斜体文本* 或 _斜体文本_
***粗斜体文本***
~~删除线文本~~
```

列表分为无序列表和有序列表。无序列表使用减号、加号或星号作为标记，支持多级嵌套，子列表需要缩进。有序列表使用数字后跟句点，数字不必连续，渲染时会按顺序重新编号。

```markdown
- 无序列表项
  - 嵌套项
  - 嵌套项
- 另一项

1. 有序列表项
2. 另一项
   1. 嵌套有序项
   2. 嵌套有序项
```

链接使用方括号包裹链接文本，后面紧跟圆括号包裹的 URL。链接可以指向外部网站、站内其他页面或页内锚点。图像的语法与链接类似，前面加一个感叹号。

```markdown
[外部链接](https://example.com)
[站内链接](../_01_其他章节/_01_文档.md)
[页内锚点](#章节标题)

![图像描述](../assets/images/screenshot.png)
```

引用块使用大于号开头，可以多行连续，也可以嵌套。

```markdown
> 这是一段引用文本。
> 可以跨越多行。
>
> > 这是嵌套引用。
```

代码分为行内代码和代码块。行内代码用单个反引号包裹。代码块用三个反引号包围，可以在开头指定语言以获得语法高亮。

```markdown
行内代码：`const x = 1`

```javascript
function example() {
  return "语法高亮";
}
```
```

## 数学公式

v0plex 支持 LaTeX 格式的数学公式，使用 MathJax 进行渲染。

行内公式用单个美元符号包裹：

```markdown
质能方程 $E = mc^2$ 由爱因斯坦提出。
```

块级公式用双美元符号包裹：

```markdown
$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$
```

v0plex 使用 MathJax 的 `tex-chtml` 输出格式，支持绝大多数标准 LaTeX 数学命令。复杂的公式可能需要较长时间渲染，建议在最终发布前验证显示效果。

## 转义字符

某些字符在 Markdown 中有特殊含义，如果需要显示这些字符本身，需要使用反斜杠进行转义。

```markdown
\* 字面星号 \*
\# 字面井号 \#
\[ 字面方括号 \]
```

在代码块和行内代码中，所有字符都按字面意义处理，不需要转义。

## 编写建议

良好的 Markdown 文档不仅语法正确，还应该易于阅读和维护。

每行长度建议控制在 80 到 100 个字符之间。这不是硬性限制，但过长的行在版本控制中会产生难看的差异对比，在窄屏设备上也不易阅读。大多数现代编辑器都支持自动换行显示，这不会影响实际的 Markdown 渲染。

使用空行明确分隔不同的内容块。段落之间、列表与正文之间、代码块前后都应该有空行，这样源码结构更清晰，也能避免某些边缘情况下的渲染问题。

图像应该配有描述性的替代文本。这不仅是为了可访问性（屏幕阅读器会朗读替代文本），也是为了在图像加载失败时给读者提供上下文。

避免过度嵌套。Markdown 的嵌套层级有限，深层嵌套的结构既难写也难读。如果需要表达复杂的层级关系，考虑拆分为多个页面或使用表格。

## 使用自定义 TSX 组件

当 Markdown 的表达能力无法满足需求时，v0plex 支持使用自定义 React/TSX 组件来完全控制页面的渲染。这适用于需要复杂交互、自定义布局或集成外部组件库的场景。

### 启用自定义组件

要使用自定义 TSX 组件，首先将文档 frontmatter 中的 `has_custom_tsx` 字段设置为 `true`：

```yaml
---
title: 带有自定义组件的文档
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: true
---
```

然后，在与 Markdown 文件相同的目录下，创建一个与 Markdown 文件同名的 TSX 文件。例如，如果 Markdown 文件名为 `_01_我的文档.md`，则创建 `_01_我的文档.tsx`。

### TSX 组件结构

自定义 TSX 组件是一个标准的 React 组件，需要遵循特定的结构以确保与 v0plex 的主题系统正确集成：

```tsx
"use client"

import { GlobalTheme } from "@carbon/react"
import { useTheme } from "@/components/common/theme-provider"

export default function CustomPage() {
    const { theme } = useTheme()

    return (
        <GlobalTheme theme={theme}>
            <div className="v0plex-content">
                <div className="page-typography-content">
                    {/* 在这里编写自定义内容 */}
                    <h1>自定义页面标题</h1>
                    <p>这是使用 React 组件渲染的内容。</p>
                </div>
            </div>
        </GlobalTheme>
    )
}
```

组件必须使用 `"use client"` 指令，因为 v0plex 需要客户端交互功能。`useTheme` hook 用于获取当前的主题设置（light 或 dark），`GlobalTheme` 组件确保 Carbon Design System 的样式与当前主题一致。`v0plex-content` 和 `page-typography-content` 类名确保内容区域采用 v0plex 的标准布局和排版样式。

### 从 Markdown 迁移到自定义组件

如果你已经编写了一份 Markdown 文档，后来需要添加只能通过 React 组件实现的功能（如复杂的交互式表格、数据可视化图表等），迁移过程如下：

首先，保留原有的 Markdown 文件，但将 `has_custom_tsx` 改为 `true`。然后，创建同名的 TSX 文件，按照上述结构编写组件。此时，v0plex 会完全忽略 Markdown 文件的内容（除了 frontmatter 用于生成导航），页面将由 TSX 组件渲染。

这意味着 Markdown 文件仅用于提供导航所需的元数据，实际展示内容由 TSX 文件控制。如果你希望保留原有 Markdown 内容，需要手动将其转换为 JSX 格式并嵌入到 TSX 组件中。对于简单的静态内容，可以复制粘贴后适当调整格式；对于包含 VMD 扩展标签的内容，需要查找对应的 React 组件进行替换。

### 使用 Carbon 组件

由于 v0plex 基于 IBM Carbon Design System，你可以直接使用 Carbon React 组件来构建界面。例如，创建一个结构化的数据表格：

```tsx
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@carbon/react"

// 在组件中使用
<DataTable rows={rows} headers={headers}>
    {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <Table {...getTableProps()}>
            <TableHead>
                <TableRow>
                    {headers.map(header => (
                        <TableHeader {...getHeaderProps({ header })}>
                            {header.header}
                        </TableHeader>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map(row => (
                    <TableRow {...getRowProps({ row })}>
                        {row.cells.map(cell => <TableCell key={cell.id}>{cell.value}</TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )}
</DataTable>
```

这种方式比 Markdown 表格更灵活，支持排序、筛选、分页等交互功能。

### 注意事项

使用自定义 TSX 组件后，该页面将失去 Markdown 的便利性：无法使用 VMD 扩展标签，需要直接使用对应的 React 组件；无法享受 Markdown 的自动链接处理和格式转换；需要手动处理响应式布局和移动适配。

因此，建议仅在必要时使用自定义组件。对于大部分内容，标准 Markdown 配合 VMD 扩展已经足够；只有当需要复杂的客户端交互或特定的布局结构时，才考虑切换到 TSX 组件。
