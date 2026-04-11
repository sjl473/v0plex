"use client"
import { useEffect, useRef } from "react"
import { formatDate, interpolateString } from "@/config/site.config"
import { useLanguage } from "./language-provider"
import styles from "./footer.module.css"

interface FooterProps {
    version?: string;
    lastUpdated?: string;
    copyright?: string;
}

export default function Footer({
    version: versionProp,
    lastUpdated: lastUpdatedProp,
    copyright: copyrightProp
}: FooterProps = {}) {
    const {strings, locale} = useLanguage()
    const footerRef = useRef<HTMLElement>(null)
    
    const siteName = strings.footer.siteName
    const version = versionProp || strings.footer.version
    const copyright = copyrightProp || strings.footer.copyright
    const copyrightSymbol = strings.footer.copyrightSymbol
    const dateStr = formatDate(new Date(), locale)
    const lastUpdated = lastUpdatedProp || dateStr

    // Debug: log left offset
    useEffect(() => {
        if (footerRef.current) {
            const rect = footerRef.current.getBoundingClientRect();
            console.log('[Footer] Left offset:', rect.left);
        }
    }, [])

    return (
        <footer ref={footerRef} className={styles.footer}>
            {/* Full-width divider */}
            <div className={styles.dividerFull} />
            
            <div className={styles.main}>
                <div className={styles.container}>
                    {/* Logo: left side */}
                    <div className={styles.logo}>{siteName}</div>

                    {/* Everything else: right side, stacked */}
                    <div className={styles.rightContent}>
                        {/* Version */}
                        <div className={styles.metaRow}>
                            <span className={styles.metaItem}>
                                {strings.footer.versionLabel} {version}
                            </span>
                        </div>

                        {/* Last updated */}
                        <div className={styles.metaRow}>
                            <span className={styles.metaItem}>
                                {interpolateString(strings.footer.lastUpdated, { date: lastUpdated })}
                            </span>
                        </div>

                        {/* Copyright */}
                        <div className={styles.metaRow}>
                            <span className={styles.copyright}>
                                {copyrightSymbol} {copyright}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
