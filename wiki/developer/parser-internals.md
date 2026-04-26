# 解析器内部机制

本文档面向需要修改或扩展 v0plex 解析器的开发者。如果你只是使用 v0plex 编写内容，不需要阅读本文档。

v0plex 解析器是整个系统的核心，负责将 Markdown 文件转换为可运行的 React 页面。理解解析器的工作原理有助于你调试问题、添加新功能或优化性能。

## 整体架构

解析器位于 `vmd_parser/` 目录，由多个模块组成。每个模块负责编译管道的一个阶段。

### 模块职责

`main.ts` 是 CLI 入口，解析命令行参数并启动构建流程。`vmd_util.ts` 是核心工具类，包含文件操作、资源处理、git 操作、frontmatter 解析、站点构建等功能。`extensions.ts` 定义 marked 扩展，实现自定义 VMD 语法。`convert_to_vmd.ts` 将标准 HTML 转换为 VMD 组件标记。`syntax_validator.ts` 提供语法验证和错误报告。`types.ts` 定义核心类型接口。

### 执行流程

解析器按顺序执行七个阶段。准备阶段验证配置、克隆仓库（远程模式）、清理输出目录。解析阶段扫描目录结构、从 Markdown 文件解析 frontmatter。解析阶段处理 `@git` 占位符，通过 git 历史获取日期和作者信息。处理阶段对图片进行哈希和复制、提取代码块到独立文件。编译阶段将 Markdown 转换为 React TSX 组件。链接阶段构建跨语言导航链接。输出阶段写入页面文件和站点导航 JSON。

## 核心类型

`types.ts` 定义了解析器使用的核心数据结构。

### FrontMatterAttributes

描述 Markdown 文件开头的 YAML 元数据：

```typescript
export interface FrontMatterAttributes {
  title?: string;
  created_at?: string;
  last_updated_at?: string;
  author?: string;
  has_custom_tsx?: boolean | string;
  [key: string]: any;
}
```

索引签名允许 frontmatter 包含任意字段，解析器会保留这些字段供自定义使用。

### NavigationNode

描述导航树的一个节点。节点可以是页面或文件夹：

```typescript
export interface NavigationNode {
  title: string;
  type: 'page' | 'folder';
  path: string;
  hash: string;
  hasCustomTsx: boolean;
  mdPath: string;
  tsxPath: string;
  codeFiles: { originalPath: string; hashPath: string }[];
  images: { originalName: string; hashPath: string }[];
  tags: string[];
  locale?: string;
  children: NavigationNode[];
  languageLinks?: Record<string, string>;
  prefixId?: string;
}
```

`path` 是 Web 访问路径，如 `/page/abc123`。`hash` 是页面的唯一标识符。`prefixId` 用于跨语言匹配，提取自文件名的数字前缀。

### SiteData

描述整个站点的数据结构：

```typescript
export interface SiteData {
  navigation: NavigationNode[];
  images: { originalPath: string; hashPath: string }[];
  availableLocales?: string[];
  defaultLocale?: string;
}
```

站点数据会被序列化为 JSON，供前端导航使用。

## VmdUtil 类

`vmd_util.ts` 是解析器的核心，`VmdUtil` 类封装了所有构建逻辑。

### 类状态

VmdUtil 实例维护构建过程中的状态。`errors` 累积构建过程中的错误。`imageNameToHash` 记录图片原始名称到哈希名称的映射。`siteImages` 记录站点级别的图片列表。`generatedTsxFiles` 记录已生成的 TSX 文件。`navigation` 是构建中的导航树。`isRemote` 标记当前是本地还是远程模式。

### 错误处理

解析器使用结构化的错误代码系统。`VmdErrorCode` 枚举定义所有错误代码。`VmdError` 类扩展原生 Error，添加文件位置信息。

错误代码遵循命名规范。E 前缀表示通用错误，E1xxx 系统错误，E2xxx frontmatter 错误，E3xxx markdown 错误。V 前缀表示 v0plex 特定错误，V0xxx 配置错误，V1xxx git 错误，V2xxx dev 文件夹错误。

