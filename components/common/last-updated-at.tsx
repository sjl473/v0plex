import {CalendarAdd, UpdateNow, User} from "@carbon/icons-react"
import {useLanguage} from "./language-provider"
import styles from "./last-updated-at.module.css"

interface PageDatesProps {
    publishedAt: string
    updatedAt: string
    author?: string
}

export default function PageDates({publishedAt, updatedAt, author}: PageDatesProps) {
    const {strings} = useLanguage()
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
                {author && (
                    <>
                        <div className={styles.divider}/>
                        <div className={styles.metadataItem}>
                            <User size={14} className={styles.icon}/>
                            <span className={styles.label}>{strings.pageMeta.author}</span>
                            <span className={styles.date}>{author}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
