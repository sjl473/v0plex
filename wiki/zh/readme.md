# v0plex

基于 Next.js + React + TypeScript + Carbon Design System 构建的文档站点生成器。


## 版本

| 技术 | 版本 |
|------|------|
| Next.js | `^15.1.4` |
| React | `^19.0.0` |
| React DOM | `^19.0.0` |
| TypeScript | `^5.7.3` |
| @carbon/react | `1.105.0` |
| tsx | `^4.19.2` |
| Vitest | `^2.1.8` |
| pnpm | 以本地安装版本为准（`pnpm -v` 查看） |
| Python jieba | 最新版（`lex:gen` 脚本自动安装） |


## 可用命令

所有命令均定义在 [`package.json`](package.json) 中，使用 `pnpm` 执行。

### 核心开发命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` | **本地开发**：依次执行 `vmd:gen`、`lex:gen`，然后启动 Next.js 开发服务器（监听 `0.0.0.0`）。|
| `pnpm build` | **生产构建**：依次执行 `vmd:gen`、`lex:gen`，然后执行 `next build` 生成静态 / 服务端产物。|
| `pnpm start` | **启动生产服务器**：运行已构建的 Next.js 应用（需先执行 `pnpm build`）。|

### VMD 内容生成

| 命令 | 作用 |
|------|------|
| `pnpm vmd:gen` | 运行 VMD 解析器（[`vmd_parser/main.ts`](vmd_parser/main.ts)），将 Markdown 源文件转换为 Next.js 页面、提取的代码块、图片资源及站点导航 JSON。默认输入目录为 `dev`。|

### 搜索索引生成

| 命令 | 作用 |
|------|------|
| `pnpm lex:gen` | 生成全文搜索所需的压缩词库。脚本会自动：检查并创建 Python 虚拟环境 `.venv`、安装 `jieba` 分词库、运行 [`scripts/search-script/lex.py`](scripts/search-script/lex.py) 生成索引，最后退出虚拟环境。**注意**：如果当前终端已在某个 Python venv 中，命令会报错并退出。|

### 测试命令

| 命令 | 作用 |
|------|------|
| `pnpm test` | 启动 Vitest 交互式测试运行器（监视模式）。|
| `pnpm test:ui` | 启动 Vitest 并打开图形化 UI 界面。|
| `pnpm test:run` | 一次性运行所有测试并退出（适用于 CI 流水线）。|


## 常用命令速查

```bash
# 安装依赖
pnpm install

# 本地开发（自动生成内容 + 启动 dev server）
pnpm dev

# 构建生产版本（自动生成内容 + next build）
pnpm build

# 仅生成 VMD 页面内容
pnpm vmd:gen

# 仅生成搜索词库
pnpm lex:gen

# 运行测试
pnpm test
```

## 项目结构简介

- `components/` — React 组件（含 VMD 渲染组件）
- `config/` — 站点配置
- `vmd_parser/` — VMD Markdown 解析与页面生成器
- `scripts/search-script/` — 搜索索引生成 Python 脚本
- `dev/` — Markdown
- `public/` — 静态资源（含 MathJax 字体等）

---

## 许可证

© 2026 sjl473
