# 组件文档

本文档面向需要修改 v0plex 源码的开发者。如果你只是使用 v0plex 编写内容，不需要阅读本文档。

v0plex 使用组件化的方式渲染 Markdown 内容。每个 Markdown 元素都对应一个 React 组件，这些组件在 `components/vmd/` 目录下定义。

## 组件系统架构

Markdown 编译后生成的是 JSX 代码，其中使用的是 VMD 组件而非标准 HTML 标签。例如，`# 标题` 会编译为 `<H1vmd>标题</H1vmd>` 而非 `<h1>标题</h1>`。

这种设计有几个优势。组件可以封装复杂的样式和行为。组件可以接收额外的 props 进行定制。组件可以集成第三方库，如代码高亮、数学公式渲染等。组件系统便于维护和扩展。

### 组件命名约定

所有 VMD 组件都以后缀 `vmd` 命名，如 `H1vmd`、`Pvmd`、`Imgvmd`。这种命名方式有两个目的。一是在 JSX 中一眼就能区分 VMD 组件和普通 HTML。二是避免与标准 HTML 元素冲突。

组件文件名采用小写加连字符的形式，如 `hvmd.tsx`、`imgvmd.tsx`。每个文件可以导出多个相关组件。

### 组件导入

所有 VMD 组件通过 `vmdimporter.tsx` 统一导出。这个文件做了两件事。一是从各个组件文件导入组件。二是将所有组件组装成一个对象，供动态渲染使用。

生成的页面组件会从这个文件导入所需的组件：

```typescript
import { H1vmd, Pvmd, Imgvmd, ... } from '@/components/vmd/vmdimporter';
```

## 排版组件

排版组件处理文本内容的显示，包括标题、段落、强调等。

### 标题组件

`hvmd.tsx` 导出六个标题组件：`H1vmd` 到 `H6vmd`，对应 Markdown 的六个标题级别。

标题组件的主要职责是应用正确的样式。不同级别的标题有不同的字体大小、行高和边距。标题组件还会生成锚点 ID，用于页面内跳转和目录生成。

```typescript
export function H1vmd({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h1 id={id} className={styles.heading1}>{children}</h1>;
}
```

修改标题样式时，编辑 `hvmd.module.css` 文件。样式使用 CSS Modules 隔离，不会影响其他组件。

### 段落组件

`pvmd.tsx` 导出 `Pvmd` 组件，对应 Markdown 的段落。

段落组件处理文本的行高、边距等排版细节。它还会处理段落内的嵌套元素，如加粗、斜体、链接等。

### 强调组件

`typovmd.tsx` 导出文本强调相关的组件。`Boldvmd` 对应 `**文字**` 语法。`Italicvmd` 对应 `*文字*` 语法。`Bolditvmd` 对应 `***文字***` 语法。`Strikevmd` 对应 `~~文字~~` 语法。`Brvmd` 对应换行。

这些组件通常是简单的样式包装：

```typescript
export function Boldvmd({ children }: { children: React.ReactNode }) {
  return <strong className={styles.bold}>{children}</strong>;
}
```

## 列表组件

`ullivmd.tsx` 和 `ollivmd.tsx` 导出列表相关的组件。

`Ulvmd` 是无序列表容器，对应 Markdown 的 `-` 或 `*` 列表语法。`Olvmd` 是有序列表容器，对应 Markdown 的 `1.` 列表语法。`Livmd` 是列表项，用于两种列表。

列表组件处理列表标记、缩进、嵌套等样式。嵌套列表通过 CSS 选择器自动处理，不需要额外的组件逻辑。

## 链接和图片组件

### 链接组件

`avmd.tsx` 导出 `Avmd` 组件，对应 Markdown 的链接语法。

链接组件处理外部链接和内部链接的不同行为。外部链接会在新标签页打开，并添加安全属性。内部链接会使用 Next.js 的 Link 组件进行客户端导航。

```typescript
export function Avmd({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http');
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link href={href}>{children}</Link>;
}
```

### 图片组件

`imgvmd.tsx` 导出 `Imgvmd` 组件，对应 Markdown 的图片语法。

图片组件处理响应式图片显示。它会根据容器宽度自动调整图片大小，并处理加载失败的情况。

图片路径在编译时已经被处理为哈希路径。组件接收的是处理后的路径，不需要再进行路径转换。

### 缩略图组件

`smallimgvmd.tsx` 导出 `Smallimgvmd` 组件，对应 `<smallimg>` 标签。

缩略图组件与普通图片组件的区别在于尺寸和定位。缩略图是行内元素，显示为小尺寸图片。

## 代码组件

`codevmd.tsx` 导出代码相关的组件。

### 行内代码

`Inlinecodevmd` 对应 Markdown 的行内代码语法，用单个反引号包裹。

行内代码组件应用等宽字体和背景色，与普通文本区分。

### 代码块

`Blockcodevmd` 对应 Markdown 的代码块语法，用三个反引号包裹。

代码块组件使用 react-syntax-highlighter 提供语法高亮。它接收代码内容、语言和文件名作为 props。

