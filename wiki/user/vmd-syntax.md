# VMD 语法参考

VMD 是 v0plex 的 Markdown 扩展语法。你在编写文档时可以使用所有标准 Markdown 语法，同时还能使用 VMD 提供的额外功能。

## Frontmatter

每个 Markdown 文件必须以 frontmatter 开头。Frontmatter 是用三个横线包裹的 YAML 配置块，用于设置页面的元数据。

最基本的 frontmatter 只需要一个标题：

```yaml
---
title: 页面标题
---
```

v0plex 会根据这个标题生成页面标题、导航项名称等信息。

完整的 frontmatter 支持以下字段。`created_at` 记录页面创建日期，格式为 `YYYY-MM-DD`。`last_updated_at` 记录最后更新日期。`author` 记录作者信息。`tags` 是一个标签数组，用于分类页面。`has_custom_tsx` 表示是否使用自定义 React 组件，默认为 `false`。

```yaml
---
title: 快速开始
created_at: 2024-01-01
last_updated_at: 2024-01-15
author: 张三 <zhangsan@example.com>
tags: [tutorial, getting-started]
has_custom_tsx: false
---
```

### 自动填充日期和作者

手动维护日期和作者信息很繁琐，特别是当你频繁更新页面时。v0plex 支持从 git 历史自动获取这些信息。

`created_at: @git` 会查找文件首次被提交的日期。`last_updated_at: @git.latest` 会查找文件最近一次被修改的日期。`author: @git` 会使用 git 配置的用户名和邮箱。

```yaml
---
title: 快速开始
created_at: @git
last_updated_at: @git.latest
author: @git
---
```

使用 `@git` 占位符的前提是你的项目使用 git 进行版本控制，且文件已经被提交过。远程模式下，v0plex 会克隆你配置的内容仓库并读取其 git 历史。本地模式下，v0plex 使用当前项目的 git 历史。

### 作者格式

`author` 字段支持多种格式。可以只写名字 `张三`。可以写名字和邮箱 `张三 <zhangsan@example.com>`。可以写名字和网址 `张三 (https://example.com)`。可以写名字、邮箱和网址 `张三 <zhangsan@example.com> (https://example.com)`。

### 标签

`tags` 数组中的值必须是 `config/site.config.ts` 中 `TAGS_CONFIG.tags` 预定义的标签之一。如果你想添加新标签，需要先在配置文件中添加。

标签用于在站点中分类页面。你可以根据需要在配置中定义任意标签，常见的有 `tutorial` 教程、`api` API 文档、`guide` 指南、`reference` 参考、`advanced` 进阶内容。

## 数学公式

VMD 使用 LaTeX 语法支持数学公式渲染，基于 MathJax 实现。

### 行内公式

用单个美元符号包裹的公式会渲染在行内。例如 `$E = mc^2$` 会显示为爱因斯坦质能方程。行内公式适合简短的数学表达式。

```markdown
能量质量转换公式是 $E = mc^2$，其中 $E$ 是能量，$m$ 是质量，$c$ 是光速。
```

### 块级公式

用双美元符号包裹的公式会独立成行并居中显示。块级公式适合复杂的推导过程或重要的数学表达。

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

块级公式的开始标记 `$$` 必须单独一行，结束标记 `$$` 也必须单独一行。

### LaTeX 支持

VMD 支持大多数 LaTeX 数学命令。常用的包括上下标、分数、根号、求和、积分、矩阵等。

上标用 `^` 表示，下标用 `_` 表示。如果上下标包含多个字符，需要用花括号包裹。`x^2` 表示 x 的平方，`x_{ij}` 表示 x 下标 ij。

分数用 `\frac{分子}{分母}` 表示。根号用 `\sqrt{内容}` 表示，n 次根用 `\sqrt[n]{内容}`。

求和用 `\sum_{下限}^{上限}` 表示。积分用 `\int_{下限}^{上限}` 表示。乘积用 `\prod_{下限}^{上限}` 表示。

矩阵用 `\begin{matrix} ... \end{matrix}` 等环境表示。`pmatrix` 会加圆括号，`bmatrix` 会加方括号，`vmatrix` 会加竖线。

```markdown
$$
A = \begin{pmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{pmatrix}
$$
```

希腊字母用 `\alpha`、`\beta`、`\gamma` 等表示。大写希腊字母首字母大写，如 `\Gamma`、`\Delta`。

特殊符号包括 `\infty` 无穷大、`\partial` 偏导符号、`\nabla` 梯度算子、`\pm` 正负号、`\times` 乘号、`\cdot` 点乘、`\div` 除号。

## 提示框

提示框用于在文档中突出显示重要信息。VMD 提供三种类型的提示框，分别用于不同场景。

### 信息框

`<info>` 标签创建蓝色信息框，用于展示补充说明或提示信息。信息框的内容可以是任意 Markdown 格式。

```markdown
<info>
这是一个信息提示框。你可以在这里放置任何需要注意但不是警告的内容。
</info>
```

信息框通常用于提供上下文、解释概念、给出使用建议等。

### 警告框

`<warning>` 标签创建黄色警告框，用于提醒用户注意潜在问题或风险。

```markdown
<warning>
删除操作不可撤销，请确保你已经备份了重要数据。
</warning>
```

警告框应该用于真正需要用户注意的情况，避免过度使用导致用户忽视警告。

### 成功框

