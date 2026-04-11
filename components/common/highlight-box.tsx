"use client"

import React from "react"
import styles from "./highlight-box.module.css"
import { useLanguage } from "./language-provider"
import { Information, WarningAlt, CheckmarkFilled, ErrorFilled } from "@carbon/icons-react"

export interface HighlightBoxProps {
    title?: string
    children: React.ReactNode
    type?: "Info" | "Warning" | "Success" | "Error"
}

const titleClassMap = {
    Info: styles.titleInfo,
    Warning: styles.titleWarning,
    Success: styles.titleSuccess,
    Error: styles.titleError,
}

const iconMap = {
    Info: Information,
    Warning: WarningAlt,
    Success: CheckmarkFilled,
    Error: ErrorFilled,
}

const iconClassMap = {
    Info: styles.iconInfo,
    Warning: styles.iconWarning,
    Success: styles.iconSuccess,
    Error: styles.iconError,
}

export function HighlightBox({title, children, type = "Info"}: HighlightBoxProps) {
    const { strings } = useLanguage()
    const typeClass = styles[`highlightBox${type.charAt(0).toUpperCase() + type.slice(1)}`]
    const titleClass = titleClassMap[type]
    const IconComponent = iconMap[type]
    const iconClass = iconClassMap[type]
    
    // Use default title from site config if not provided
    const displayTitle = title || strings.boxes[type === "Info" ? "infoDefault" : type === "Warning" ? "warningDefault" : type === "Success" ? "successDefault" : "errorDefault"]

    return (<div className={`${styles.highlightBox} ${typeClass as string}`}>
        <h4 className={`${styles.highlightTitle} ${titleClass}`}>
            {displayTitle}
        </h4>
        <div className={styles.iconWrapper}>
            <IconComponent size={16} className={iconClass} />
        </div>
        <div className={styles.highlightContent}>
            {children}
        </div>
    </div>)
}