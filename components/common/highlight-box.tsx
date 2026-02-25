"use client"

import React from "react"
import styles from "./highlight-box.module.css"

export interface HighlightBoxProps {
    title: string
    children: React.ReactNode
    type?: "Info" | "Warning" | "Success"
}

export function HighlightBox({title, children, type = "Info"}: HighlightBoxProps) {
    const typeClass = styles[`highlightBox${type.charAt(0).toUpperCase() + type.slice(1)}`]

    return (<div className={`${styles.highlightBox} ${typeClass}`}>
        <h4 className={styles.highlightTitle}>
            {title}
        </h4>
        <div className={styles.highlightContent}>
            {children}
        </div>
    </div>)
}