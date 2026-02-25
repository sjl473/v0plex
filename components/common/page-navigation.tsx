"use client"
import {usePathname} from "next/navigation"
import Link from "next/link"
import {useEffect, useState} from "react"
import styles from "./page-navigation.module.css"

interface SiteNode {
    title: string;
    type: 'folder' | 'page';
    path: string;
    hash: string;
    children: SiteNode[];
}

interface SiteData {
    navigation: SiteNode[];
    images: any[];
}

const normalizePath = (path: string) => {
    return path.replace(/\/$/, "") || "/"
}

const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
};

const flattenPages = (nodes: SiteNode[]): SiteNode[] => {
    let pages: SiteNode[] = [];
    for (const node of nodes) {
        if (node.type === 'page') {
            pages.push(node);
        }
        if (node.children && node.children.length > 0) {
            pages = pages.concat(flattenPages(node.children));
        }
    }
    return pages;
};

export default function PageNavigation() {
    const pathname = usePathname()
    const normalizedPath = normalizePath(pathname)
    const [pages, setPages] = useState<SiteNode[]>([])

    useEffect(() => {
        fetch('/vmdjson/site-data.json')
            .then(response => response.json())
            .then((data: SiteData) => {
                // Flatten the navigation tree to get a sequential list of pages
                const flatPages = flattenPages(data.navigation);

                setPages(flatPages)
            })
            .catch(error => {
                // console.error('Failed to load site data:', error)
                setPages([])
            })
    }, [])

    if (pages.length === 0) {
        return (<div className={styles.navigation}>
            <div className={styles.navContainer}>
                <div className={`${styles.navLink} ${styles.disabled}`}>
                    <div className={styles.navLabel}>Previous Page</div>
                    <div className={styles.navTitle}>Loading...</div>
                </div>
                <div className={`${styles.navLink} ${styles.disabled}`}>
                    <div className={styles.navLabel}>Next Page</div>
                    <div className={styles.navTitle}>Loading...</div>
                </div>
            </div>
        </div>)
    }

    const isRoot = normalizedPath === '/' || normalizedPath === '';
    
    let currentIndex = -1;
    
    if (isRoot) {
        currentIndex = -1; 
    } else {
        currentIndex = pages.findIndex(page => {
            return normalizedPath.endsWith(page.path);
        })
    }

    let prevPage: SiteNode | null = null;
    let nextPage: SiteNode | null = null;

    const homePage: SiteNode = {
        title: "Home",
        type: "page",
        path: "",
        hash: "",
        children: []
    };

    if (isRoot) {
        prevPage = null;
        nextPage = pages.length > 0 ? pages[0] : null;
    } else if (currentIndex >= 0) {
        prevPage = currentIndex === 0 ? homePage : (currentIndex > 0 ? pages[currentIndex - 1] : null);
        nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;
    }

    const getNavHref = (page: SiteNode | null) => {
        if (!page) return "#";
        if (!page.path) return "/";
        return `/out${page.path}`;
    };

    const prevTitle = prevPage ? prevPage.title : "None"
    const nextTitle = nextPage ? nextPage.title : "None"

    const truncatedPrevTitle = truncateTitle(prevTitle);
    const truncatedNextTitle = truncateTitle(nextTitle);

    return (<div className={styles.navigation}>
        <div className={styles.navContainer}>
            {prevPage ? (<Link href={getNavHref(prevPage)} className={styles.navLink} title={prevTitle}>
                <div className={styles.navLabel}>Previous Page</div>
                <div className={styles.navTitle}>{truncatedPrevTitle}</div>
            </Link>) : (<div className={`${styles.navLink} ${styles.disabled}`}>
                <div className={styles.navLabel}>Previous Page</div>
                <div className={styles.navTitle}>None</div>
            </div>)}

            {nextPage ? (<Link href={getNavHref(nextPage)} className={`${styles.navLink} ${styles.nextLink}`}
                               title={nextTitle}>
                <div className={styles.navLabel}>Next Page</div>
                <div className={styles.navTitle}>{truncatedNextTitle}</div>
            </Link>) : (<div className={`${styles.navLink} ${styles.disabled}`}>
                <div className={styles.navLabel}>Next Page</div>
                <div className={styles.navTitle}>None</div>
            </div>)}
        </div>
    </div>)
}