```typescript
export enum VmdErrorCode {
  E1001_FILE_NOT_FOUND = 'E1001_FILE_NOT_FOUND',
  E2001_MISSING_TITLE = 'E2001_MISSING_TITLE',
  V0001_GIT_NOT_AVAILABLE = 'V0001_GIT_NOT_AVAILABLE',
}
```

错误包含精确的位置信息，方便用户定位问题：

```typescript
export interface ErrorLocation {
  file: string;
  line: number;
  column?: number;
}

export class VmdError extends Error {
  code: VmdErrorCode;
  location?: ErrorLocation;
  // ...
}
```

### 文件操作

`fileOperation` 方法提供统一的文件读写接口，自动处理错误：

```typescript
fileOperation<T>(
  operation: () => T,
  filePath: string,
  errorCode: VmdErrorCode
): T | undefined
```

如果操作失败，会创建并累积错误，返回 undefined 而不是抛出异常。这样构建可以继续，收集所有错误后一次性报告。

### 资源处理

图片处理涉及几个方法。`processImage` 读取图片内容，计算 SHA256 哈希，生成唯一文件名，复制到输出目录。`validateImageExists` 检查图片文件是否存在，拒绝远程 URL。`getHashedImageName` 根据原始路径获取哈希后的名称。

代码块提取由 `writeCodeFile` 处理，将代码内容写入 `vmdcode` 目录，文件名基于内容哈希。

### Git 操作

Git 相关方法处理 `@git` 占位符。`checkGitAvailable` 测试 git 命令是否可用。`resolveDate` 从 git 历史获取文件的创建或修改日期。`resolveAuthor` 获取 git 配置的用户名和邮箱。

```typescript
resolveDate(
  filePath: string,
  type: 'earliest' | 'latest',
  repoPath?: string
): string | null
```

远程模式下，`repoPath` 参数指定克隆仓库的路径。

### 目录遍历

`traverseDirectory` 递归遍历内容目录，构建导航树：

```typescript
traverseDirectory(
  dirPath: string,
  locale: string,
  basePath: string
): NavigationNode[]
```

遍历过程会按照文件名中的数字前缀排序，确保导航顺序正确。文件夹名称的前缀会被移除，只保留显示名称。

### 页面生成

`processMarkdownFile` 处理单个 Markdown 文件，生成页面组件。流程包括解析 frontmatter、解析 `@git` 占位符、编译 Markdown 为 TSX、生成页面组件代码、写入文件。

`generatePageComponent` 生成最终的 React 组件代码：

```typescript
generatePageComponent(
  title: string,
  vmdContent: string,
  createdAt: string,
  lastUpdatedAt: string,
  mdPath: string,
  hasCustomTsx: boolean,
  codeFiles: CodeFile[],
  usedImages: ImageReference[]
): string
```

生成的代码包含组件导入、日期显示、内容渲染、编辑链接等。

## Markdown 扩展

`extensions.ts` 定义了 marked 的自定义扩展，实现 VMD 特有语法。

### 扩展结构

每个扩展是一个对象，包含 `name`、`level`、`start`、`tokenizer`、`renderer` 属性：

```typescript
{
  name: 'info',
  level: 'block',
  start(src: string) { return src.match(/<info>/)?.index; },
  tokenizer(src: string, tokens: Token[]) { /* ... */ },
  renderer(token: Token) { /* ... */ }
}
```

`level` 可以是 `block` 或 `inline`，决定扩展处理的是块级还是行内元素。`start` 返回语法在源码中的起始位置。`tokenizer` 解析语法，返回 token 对象。`renderer` 将 token 转换为 HTML 字符串。

### 提示框扩展

`createCustomBlock` 工厂函数创建 info、warning、success 等提示框扩展：

```typescript
function createCustomBlock(type: 'info' | 'warning' | 'success'): Extension {
  return {
    name: type,
    level: 'block',
    start(src) { return src.indexOf(`<${type}>`); },
    tokenizer(src) {
      const match = src.match(new RegExp(`^<${type}>([\\s\\S]*?)<\\/${type}>`));
      if (!match) return;
      return {
        type: type,
        raw: match[0],
        text: match[1].trim(),
        tokens: this.lexer.blockTokens(match[1].trim())
      };
    },
    renderer(token) {
      return `<${capitalize(type)}vmd>${this.parser.parse(token.tokens)}</${capitalize(type)}vmd>`;
    }
  };
}
```

