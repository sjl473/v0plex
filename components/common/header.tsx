"use client"

import type React from "react"
import Link from "next/link"
import {useTheme} from "./theme-provider"
import {useLanguage} from "./language-provider"
import {getLanguageConfig} from "@/config/site.config"
import {Asleep, Light, Menu, Translate, LogoGithub} from "@carbon/icons-react"
import styles from "./header.module.css"

interface CarbonHeaderProps {
    onToggleSidebar?: () => void
}

export default function Header({onToggleSidebar}: CarbonHeaderProps) {
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
                <a className={styles.gitLink}>
                    <LogoGithub size={20}/>
                </a>
                <button className={styles.langToggle}>
                    <Translate size={20}/>
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
                aria-label={theme === "white" ? strings.header.switchToDark : strings.header.switchToLight}
                title={theme === "white" ? strings.header.switchToDark : strings.header.switchToLight}
                onClick={toggleTheme}
                className={styles.themeToggle}
            >
                {theme === "white" ? <Asleep size={20}/> : <Light size={20}/>}
            </button>
            <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className={styles.gitLink}
            >
                <LogoGithub size={20}/>
            </a>
            <button
                aria-label={`${currentLang.nativeName} → ${nextLang.nativeName}`}
                title={`${currentLang.nativeName} → ${nextLang.nativeName}`}
                onClick={toggleLocale}
                className={styles.langToggle}
            >
                <Translate size={20}/>
                <span className={styles.langLabel}>{currentLang.nativeName}</span>
            </button>
        </div>
    </header>)
}