```typescript
export function Blockcodevmd({ 
  children, 
  language, 
  filename 
}: { 
  children: string; 
  language?: string;
  filename?: string;
}) {
  return (
    <div className={styles.codeBlock}>
      {filename && <div className={styles.filename}>{filename}</div>}
      <SyntaxHighlighter language={language} style={theme}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
```

修改代码块样式时，可以修改 `code-block.module.css` 文件，也可以更换语法高亮主题。

## 数学组件

`mathvmd.tsx` 导出数学公式相关的组件。数学组件依赖 MathJax 进行渲染。

### 行内公式

`Inlinemathvmd` 对应 `$...$` 语法，渲染行内数学公式。

### 块级公式

`Blockmathvmd` 对应 `$$...$$` 语法，渲染独立的数学公式块。

数学组件将 LaTeX 源码传递给 MathJax 进行渲染。MathJax 的配置在 `mathjax-provider.tsx` 中管理。

## 提示框组件

`boxvmd.tsx` 导出提示框相关的组件。

### 提示框类型

`Infovmd` 创建蓝色信息框。`Warningvmd` 创建黄色警告框。`Successvmd` 创建绿色成功框。`Titlevmd` 是提示框的标题区域。`Contentvmd` 是提示框的内容区域。

提示框组件使用 CSS 变量控制颜色，便于主题切换：

```typescript
export function Infovmd({ children }: { children: React.ReactNode }) {
  return <div className={styles.info}>{children}</div>;
}
```

对应的 CSS：

```css
.info {
  border-left: 4px solid var(--info-color);
  background: var(--info-bg);
  padding: 1rem;
}
```

## 布局组件

`postvmd.tsx` 导出文章布局相关的组件。

### 组件结构

`Postvmd` 是布局容器，创建左右分栏的结构。`Lftvmd` 是左侧内容区，放置文字。`Rtvmd` 是右侧内容区，放置图片。

布局组件使用 CSS Grid 或 Flexbox 实现响应式分栏。在移动端，左右分栏会变为上下堆叠。

```typescript
export function Postvmd({ children }: { children: React.ReactNode }) {
  return <div className={styles.post}>{children}</div>;
}
```

```css
.post {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .post {
    grid-template-columns: 1fr;
  }
}
```

## 表格组件

`tablevmd.tsx` 导出表格相关的组件。`Tablevmd` 是表格容器。`Tableheadvmd` 是表头区域。`Tablebodyvmd` 是表体区域。`Tablerowvmd` 是表格行。`Tablecellvmd` 是表格单元格。

表格组件处理表格的响应式显示。在小屏幕上，表格可以横向滚动或重新布局。

## 通用组件

通用组件位于 `components/common/` 目录，提供站点级别的功能。这些组件不直接对应 Markdown 元素，而是用于站点导航、布局等。

### 侧边栏

`sidebar.tsx` 实现左侧导航栏。它读取导航数据并渲染为可折叠的树形结构。侧边栏支持折叠和展开分组，当前页面会高亮显示。

### 页头

`header.tsx` 实现站点顶部导航。通常包含站点 logo、搜索入口、语言切换等。

### 页脚

`footer.tsx` 实现站点底部信息。通常包含版权信息、链接等。

### 页面导航

`page-navigation.tsx` 显示上一篇和下一篇链接。它根据导航数据确定当前页面的前后页面。

### 目录

`right-sidebar.tsx` 显示当前页面的目录。它提取页面中的标题生成目录链接。

### 最后更新

`last-updated-at.tsx` 显示页面的最后更新时间。时间数据来自 frontmatter 的 `last_updated_at` 字段。

### 编辑链接

`edit-this-page.tsx` 提供编辑此页的链接。链接指向 GitHub 仓库中对应的 Markdown 文件。

## 创建新组件

如果你需要添加新的 Markdown 语法支持，需要创建新的 VMD 组件。

首先在 `components/vmd/` 目录创建组件文件。实现组件逻辑和样式。然后在 `vmdimporter.tsx` 中导出组件。接着在 `vmd_parser/extensions.ts` 中添加 marked 扩展，将新语法编译为使用新组件的 JSX。最后在 `vmd_parser/convert_to_vmd.ts` 中处理 HTML 到组件的转换。

## 样式定制

VMD 组件使用 CSS Modules 进行样式隔离。每个组件有对应的 `.module.css` 文件。

### CSS 变量

全局 CSS 变量在 `app/globals.css` 中定义。这些变量控制整个站点的配色和排版。

```css
:root {
  --primary-color: #0070f3;
  --text-color: #333;
  --background: #fff;
  --info-color: #0070f3;
  --warning-color: #f5a623;
  --success-color: #00a854;
}
```

修改这些变量可以快速改变站点外观。

### 暗色主题

v0plex 支持暗色主题。暗色主题的 CSS 变量在 `[data-theme="dark"]` 选择器下定义。

```css
[data-theme="dark"] {
  --text-color: #fff;
  --background: #1a1a1a;
}
```

主题切换由 `theme-provider.tsx` 管理，使用 next-themes 库实现。

## 组件测试

组件测试文件应该放在组件同级目录或 `__tests__` 目录下。测试使用 Vitest 和 React Testing Library 编写。

测试重点包括组件是否正确渲染 children、props 是否正确应用、样式类是否正确设置、交互行为是否正确。
