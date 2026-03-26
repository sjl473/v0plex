"use client"
import Link from "next/link"
import { getStrings, formatDate, interpolateString } from "@/config/site.config"
import styles from "./footer.module.css"

const strings = getStrings();
const dateStr = formatDate(new Date());

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

const buildTime = dateStr;

export default function Footer({
                                   linkGroups = [{
                                       links: [{name: "", url: "#"}, {name: "", url: "#"}]
                                   }, {
                                       links: [{name: "", url: "#"}, {name: "", url: "#"}]
                                   }],
                                   email = "@sjl473",
                                   emailAddress = "sjl473@outlook.com",
                                   version = strings.footer.version,
                                   lastUpdated = buildTime,
                                   copyright = strings.footer.copyright
                               }: FooterProps = {}) {
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