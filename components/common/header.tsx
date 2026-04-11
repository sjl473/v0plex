"use client"

import type React from "react"
import Link from "next/link"
import {useTheme} from "./theme-provider"
import {useLanguage} from "./language-provider"
import {getLanguageConfig} from "@/config/site.config"
import {Asleep, Light, Translate, LogoGithub, RightPanelOpen, RightPanelClose} from "@carbon/icons-react"
import styles from "./header.module.css"

interface CarbonHeaderProps {
    onToggleSidebar?: () => void
    onToggleRightSidebar?: () => void
    isRightSidebarOpen?: boolean
    isSidebarOpen?: boolean
}

export default function Header({onToggleSidebar, onToggleRightSidebar, isRightSidebarOpen, isSidebarOpen}: CarbonHeaderProps) {
    const {theme, toggleTheme, mounted: themeMounted} = useTheme()
    const {locale, toggleLocale, strings, availableLanguages, mounted: langMounted} = useLanguage()

    const mounted = themeMounted && langMounted
    const currentLang = getLanguageConfig(locale)
    const nextLangIndex = (availableLanguages.findIndex(l => l.code === locale) + 1) % availableLanguages.length
    const nextLang = availableLanguages[nextLangIndex]

    if (!mounted) {
        return (<header className={styles.header}>
            <div className={styles.leftSection}>
                <button className={styles.mobileMenuBtn}>
                    <span className={styles.hamburgerLine}></span>
                    <span className={styles.hamburgerLine}></span>
                    <span className={styles.hamburgerLine}></span>
                </button>
                <Link href="/" className={styles.logoLink}>
                    v0plex
                </Link>
            </div>
            <div className={styles.rightSection}>
                <button className={styles.themeToggle}>
                    <Asleep size={16}/>
                </button>
                <a className={styles.gitLink}>
                    <LogoGithub size={16}/>
                </a>
                <button className={styles.langToggle}>
                    <Translate size={16}/>
                </button>
            </div>
        </header>)
    }

    return (<header className={styles.header}>
        <div className={styles.leftSection}>
            <button onClick={onToggleSidebar} className={`${styles.mobileMenuBtn} ${isSidebarOpen ? styles.active : ''}`}>
                <span className={styles.hamburgerLine}></span>
                <span className={styles.hamburgerLine}></span>
                <span className={styles.hamburgerLine}></span>
            </button>
            <Link href="/" className={styles.logoLink}>
                v0plex
            </Link>
        </div>
        <div className={styles.rightSection}>
            <button
                aria-label={isRightSidebarOpen ? "Hide table of contents" : "Show table of contents"}
                title={isRightSidebarOpen ? "Hide table of contents" : "Show table of contents"}
                onClick={onToggleRightSidebar}
                className={styles.tocToggle}
            >
                {isRightSidebarOpen ? <RightPanelClose size={16}/> : <RightPanelOpen size={16}/>}
            </button>
            <button
                aria-label={theme === "white" ? strings.header.switchToDark : strings.header.switchToLight}
                title={theme === "white" ? strings.header.switchToDark : strings.header.switchToLight}
                onClick={toggleTheme}
                className={styles.themeToggle}
            >
                {theme === "white" ? <Asleep size={16}/> : <Light size={16}/>}
            </button>
            <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className={styles.gitLink}
            >
                <LogoGithub size={16}/>
            </a>
            <button
                aria-label={`${currentLang.nativeName} → ${nextLang.nativeName}`}
                title={`${currentLang.nativeName} → ${nextLang.nativeName}`}
                onClick={toggleLocale}
                className={styles.langToggle}
            >
                <Translate size={16}/>
                <span className={styles.langLabel}>{currentLang.nativeName}</span>
            </button>
        </div>
    </header>)
}