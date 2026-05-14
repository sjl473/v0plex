# VMD 语法参考

VMD 是 v0plex 的 Markdown 扩展语法，其与 markdown 保持大部分结构上的相似，但是为了更准确的解析出 tsx 页面，新增了一些额外的 markup

## Frontmatter

每个 Markdown 文件必须以 frontmatter 开头。Frontmatter 是用三个横线包裹的键值对配置块，用于配置页面信息，v0plex 所使用的 Markdown 和标准 Github Flavor Markdown 在某些拓展语法上有所不同。

v0plex 会根据这个标题生成页面标题、导航项名称等信息，**用户使用v0plex** 只填写以下字段，不允许出现额外字段：

- `title`：页面标题
- `created_at`：页面创建日期，格式为 `YYYY-MM-DD` 或 `@git`
- `last_updated_at`：最后更新日期，格式为 `YYYY-MM-DD` 或 `@git`
- `author`：作者信息
- `tags`：标签列表，格式为 `[tag1, tag2]`
- `has_custom_tsx`：是否使用自定义 React 组件，值为 `true` 或 `false`（字符串）

比如：

```yaml
---
title: 快速开始
created_at: 2024-01-01
last_updated_at: 2024-01-15
author: 张三->zhangsan@example.com
tags: [tutorial, getting-started]
has_custom_tsx: false
---
```

### 自动填充日期和作者

v0plex 可以实现自动维护日期和作者信息，`created_at: @git` 会查找文件首次被提交的日期（最早提交）。`last_updated_at: @git` 会查找文件最近一次被修改的日期（最新提交）。`author: @git` 会获取该文件在 git 历史中的所有提交者（按提交时间从旧到新排列，自动去重），格式为 `名字->邮箱`。

```yaml
---
created_at: @git
last_updated_at: @git
author: @git
---
```

使用 `@git` 占位符的前提是你的项目使用 git 进行版本控制，且文件已经被提交过。远程模式下，v0plex 会克隆你配置的内容仓库并读取其 git 历史。本地模式下，v0plex 使用当前项目的 git 历史。

### 如何在页面插入多个作者

`author` 字段支持多种格式，多个作者使用 `|` 分隔：

- 纯名字：`张三`
- 名字和邮箱（使用 `->` 连接）：`张三->zhangsan@example.com`
- 使用 `@git` 占位符：`@git`
- 混合形式：`张三 | 李四->lisi@example.com | @git`，即这代表着张三和李四加上该文件 git 历史中的所有提交者都会被展示在作者行。

### 标签（暂未实现完毕）

todo

## 数学公式

VMD 使用 Mathjax 语法支持数学公式渲染。

### Inline Math

用单个美元符号包裹的公式会渲染在行内。例如 `$E = mc^2$` 会显示为爱因斯坦质能方程。行内公式适合简短的数学表达式。

```markdown
能量质量转换公式是 $E = mc^2$，其中 $E$ 是能量，$m$ 是质量，$c$ 是光速。
```

### Block Math

用双美元符号包裹的公式会独立显示。块级公式适合复杂的推导过程或重要的数学表达。

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## 提示框

提示框用于在文档中突出显示重要信息。VMD 提供三种类型的提示框（info warning success），分别用于不同场景。

```markdown
<info>
这是一个信息提示框。你可以在这里放置任何需要注意但不是警告的内容。
</info>
```

## Post 块

`<post>` 用于创建左右分栏的内容展示，左边是文字，右边是一张或者多张图片。
```markdown
<post>
<lft>

这里是左侧的文字内容。你可以使用任何 Markdown 格式，包括标题、列表、代码等。

</lft>
<rt>

![产品截图](screenshot.png)
![产品截图](screenshot.png)

</rt>
</post>
```

### 格式要求

`<post>`、`<lft>`、`<rt>` 的开始和结束标签必须各占一行。

`<post>` 和 `<lft>` 之间必须只有一个空格或一个换行符。

`</lft>` 和 `<rt>` 之间必须只有一个空格或一个换行符。

`</rt>` 和 `</post>` 之间必须只有一个空格、一个换行符或为空。

