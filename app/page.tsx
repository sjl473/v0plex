"use client"

import {GlobalTheme, Theme} from "@carbon/react"
import {useTheme} from "@/components/common/theme-provider"
import {useLanguage} from "@/components/common/language-provider"
import CodeBlock from "@/components/common/code-block"
import styles from "./page.module.css"

export default function HomePage() {
    const {theme} = useTheme()
    const {locale} = useLanguage()
    const isZh = locale === 'zh'

    return (
        <GlobalTheme theme={theme}>
            <div className="v0plex-content">
                <div className={`page-typography-content ${styles.pageContent}`}>
                    <Theme as="section" theme={theme}>

                        <h1>v0plex</h1>

                        <p>
                            {isZh
                                ? "基于 Next.js + React + TypeScript + Carbon Design System 构建的文档站点生成器。"
                                : "A documentation site generator built on Next.js + React + TypeScript + Carbon Design System."
                            }
                        </p>

                        <h2>{isZh ? "版本" : "Versions"}</h2>

                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{isZh ? "技术" : "Technology"}</th>
                                    <th>{isZh ? "版本" : "Version"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Next.js</td><td><code>^15.1.4</code></td></tr>
                                <tr><td>React</td><td><code>^19.0.0</code></td></tr>
                                <tr><td>React DOM</td><td><code>^19.0.0</code></td></tr>
                                <tr><td>TypeScript</td><td><code>^5.7.3</code></td></tr>
                                <tr><td>@carbon/react</td><td><code>1.105.0</code></td></tr>
                                <tr><td>tsx</td><td><code>^4.19.2</code></td></tr>
                                <tr><td>Vitest</td><td><code>^2.1.8</code></td></tr>
                                <tr><td>pnpm</td><td>{isZh ? "以本地安装版本为准（" : "Based on local installed version ("}<code>pnpm -v</code>{isZh ? " 查看）" : ")"}</td></tr>
                                <tr><td>Python jieba</td><td>{isZh ? "最新版（" : "Latest ("}<code>lex:gen</code>{isZh ? " 脚本自动安装）" : " script auto-installs)"}</td></tr>
                            </tbody>
                        </table>

                        <h2>{isZh ? "可用命令" : "Available Commands"}</h2>

                        <p>
                            {isZh
                                ? <>所有命令均定义在 <CodeBlock inline>{"package.json"}</CodeBlock> 中，使用 <CodeBlock inline>{"pnpm"}</CodeBlock> 执行。</>
                                : <>All commands are defined in <CodeBlock inline>{"package.json"}</CodeBlock> and executed with <CodeBlock inline>{"pnpm"}</CodeBlock>.</>
                            }
                        </p>

                        <h3>{isZh ? "核心开发命令" : "Core Development Commands"}</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{isZh ? "命令" : "Command"}</th>
                                    <th>{isZh ? "作用" : "Purpose"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm dev"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? <>本地开发：依次执行 <CodeBlock inline>{"vmd:gen"}</CodeBlock>、<CodeBlock inline>{"lex:gen"}</CodeBlock>，然后启动 Next.js 开发服务器（监听 <CodeBlock inline>{"0.0.0.0"}</CodeBlock>）。</>
                                            : <>Local Development: Runs <CodeBlock inline>{"vmd:gen"}</CodeBlock>, <CodeBlock inline>{"lex:gen"}</CodeBlock>, then starts the Next.js dev server (listening on <CodeBlock inline>{"0.0.0.0"}</CodeBlock>).</>
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm build"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? <>生产构建：依次执行 <CodeBlock inline>{"vmd:gen"}</CodeBlock>、<CodeBlock inline>{"lex:gen"}</CodeBlock>，然后执行 <CodeBlock inline>{"next build"}</CodeBlock> 生成静态 / 服务端产物。</>
                                            : <>Production Build: Runs <CodeBlock inline>{"vmd:gen"}</CodeBlock>, <CodeBlock inline>{"lex:gen"}</CodeBlock>, then runs <CodeBlock inline>{"next build"}</CodeBlock> to generate static / server-side output.</>
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm start"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? <>启动生产服务器：运行已构建的 Next.js 应用（需先执行 <CodeBlock inline>{"pnpm build"}</CodeBlock>）。</>
                                            : <>Start Production Server: Runs the built Next.js app (requires <CodeBlock inline>{"pnpm build"}</CodeBlock> first).</>
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>{isZh ? "VMD 内容生成" : "VMD Content Generation"}</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{isZh ? "命令" : "Command"}</th>
                                    <th>{isZh ? "作用" : "Purpose"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm vmd:gen"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? <>运行 VMD 解析器（<CodeBlock inline>{"vmd_parser/main.ts"}</CodeBlock>），将 Markdown 源文件转换为 Next.js 页面、提取的代码块、图片资源及站点导航 JSON。默认输入目录为 <CodeBlock inline>{"dev"}</CodeBlock>。</>
                                            : <>Runs the VMD parser (<CodeBlock inline>{"vmd_parser/main.ts"}</CodeBlock>), converting Markdown source files into Next.js pages, extracted code blocks, image assets, and site navigation JSON. Default input directory is <CodeBlock inline>{"dev"}</CodeBlock>.</>
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>{isZh ? "搜索索引生成" : "Search Index Generation"}</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{isZh ? "命令" : "Command"}</th>
                                    <th>{isZh ? "作用" : "Purpose"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm lex:gen"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? <>生成全文搜索所需的压缩词库。脚本会自动：检查并创建 Python 虚拟环境 <CodeBlock inline>{".venv"}</CodeBlock>、安装 <CodeBlock inline>{"jieba"}</CodeBlock> 分词库、运行 <CodeBlock inline>{"scripts/search-script/lex.py"}</CodeBlock> 生成索引，最后退出虚拟环境。注意：如果当前终端已在某个 Python venv 中，命令会报错并退出。</>
                                            : <>Generates a compressed lexicon for full-text search. The script automatically: checks and creates a Python virtual environment <CodeBlock inline>{".venv"}</CodeBlock>, installs the <CodeBlock inline>{"jieba"}</CodeBlock> tokenization library, runs <CodeBlock inline>{"scripts/search-script/lex.py"}</CodeBlock> to generate the index, then exits the virtual environment. Note: If the current terminal is already in a Python venv, the command will error and exit.</>
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>{isZh ? "测试命令" : "Test Commands"}</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{isZh ? "命令" : "Command"}</th>
                                    <th>{isZh ? "作用" : "Purpose"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm test"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? "启动 Vitest 交互式测试运行器（监视模式）。"
                                            : "Starts the Vitest interactive test runner (watch mode)."
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm test:ui"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? "启动 Vitest 并打开图形化 UI 界面。"
                                            : "Starts Vitest and opens the graphical UI."
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td><CodeBlock inline>{"pnpm test:run"}</CodeBlock></td>
                                    <td>
                                        {isZh
                                            ? "一次性运行所有测试并退出（适用于 CI 流水线）。"
                                            : "Runs all tests once and exits (suitable for CI pipelines)."
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <h2>{isZh ? "常用命令速查" : "Common Commands Cheat Sheet"}</h2>

                        <pre className={styles.cheatSheet}>
{isZh
? `# 安装依赖
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
pnpm test`
: `# Install dependencies
pnpm install

# Local development (auto-generate content + start dev server)
pnpm dev

# Build for production (auto-generate content + next build)
pnpm build

# Generate VMD page content only
pnpm vmd:gen

# Generate search lexicon only
pnpm lex:gen

# Run tests
pnpm test`
}
                        </pre>

                        <h2>{isZh ? "项目结构简介" : "Project Structure Overview"}</h2>

                        <ul>
                            <li><CodeBlock inline>{"components/"}</CodeBlock> — {isZh ? "React 组件（含 VMD 渲染组件）" : "React components (including VMD rendering components)"}</li>
                            <li><CodeBlock inline>{"config/"}</CodeBlock> — {isZh ? "站点配置" : "Site configuration"}</li>
                            <li><CodeBlock inline>{"vmd_parser/"}</CodeBlock> — {isZh ? "VMD Markdown 解析与页面生成器" : "VMD Markdown parser and page generator"}</li>
                            <li><CodeBlock inline>{"scripts/search-script/"}</CodeBlock> — {isZh ? "搜索索引生成 Python 脚本" : "Search index generation Python scripts"}</li>
                            <li><CodeBlock inline>{"dev/"}</CodeBlock> — Markdown</li>
                            <li><CodeBlock inline>{"public/"}</CodeBlock> — {isZh ? "静态资源（含 MathJax 字体等）" : "Static assets (including MathJax fonts, etc.)"}</li>
                        </ul>

                        <hr className={styles.divider} />

                        <p>
                            <small>© 2026 sjl473</small>
                        </p>

                        <br></br>
                        <br></br>

                    </Theme>
                </div>
            </div>
        </GlobalTheme>
    )
}
