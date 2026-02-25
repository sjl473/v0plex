"use client"

import {GlobalTheme, Theme} from "@carbon/react"
import {useTheme} from "@/components/common/theme-provider"
import {Livmd, Ulvmd} from "@/components/vmd/ullivmd"
import CodeBlock from "@/components/common/code-block"
import EditThisPage from "@/components/common/edit-this-page"
import styles from "./page.module.css"

export default function HomePage() {
    const {theme} = useTheme()

    return (
        <GlobalTheme theme={theme}>
            <div className="v0plex-content">
                <div className={`page-typography-content ${styles.pageContent}`}>
                    <Theme as="section" theme={theme}>

                        <h1

                        >
                            v0plex
                        </h1>

                        <p>
                            v0plex is a tool that converts Markdown text into React/TSX components.
                            It is designed for content management systems, documentation sites, blogs, or knowledge base
                            frontends.
                        </p>

                        <p>
                            The current version supports standard Markdown syntax plus a limited set of custom extension
                            tags.
                            All Markdown is processed by the vmd converter to generate equivalent HTML/TSX structures.
                            You can find example lorem-ipsum Markdown files in the <CodeBlock
                            inline>{"/dev"}</CodeBlock> folder.
                        </p>

                        <p>How to use?</p>

                        <Ulvmd>
                            <Livmd>
                                You need Node.js (v25.6.1) and pnpm.
                                In the project root folder, run one of the following commands:
                                <br/>
                                • <CodeBlock inline>{"pnpm run dev"}</CodeBlock> → starts local development server with
                                file watching
                                <br/>
                                • <CodeBlock inline>{"pnpm run build"}</CodeBlock> → creates production-ready static
                                files
                            </Livmd>

                            <Livmd>
                                All folders and files in the <CodeBlock inline>{"/dev"}</CodeBlock> directory must be
                                named with a sequentially increasing numeric prefix starting with an underscore.
                                Examples:
                                <br/>
                                <CodeBlock inline>{"_01_introduction.md"}</CodeBlock>
                                <br/>
                                <CodeBlock inline>{"_02_getting-started.md"}</CodeBlock>
                                <br/>
                                <CodeBlock inline>{"_03_components/_01_button.md"}</CodeBlock>
                            </Livmd>

                            <Livmd>
                                If you want to mix custom handwritten TSX components with generated Markdown content:
                                <br/>
                                • Set <CodeBlock inline>{"has_custom_tsx: true"}</CodeBlock> in the frontmatter of the
                                Markdown file
                                <br/>
                                • Create a <CodeBlock inline>{".tsx"}</CodeBlock> file using the exact same numeric
                                prefix as the corresponding Markdown file
                                <br/>
                                Example:
                                <br/>
                                <CodeBlock inline>{"_05_hero-section.md"}</CodeBlock>
                                <br/>
                                <CodeBlock inline>{"_05_hero-section.tsx"}</CodeBlock>
                            </Livmd>

                            <Livmd>
                                For "Edit This Page" link at left downside of pages, we assume majority of users export
                                static pages on Github / Gitlab, go
                                <CodeBlock inline>{"vmd_parser/config.ts"}</CodeBlock> edit corresponding link.
                            </Livmd>
                        </Ulvmd>

                        <br></br>
                        <br></br>

                    </Theme>
                </div>
            </div>
        </GlobalTheme>
    )
}