`<lft>` 的内容开头和结尾都必须有两个换行符（即内容前后各空一行）。

`<rt>` 的内容开头和结尾也都必须有两个换行符。

一个 `<post>` 内必须包含且仅包含一个 `<lft>` 和一个 `<rt>`，且 `<lft>` 必须在 `<rt>` 之前。

### 左侧内容规则

左侧内容区支持行内 Markdown 元素，包括加粗、斜体、行内代码、链接、行内数学公式等。也支持标题、列表等块级元素。

左侧内容区 **不允许** 包含以下内容：

- 围栏代码块（```）
- 块级数学公式（`$$...$$`）
- 普通 Markdown 图片（`![alt](src)`）
- 引用块（`>`）
- `<post>`、`<lft>`、`<rt>`、`<info>`、`<warning>`、`<success>`、`<smallimg>` 标签

### 右侧内容规则

右侧内容区 **只允许包含图片**，且每张图片必须单独一行。图片必须有 alt 文本。图片之间必须有换行分隔。

## Small Image（略缩图）

`<smallimg>` 标签用于在文本中插入小尺寸图片，比如头像、图标、徽章等。与普通图片不同，缩略图不会占据整行，而是作为行内元素显示。

```markdown
<smallimg>![用户头像](avatar.png)</smallimg>
```

## 图片处理

v0plex 会自动处理 Markdown 中引用的所有图片。图片会被复制到 `public/vmdimage/` 目录，并使用 hash 改名。编译后的页面会引用处理后的图片路径。图片需要放在 `dev/assets/images/` 中（在本地模式开发），或放在远程 Markdown 的 Git 仓库中。

## 代码

VMD 完整支持 Markdown 的代码块语法，并提供语法高亮。v0plex 会自动将所有代码（包括行内代码和围栏代码块）提取为独立文件，存放在 `public/vmdcode/` 目录，文件名使用内容哈希值。提取后的代码会在页面中以 VMD 组件形式渲染，并提供复制功能。

## 表格

VMD 的表格需要使用 `<table>` 标签包裹标准 Markdown 表格语法。

```markdown
<table>

| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 唯一标识符 |
| name | string | 用户名称 |
| email | string | 邮箱地址 |

</table>
```

`<table>` 和 `</table>` 必须各占一行，且与表格内容之间需要空行分隔。

表格单元格内支持行内格式，包括加粗、斜体、行内代码、行内数学公式、链接、删除线等。

表格单元格内 **不允许** 包含以下块级元素：代码块、块级数学公式、图片、引用块、列表、以及其他块级 HTML 标签。

## Grid 表格

`<tablegrid>` 与 `<table>` 的语法和校验规则完全一致，区别仅在于渲染方式：`<tablegrid>` 使用 CSS Grid 布局渲染为卡片式表格，适合展示属性对比、功能矩阵等场景。

```markdown
<tablegrid>

| 特性 | 方案 A | 方案 B |
|------|--------|--------|
| 性能 | `O(n)` | `O(log n)` |
| 兼容性 | 支持 | **不支持** |
| 成本 | $100 | $200 |

</tablegrid>
```

`<tablegrid>` 和 `</tablegrid>` 必须各占一行，且与表格内容之间需要空行分隔。单元格内的允许和禁止的内容与 `<table>` 完全相同。

## 标准 Markdown 支持

除了上述扩展，VMD 完整支持标准 Markdown 语法。

标题使用 `#` 到 `######` 表示一到六级标题。段落用一个或多个空行分隔。加粗用 `**文字**` 或 `__文字__`。斜体用 `*文字*` 或 `_文字_`。删除线用 `~~文字~~`。加粗斜体用 `***文字***`。

无序列表用 `-`、`*` 或 `+` 开头。有序列表用数字加点开头。列表可以嵌套，用缩进表示层级。

链接用 `[文字](URL)` 表示。图片用 `![替代文本](图片路径)` 表示。引用用 `>` 开头。分割线用三个或更多的 `-`、`*` 或 `_` 表示。

转义字符用反斜杠 `\` 开头，用于显示特殊字符的字面值。