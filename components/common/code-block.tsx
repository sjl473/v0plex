"use client"

import React, {useEffect, useState} from "react"
import {PrismLight as SyntaxHighlighter} from "react-syntax-highlighter"
import {vscDarkPlus} from "react-syntax-highlighter/dist/esm/styles/prism"
import {Checkmark, Copy} from "@carbon/icons-react"
import {useTheme} from "@/components/common/theme-provider"
import styles from "./code-block.module.css"

import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift'
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp'
import go from 'react-syntax-highlighter/dist/cjs/languages/prism/go'


SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('csharp', csharp)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('swift', swift)
SyntaxHighlighter.registerLanguage('kotlin', kotlin)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('c', c)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('go', go)

interface CodeBlockProps {
    children?: string
    language?: string
    inline?: boolean
    showLineNumbers?: boolean
    filePath?: string
}

export default function CodeBlock({
                                      children, language = "text", inline = false, showLineNumbers = false, filePath
                                  }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)
    const [codeContent, setCodeContent] = useState<string>(children || "")
    const [isLoading, setIsLoading] = useState(!!filePath)
    const [error, setError] = useState<string | null>(null)
    const {theme} = useTheme()
    const isDarkTheme = theme === "g100"
    const themeClass = isDarkTheme ? styles.darkTheme : styles.darkTheme

    const codeStyle = isDarkTheme ? vscDarkPlus : vscDarkPlus

    useEffect(() => {
        if (filePath) {
            setIsLoading(true)
            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        // throw new Error(`Failed to load code file: ${response.statusText}`)
                    }
                    return response.text()
                })
                .then(code => {
                    setCodeContent(code)
                    setIsLoading(false)
                })
                .catch(err => {
                    setError(err.message)
                    setIsLoading(false)
                    // console.error("Error loading code file:", err)
                })
        }
    }, [filePath])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // console.error("Failed to copy text: ", err)
        }
    }

    if (inline) {
        return (<code className={`${styles.inlineCode} ${themeClass}`}>
            {children || codeContent}
        </code>)
    }

    if (isLoading) {
        return (<div className={`${styles.codeBlockContainer} ${themeClass}`}>
            <div className={styles.loadingContainer}>
                Loading code...
            </div>
        </div>)
    }

    if (error) {
        return (<div className={`${styles.codeBlockContainer} ${themeClass} ${styles.errorContainer}`}>
            Error loading code: {error}
        </div>)
    }

    return (<div className={`${styles.codeBlockContainer} ${themeClass}`}>
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeBlockHeader}>
          <span className={styles.codeBlockLanguage}>
            {language} {filePath && <span className={styles.filePath}>(from: {filePath.split('/').pop()})</span>}
          </span>
                <button
                    onClick={handleCopy}
                    className={styles.copyButton}
                    title="Copy Code"
                    aria-label="Copy Code"
                >
                    {copied ? <Checkmark size={16}/> : <Copy size={16}/>}
                </button>
            </div>

            <SyntaxHighlighter
                language={language}
                style={codeStyle}
                showLineNumbers={showLineNumbers}
                wrapLongLines={true}
                className={styles.syntaxHighlighter}
                codeTagProps={{
                    style: {
                        fontFamily: '"IBM Plex Mono", monospace'
                    }
                }}
            >
                {codeContent}
            </SyntaxHighlighter>
        </div>
    </div>)
}