`<success>` 标签创建绿色成功框，用于确认操作成功或标记完成的步骤。

```markdown
<success>
配置完成！你的站点现在已经准备就绪。
</success>
```

成功框适合用于教程末尾、任务完成确认等场景。

### 提示框格式规则

提示框的开始标签和结束标签必须各占一行。提示框内可以包含任意 Markdown 内容，包括代码块、列表、其他提示框等。提示框之间可以嵌套，但不建议超过两层。

## 文章布局

文章布局 `<post>` 用于创建左右分栏的内容展示，左边是文字，右边是图片。这种布局特别适合产品介绍、功能展示、图文教程等场景。

### 基本结构

文章布局由三个标签组成。`<post>` 是容器标签，包裹整个布局。`<lft>` 是左侧内容区，用于放置文字。`<rt>` 是右侧内容区，用于放置图片。

```markdown
<post>
<lft>
这里是左侧的文字内容。你可以使用任何 Markdown 格式，包括标题、列表、代码等。
</lft>
<rt>
![产品截图](screenshot.png)
</rt>
</post>
```

### 左侧内容规则

左侧内容区支持所有行内 Markdown 元素，包括加粗、斜体、行内代码、链接等。也支持标题、列表、引用等块级元素。

左侧内容区不允许包含代码块、数学公式、图片、文章布局、提示框。这是为了保证左右分栏的视觉平衡。

### 右侧内容规则

右侧内容区只允许包含图片。每张图片必须单独一行。图片会自动适应右侧区域的宽度。

```markdown
<post>
<lft>
我们的产品提供了直观的用户界面，让你能够快速上手。
</lft>
<rt>
![界面截图 1](ui-1.png)
![界面截图 2](ui-2.png)
</rt>
</post>
```

### 格式要求

`<post>`、`<lft>`、`<rt>` 的开始和结束标签必须各占一行。`<lft>` 和 `<rt>` 的顺序不能颠倒。一个 `<post>` 内必须包含且仅包含一个 `<lft>` 和一个 `<rt>`。

## 缩略图

`<smallimg>` 标签用于在文本中插入小尺寸图片，比如头像、图标、徽章等。与普通图片不同，缩略图不会占据整行，而是作为行内元素显示。

### 基本用法

`src` 属性指定图片路径，路径相对于当前 Markdown 文件。

```markdown
<smallimg src="avatar.png" />
```

`alt` 属性提供替代文本，用于无障碍访问和图片加载失败时显示。

```markdown
<smallimg src="avatar.png" alt="用户头像" />
```

### 图片处理

v0plex 会自动处理 Markdown 中引用的所有图片。图片会被复制到 `public/vmdimage/` 目录，并使用哈希值重命名以避免缓存问题。编译后的页面会引用处理后的图片路径。

支持的图片格式包括 PNG、JPG、JPEG、GIF、SVG、WebP。图片路径不应该包含空格或特殊字符。

## 代码块

VMD 完整支持 Markdown 的代码块语法，并提供语法高亮。

### 围栏代码块

使用三个反引号创建代码块，可以在反引号后指定语言以启用语法高亮。

```markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
```

支持的语言包括 JavaScript、TypeScript、Python、Java、C、C++、Go、Rust、Ruby、PHP、Swift、Kotlin、HTML、CSS、SCSS、JSON、YAML、Markdown、Shell/Bash、SQL 等。

### 行内代码

使用单个反引号包裹行内代码。

```markdown
使用 `npm install` 命令安装依赖。
```

### 代码文件提取

当代码块的内容以 `// file:` 或 `# file:` 注释开头时，v0plex 会将代码提取为独立文件。提取的文件存放在 `public/vmdcode/` 目录。

```markdown
```javascript
// file: utils.js
export function add(a, b) {
  return a + b;
}
```
```

这对于提供可下载的代码示例很有用。

## 表格

VMD 支持 Markdown 标准表格语法。

```markdown
| 名称 | 类型 | 说明 |
|------|------|------|
| id | number | 唯一标识符 |
| name | string | 用户名称 |
| email | string | 邮箱地址 |
```

表格单元格内支持行内格式，包括加粗、斜体、行内代码、链接等。

## 标准 Markdown 支持

除了上述扩展，VMD 完整支持标准 Markdown 语法。

标题使用 `#` 到 `######` 表示一到六级标题。段落用一个或多个空行分隔。加粗用 `**文字**` 或 `__文字__`。斜体用 `*文字*` 或 `_文字_`。删除线用 `~~文字~~`。加粗斜体用 `***文字***`。

无序列表用 `-`、`*` 或 `+` 开头。有序列表用数字加点开头。列表可以嵌套，用缩进表示层级。

链接用 `[文字](URL)` 表示。图片用 `![替代文本](图片路径)` 表示。引用用 `>` 开头。分割线用三个或更多的 `-`、`*` 或 `_` 表示。

转义字符用反斜杠 `\` 开头，用于显示特殊字符的字面值。

## 语法验证

v0plex 在编译时会验证 Markdown 内容的语法正确性。如果发现问题，会报告错误位置和详细信息。

常见错误包括：frontmatter 缺少必填字段、frontmatter 格式错误、`@git` 占位符但文件不在 git 仓库中、提示框或文章布局标签未正确闭合、文章布局中左侧包含禁止的元素、图片文件不存在。

错误信息会指出具体的文件路径、行号和列号，方便你定位和修复问题。
