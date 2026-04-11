import {CalendarAdd, UpdateNow, Email, Link} from "@carbon/icons-react"
import {useLanguage} from "./language-provider"
import styles from "./last-updated-at.module.css"

interface PageDatesProps {
    publishedAt: string
    updatedAt: string
    author?: string
}

interface AuthorInfo {
    name: string
    email?: string
    url?: string
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map(w => w[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("")
}

// Deterministic hue from name string
function nameToHue(name: string): number {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return Math.abs(hash) % 360
}

// Parse author string with flexible ordering
// Supports: "Name", "Name->email", "Name->url", "Name->email->url", "Name->url->email"
function parseAuthor(authorEntry: string): AuthorInfo {
    const parts = authorEntry.split('->').map(p => p.trim())
    
    if (parts.length >= 2) {
        const name = parts[0]
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const urlRegex = /^https?:\/\/.+/
        
        let email: string | undefined
        let url: string | undefined
        
        // Check remaining parts for email or URL
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i]
            if (emailRegex.test(part)) {
                email = part
            } else if (urlRegex.test(part)) {
                url = part
            }
        }
        
        return {name, email, url}
    }
    
    return {name: authorEntry.trim()}
}

// Single icon button component
function IconButton({href, icon: Icon, title}: {href: string; icon: typeof Email; title: string}) {
    const isExternal = href.startsWith('http')
    return (
        <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={styles.iconButton}
            title={title}
        >
            <Icon size={8} />
        </a>
    )
}

export default function PageDates({publishedAt, updatedAt, author}: PageDatesProps) {
    const {strings} = useLanguage()
    const maintainers: AuthorInfo[] = author
        ? author.split("|").map(a => a.trim()).filter(Boolean).map(parseAuthor)
        : []

    return (
        <div className={styles.metadataContainer}>
            <div className={styles.metadataRow}>
                <div className={styles.metadataItem}>
                    <CalendarAdd size={14} className={styles.icon}/>
                    <span className={styles.label}>{strings.pageMeta.created}</span>
                    <span className={styles.date}>{publishedAt}</span>
                </div>
                <div className={styles.divider}/>
                <div className={styles.metadataItem}>
                    <UpdateNow size={14} className={styles.icon}/>
                    <span className={styles.label}>{strings.pageMeta.updated}</span>
                    <span className={styles.date}>{updatedAt}</span>
                </div>
            </div>
            {maintainers.length > 0 && (
                <div className={styles.maintainersRow}>
                    <span className={styles.maintainersLabel}>{strings.pageMeta.author}</span>
                    <div className={styles.avatarList}>
                        {maintainers.map((authorInfo, index) => {
                            const hue = nameToHue(authorInfo.name)
                            const displayName = authorInfo.name
                            const key = `${authorInfo.name}-${index}`
                            
                            // Build tooltip
                            let tooltip = displayName
                            if (authorInfo.email && authorInfo.url) {
                                tooltip = `${displayName} (${authorInfo.email}, ${authorInfo.url})`
                            } else if (authorInfo.email) {
                                tooltip = `${displayName} (${authorInfo.email})`
                            } else if (authorInfo.url) {
                                tooltip = `${displayName} (${authorInfo.url})`
                            }
                            
                            return (
                                <div key={key} className={styles.authorChip} title={tooltip}>
                                    <span
                                        className={styles.avatarInitials}
                                        style={{background: `hsl(${hue},45%,38%)`}}
                                    >
                                        {getInitials(authorInfo.name)}
                                    </span>
                                    <span className={styles.avatarName}>{displayName}</span>
                                    {(authorInfo.email || authorInfo.url) && (
                                        <div className={styles.iconButtonGroup}>
                                            {authorInfo.email && (
                                                <IconButton
                                                    href={`mailto:${authorInfo.email}`}
                                                    icon={Email}
                                                    title={`Email ${displayName}: ${authorInfo.email}`}
                                                />
                                            )}
                                            {authorInfo.url && (
                                                <IconButton
                                                    href={authorInfo.url}
                                                    icon={Link}
                                                    title={`Visit ${displayName}: ${authorInfo.url}`}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
