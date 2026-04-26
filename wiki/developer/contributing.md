# 贡献指南

感谢你对 v0plex 项目的兴趣。本文档介绍如何为项目贡献代码、报告问题或提出建议。

## 贡献方式

你可以通过多种方式为 v0plex 做出贡献。提交代码修复或新功能。报告 bug 或提出功能建议。改进文档和翻译。分享使用经验。

## 开发环境设置

### 克隆仓库

```bash
git clone https://github.com/your-org/v0plex.git
cd v0plex
```

### 安装依赖

v0plex 使用 pnpm 作为包管理器：

```bash
pnpm install
```

### 运行开发服务器

```bash
pnpm run dev
```

这会启动 VMD 编译器和 Next.js 开发服务器。修改 Markdown 文件需要重新运行编译器才能看到变化。修改 React 组件或样式会自动热重载。

### 运行测试

```bash
pnpm run test
```

测试使用 Vitest 框架。测试文件位于 `vmd_parser/__tests__/` 目录。

## 代码规范

### TypeScript

项目使用 TypeScript，所有代码必须有正确的类型定义。避免使用 `any` 类型，必要时使用 `unknown` 并进行类型守卫。公共 API 需要完整的类型导出。

### 代码风格

代码风格没有强制配置检查工具，但请遵循现有代码的风格。使用 2空格缩进。变量和函数使用 camelCase。类型和接口使用 PascalCase。常量使用 UPPER_SNAKE_CASE。文件名使用小写加连字符。

### 注释

复杂逻辑需要注释解释意图。公共函数需要 JSDoc 注释说明参数和返回值。避免无用的注释，代码应该自解释。

### 组件规范

React 组件使用函数组件和 Hooks。组件文件名使用小写加连字符。每个组件有对应的 CSS Module 文件。组件 props 需要明确的 TypeScript 接口定义。

## 提交代码

### 分支策略

不要直接提交到 main 分支。为每个功能或修复创建独立分支。分支名应该描述变更内容，如 `fix/frontmatter-parsing`、`feature/new-component`。

### 提交信息

提交信息应该清晰描述变更内容。第一行是简要总结，不超过 50 字符。如果需要详细说明，空一行后写详细描述。说明变更的原因和影响。

```
修复 frontmatter 解析时的日期格式问题

解析 @git 占位符时，如果文件没有提交历史会报错。
现在会返回 null 并让调用者处理缺失情况。
```

### Pull Request

提交 Pull Request 前确保所有测试通过。确保代码有适当的测试覆盖。确保文档已更新。PR描述应该说明变更内容和原因。

PR 会被审查后合并。审查过程中可能需要你进行修改。

## 报告问题

如果你发现 bug 或有功能建议，可以在 GitHub Issues 中提交。

### Bug 报告

有效的 bug 报告应该包含以下信息。简要描述问题。详细说明复现步骤。说明预期行为和实际行为。提供相关日志或截图。说明你的环境（操作系统、Node 版本等）。

### 功能建议

功能建议应该说明你希望实现的功能。说明为什么需要这个功能，解决什么问题。如果可能，说明你期望的实现方式。

## 添加新功能

如果你计划添加较大的新功能，建议先在 Issue 中讨论。这样可以确认功能是否符合项目方向，避免重复工作或设计冲突。

### 添加新的 VMD 语法

添加新语法需要修改多个文件。在 `vmd_parser/extensions.ts` 中添加 marked 扩展。在 `vmd_parser/convert_to_vmd.ts` 中处理 HTML 转换。在 `components/vmd/` 中实现渲染组件。在 `vmd_parser/__tests__/` 中添加测试。更新文档说明新语法。

### 添加新的配置选项

添加配置选项需要修改多个地方。在 `config/site.config.ts` 中添加配置定义。在相关模块中读取并使用配置。更新 `wiki/configuration.md` 文档。

## 文档贡献

文档和代码一样重要。如果你发现文档有错误或不清楚的地方，欢迎提交修改。

### 文档风格

文档使用中文编写，面向用户时避免技术术语，需要时给出解释。面向开发者时可以假设读者有相关技术背景。

避免使用 emoji。段落不要太零碎，相关内容放在一起。代码示例要完整可运行。

### 文档结构

用户文档放在 wiki 目录，包括语法参考、配置说明、部署指南等。开发者文档也放在 wiki 目录，包括组件文档、解析器内部机制等。

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行特定测试文件
pnpm run test compiler.test.ts

# 带覆盖率报告
pnpm run test:coverage
```

### 编写测试

测试文件放在 `vmd_parser/__tests__/` 目录。测试文件名以 `.test.ts` 结尾。测试使用 Vitest 框架和 expect 断言。

```typescript
import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../vmd_util';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const input = '---\ntitle: Test\n---\nContent';
    const result = parseFrontmatter(input);
    expect(result.attributes.title).toBe('Test');
    expect(result.body).toBe('Content');
  });

  it('should handle missing frontmatter', () => {
    const input = 'No frontmatter here';
    const result = parseFrontmatter(input);
    expect(result.attributes).toEqual({});
    expect(result.body).toBe(input);
  });
});
```

测试应该覆盖正常情况和边界情况。测试失败时应该给出清晰的错误信息。

## 发布流程

项目维护者负责发布新版本。发布前确保所有测试通过。更新 CHANGELOG。更新版本号。创建 git tag。发布到 npm（如果适用）。

## 行为准则

请尊重所有贡献者。接受建设性批评。关注什么对项目最好，而不是谁对谁错。

## 获取帮助

如果你在贡献过程中遇到问题，可以在 GitHub Issue 中提问。或者在 Pull Request 中@相关维护者寻求帮助。
