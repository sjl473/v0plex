"use client"
import Link from "next/link"
import { formatDate, interpolateString } from "@/config/site.config"
import { useLanguage } from "./language-provider"
import styles from "./footer.module.css"

interface FooterLink {
    name: string;
    url: string;
}

interface FooterLinkGroup {
    title?: string;
    links: FooterLink[];
}

interface FooterProps {
    linkGroups?: FooterLinkGroup[];
    email?: string;
    emailAddress?: string;
    version?: string;
    lastUpdated?: string;
    copyright?: string;
}

export default function Footer({
                                   linkGroups = [{
                                       links: [{name: "", url: "#"}, {name: "", url: "#"}]
                                   }, {
                                       links: [{name: "", url: "#"}, {name: "", url: "#"}]
                                   }],
                                   email = "@sjl473",
                                   emailAddress = "sjl473@outlook.com",
                                   version: versionProp,
                                   lastUpdated: lastUpdatedProp,
                                   copyright: copyrightProp
                               }: FooterProps = {}) {
    const {strings, locale} = useLanguage()
    const version = versionProp || strings.footer.version
    const copyright = copyrightProp || strings.footer.copyright
    const dateStr = formatDate(new Date(), locale)
    const lastUpdated = lastUpdatedProp || dateStr
    return (<footer className={styles.footer}>
        <div className={styles.main}>
            <div className={styles.container}>
                <div className={styles.leftSection}>
                    <div className={styles.logoSection}>
                     <p style={{fontWeight: 'bold'}}>v0plex</p>
                    </div>
                    <div className={styles.links}>
                        {linkGroups.map((group, index) => (<div className={styles.linkGroup} key={index}>
                            {group.links.map((link, linkIndex) => (<Link
                                key={linkIndex}
                                href={link.url}
                                className={styles.link}
                            >
                                {link.name}
                            </Link>))}
                        </div>))}
                    </div>
                </div>

                <div className={styles.info}>
                    <p className={styles.infoText}>
                        {strings.footer.contactText} {" "}
                        <Link href={`mailto:${emailAddress}`} className={styles.emailLink}>
                            {strings.footer.emailLabel}
                        </Link>
                    </p>
                    <div className={styles.meta}>
                        <span>{strings.footer.versionLabel}: {version}</span>
                        <span>{interpolateString(strings.footer.lastUpdated, { date: lastUpdated })}</span>
                        <span>© {copyright}</span>
                    </div>
                </div>
            </div>
        </div>
    </footer>)
}