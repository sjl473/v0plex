"use client"

import type React from "react"
import Link from "next/link"
import {useTheme} from "./theme-provider"
import {Asleep, Light, Menu} from "@carbon/icons-react"
import styles from "./header.module.css"

interface CarbonHeaderProps {
    onToggleSidebar?: () => void
}

export default function Header({onToggleSidebar}: CarbonHeaderProps) {
    const {theme, toggleTheme, mounted} = useTheme()

    if (!mounted) {
        return (<header className={styles.header}>
            <div className={styles.leftSection}>
                <button className={styles.mobileMenuBtn}>
                    <Menu size={20}/>
                </button>
                <Link href="/" className={styles.logoLink}>
                    v0plex
                </Link>
            </div>
            <div className={styles.rightSection}>
                <button className={styles.themeToggle}>
                    <Asleep size={20}/>
                </button>
            </div>
        </header>)
    }

    return (<header className={styles.header}>
        <div className={styles.leftSection}>
            <button onClick={onToggleSidebar} className={styles.mobileMenuBtn}>
                <Menu size={20}/>
            </button>
            <Link href="/" className={styles.logoLink}>
                v0plex
            </Link>
        </div>
        <div className={styles.rightSection}>
            <button
                aria-label={theme === "white" ? "switch dark" : "switch light"}
                title={theme === "white" ? "switch dark" : "switch light"}
                onClick={toggleTheme}
                className={styles.themeToggle}
            >
                {theme === "white" ? <Asleep size={20}/> : <Light size={20}/>}
            </button>
        </div>
    </header>)
}