### 数学扩展

数学扩展处理 `$...$` 和 `$$...$$` 语法。需要特殊处理避免与代码块中的美元符号冲突：

```typescript
const inlineMathExtension = {
  name: 'inlineMath',
  level: 'inline',
  start(src) {
    const index = src.indexOf('$');
    if (index === -1) return;
    // 检查是否在代码块内
    if (isPositionInCode(src, index)) return;
    return index;
  },
  // ...
};
```

### 文章布局扩展

文章布局扩展是最复杂的，需要验证内容规则：

```typescript
const createPostBlock = (util: VmdUtil, imagePrefix: string, filePath: string) => ({
  name: 'post',
  level: 'block',
  tokenizer(src) {
    // 解析 <post><lft>...</lft><rt>...</rt></post>
    // 验证左侧内容不包含禁止元素
    // 验证右侧只包含图片
    // ...
  },
  renderer(token) {
    // 生成 <Postvmd><Lftvmd>...</Lftvmd><Rtvmd>...</Rtvmd></Postvmd>
    // ...
  }
});
```

验证失败时会抛出 VmdError，指出具体的违规内容和位置。

## HTML 转换

`convert_to_vmd.ts` 负责 marked 输出的 HTML 到 VMD 组件标记的转换。

### 后缀添加

`addVmdSuffix` 函数使用正则表达式将 HTML 标签转换为 VMD 组件：

```typescript
export function addVmdSuffix(
  html: string,
  util: VmdUtil,
  usedImages: ImageReference[]
): string {
  return html.replace(/<\/?([a-z][a-z0-9]*)/gi, (match, tagName) => {
    // img 标签特殊处理，解析 src 并获取哈希路径
    // void 标签自闭合
    // 其他标签添加 Vmd 后缀
  });
}
```

### 结构修正

`fixLinkedImages` 修正图片和链接的嵌套顺序。`unwrapInvalidNesting` 解除段落内嵌套的块级元素。

这些修正处理 marked 输出的边界情况，确保生成的 JSX 结构正确。

## 语法验证

`syntax_validator.ts` 在编译前后执行语法验证，检测错误并报告精确位置。

### 行号追踪

编译过程中需要将 marked 中的位置映射回源文件行号。`scanVmdBlocks` 预扫描 Markdown，记录所有 VMD 块的行号。`getBlockLineNumber` 获取下一个块的行号。`calculateSubContentLine` 计算嵌套内容的行号。

### 编译上下文

`setCompilationContext` 存储当前编译文件的信息。`getFileLocation` 根据位置构建错误位置信息。

```typescript
setCompilationContext(filePath, source, frontmatterLineCount);
// 编译过程...
const location = getFileLocation(position);
clearCompilationContext();
```

### 验证器

`detectNestedCodeBlocks` 检测代码块嵌套错误。`detectInvalidTagNesting` 检测非法的标签嵌套。

## 调试技巧

### 启用调试输出

可以在 `vmd_util.ts` 中启用详细日志：

```typescript
const DEBUG = true;
if (DEBUG) {
  console.log(`Processing: ${filePath}`);
}
```

### 查看中间产物

编译过程中会生成中间文件。查看 `app/page/` 下的 TSX 文件可以了解生成的代码结构。查看 `public/vmdjson/site-data.json` 可以了解导航数据结构。

### 测试用例

`vmd_parser/__tests__/` 目录包含解析器测试。添加测试用例来复现和修复问题：

```typescript
describe('VMD Parser', () => {
  it('should parse frontmatter correctly', () => {
    const result = parseFrontmatter('---\ntitle: Test\n---\nContent');
    expect(result.attributes.title).toBe('Test');
  });
});
```

运行测试：

```bash
pnpm run test
```

## 性能考虑

解析器处理大量文件时需要注意性能。图片处理是 IO 密集操作，考虑并行处理。目录遍历是递归操作，注意栈深度。marked 解析是 CPU 密集操作，大文件可能耗时。

优化策略包括缓存已处理的图片哈希、并行处理独立文件、增量构建只处理变化的文件。
