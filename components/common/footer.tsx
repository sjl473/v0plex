"use client"
import Link from "next/link"
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

const buildTime = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
});

export default function Footer({
                                   linkGroups = [{
                                       links: [{name: "", url: "#"}, {name: "", url: "#"}]
                                   }, {
                                       links: [{name: "", url: "#"}, {name: "", url: "#"}]
                                   }],
                                   email = "@sjl473",
                                   emailAddress = "sjl473@outlook.com",
                                   version = "preview test",
                                   lastUpdated = buildTime,
                                   copyright = "2026 sjl473, all rights reserved."
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
                        If you have any questions, please make contact {" "}
                        <Link href={`mailto:${emailAddress}`} className={styles.emailLink}>
                            {email}
                        </Link>
                    </p>
                    <div className={styles.meta}>
                        <span>Used version: {version}</span>
                        <span>Last updated at: {lastUpdated}</span>
                        <span>© {copyright}</span>
                    </div>
                </div>
            </div>
        </div>
    </footer>)
}