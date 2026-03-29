"use client"

import type React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import Link from "next/link"
import {usePathname} from "next/navigation"
import {Search, X} from "lucide-react"
import {ChevronDown, ChevronRight} from "@carbon/icons-react"
import {SITE_CONFIG, getStrings} from "@/config/site.config"
import {useLanguage} from "@/components/common/language-provider"
import styles from "./sidebar.module.css"

interface NavItem {
    title: string
    path?: string
    type?: 'folder' | 'page'
    locale?: string
    children?: NavItem[]
}

interface LexemePageRef {
    h: string;
    c: number;
}

interface LexemeWordData {
    t: number;
    df: number;
    dfr: number;
    H: number;
    p: LexemePageRef[];
}

interface LexemeStats {
    pageIndex: Record<string, { title: string; path: string }>;
    byWord: Record<string, LexemeWordData>;
    selectedWords: string[];
}

interface SiteData {
    navigation: NavItem[];
    images: any[];
    lexemeStats?: LexemeStats;
}

interface CarbonSidebarProps {
    isMobileOpen: boolean
    onCloseMobile: () => void
    width: number
    onResize: (width: number) => void
}

const loadSiteData = async (): Promise<SiteData | null> => {
    try {
        const response = await fetch('/vmdjson/site-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to load site data:', error);
        return null;
    }
};

function generateUniqueId(item: NavItem, parentId: string = ""): string {
    const baseId = item.path || item.title;
    return parentId ? `${parentId}/${baseId}` : baseId;
}

function isActivePage(pathname: string, item: NavItem): boolean {
    if (!item.path || (item.children && item.children.length > 0)) {
        return false
    }

    const normalizePath = (path: string) => {
        return path.replace(/\/$/, "") || "/"
    }

    const normalizedPathname = normalizePath(pathname)
    const normalizedItemPath = normalizePath(`${SITE_CONFIG.URL_PREFIX}${item.path}`)

    return normalizedPathname === normalizedItemPath
}

function hasActiveChild(pathname: string, item: NavItem): boolean {
    if (!item.children || item.children.length === 0) {
        return false
    }

    return item.children.some(child => isActivePage(pathname, child) || hasActiveChild(pathname, child))
}

function shouldExpand(pathname: string, item: NavItem, itemId: string, manuallyExpandedItems: Set<string>, manuallyCollapsedItems: Set<string>): boolean {
    if (!item.children || item.children.length === 0) {
        return false
    }

    if (manuallyCollapsedItems.has(itemId)) {
        return false
    }

    if (manuallyExpandedItems.has(itemId)) {
        return true
    }

    return hasActiveChild(pathname, item)
}

// Filter navigation tree to only include items for the specified locale
function filterNavigationByLocale(nodes: NavItem[], locale: string): NavItem[] {
    const result: NavItem[] = [];
    
    for (const node of nodes) {
        // If this node has a different locale, skip it
        if (node.locale && node.locale !== locale) {
            continue;
        }
        
        // Recursively filter children
        const filteredChildren = node.children
            ? filterNavigationByLocale(node.children, locale)
            : undefined;
        
        result.push({
            ...node,
            children: filteredChildren
        });
    }
    
    return result;
}

export default function Sidebar({isMobileOpen, onCloseMobile, width, onResize}: CarbonSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [manuallyExpandedItems, setManuallyExpandedItems] = useState<Set<string>>(new Set())
    const [manuallyCollapsedItems, setManuallyCollapsedItems] = useState<Set<string>>(new Set())
    const [isResizing, setIsResizing] = useState(false)
    const [navStructure, setNavStructure] = useState<NavItem[]>([])
    const [siteData, setSiteData] = useState<SiteData | null>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const { locale, strings } = useLanguage()

    useEffect(() => {
        loadSiteData().then(data => {
            if (data) {
                setSiteData(data);
                // Filter navigation by current locale
                const filteredNav = filterNavigationByLocale(data.navigation || [], locale);
                setNavStructure(filteredNav);
            }
        });
    }, [locale]);

    useEffect(() => {
        setManuallyCollapsedItems(prev => {
            const newSet = new Set(prev)

            const clearCollapsedForActiveParents = (items: NavItem[], parentId: string = "") => {
                for (const item of items) {
                    const itemId = generateUniqueId(item, parentId);
                    if (item.children && hasActiveChild(pathname, item)) {
                        newSet.delete(itemId)
                    }
                    if (item.children) {
                        clearCollapsedForActiveParents(item.children, itemId)
                    }
                }
            }

            clearCollapsedForActiveParents(navStructure)
            return newSet
        })
    }, [pathname, navStructure])

    const normalizedQuery = searchQuery.trim().toLowerCase()

    interface SearchResult {
        title: string;
        path?: string;
        hits?: number;
    }

    const searchResults: SearchResult[] = [];

    // Build a set of valid page paths for current locale from navStructure
    const validPathsForLocale = new Set<string>();
    const collectPaths = (nodes: NavItem[]) => {
        for (const node of nodes) {
            if (node.path) {
                validPathsForLocale.add(node.path);
            }
            if (node.children) {
                collectPaths(node.children);
            }
        }
    };
    collectPaths(navStructure);

    // Only search lexeme words, ignoring standard title match
    if (normalizedQuery) {
        if (siteData?.lexemeStats?.byWord && siteData?.lexemeStats?.pageIndex) {
            const matchedWords = Object.keys(siteData.lexemeStats.byWord).filter(w => w.toLowerCase().includes(normalizedQuery));

            const pageHits: Record<string, number> = {};
            for (const word of matchedWords) {
                const wordData = siteData.lexemeStats.byWord[word];
                if (wordData && wordData.p) {
                    for (const pageRef of wordData.p) {
                        pageHits[pageRef.h] = (pageHits[pageRef.h] || 0) + pageRef.c;
                    }
                }
            }

            for (const [hash, hits] of Object.entries(pageHits)) {
                const pageMeta = siteData.lexemeStats.pageIndex[hash];
                // Only include results for pages in current locale
                if (pageMeta && validPathsForLocale.has(pageMeta.path)) {
                    searchResults.push({
                        title: pageMeta.title,
                        path: pageMeta.path,
                        hits: hits
                    });
                }
            }

            // Sort by hits (highest first)
            searchResults.sort((a, b) => (b.hits || 0) - (a.hits || 0));
        }
    }

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(600, e.clientX))
            onResize(newWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }, [onResize])

    const toggleExpanded = (itemId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!itemId) return;

        setManuallyExpandedItems(prevExpanded => {
            const newExpanded = new Set(prevExpanded);

            if (newExpanded.has(itemId)) {
                newExpanded.delete(itemId);
            } else {
                newExpanded.add(itemId);
            }

            setManuallyCollapsedItems(prev => {
                const newCollapsed = new Set(prev);
                if (newExpanded.has(itemId)) {
                    newCollapsed.delete(itemId);
                } else {
                    newCollapsed.add(itemId);
                }
                return newCollapsed;
            });

            return newExpanded;
        });
    };

    const clearSearch = () => {
        setSearchQuery("")
    }

    const handleItemClick = (item: NavItem, itemId: string, e: React.MouseEvent) => {
        const hasChildren = item.children && item.children.length > 0

        if (hasChildren) {
            toggleExpanded(itemId, e)
        } else if (item.path) {
            onCloseMobile()
        } else {
            e.preventDefault()
        }
    }

    const renderNavItem = (item: NavItem, level = 0, parentId: string = "") => {
        const itemId = generateUniqueId(item, parentId);
        const isActive = isActivePage(pathname, item)
        const isExpanded = shouldExpand(pathname, item, itemId, manuallyExpandedItems, manuallyCollapsedItems)
        const hasChildren = item.children && item.children.length > 0
        const paddingLeft = `${0.75 + level}rem`

        return (<div key={itemId}>
            <div
                className={`${styles.navItem} ${isActive ? styles.active : ""} ${hasChildren ? styles.hasChildren : ""}`}
                style={{paddingLeft}}
            >
                {hasChildren ? (<button
                    className={styles.navItemButton}
                    onClick={(e) => handleItemClick(item, itemId, e)}
                    aria-label={isExpanded ? strings.sidebar.collapse : strings.sidebar.expand}
                >
                    <span className={styles.navItemText}>{item.title}</span>
                    <span className={styles.navItemChevron}>
                {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
              </span>
                </button>) : item.path ? (
                    <Link href={`${SITE_CONFIG.URL_PREFIX}${item.path}`} className={styles.navItemLink} onClick={onCloseMobile}>
                        <span className={styles.navItemText}>{item.title}</span>
                    </Link>) : (<span className={styles.navItemText}>{item.title}</span>)}
            </div>
            {hasChildren && isExpanded && (<div>
                {item.children?.map((child) => renderNavItem(child, level + 1, itemId))}
            </div>)}
        </div>)
    }

    return (<>
        <div
            ref={sidebarRef}
            className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ""}`}
            style={{width: `${width}px`}}
        >
            <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon}/>
                    <input
                        type="text"
                        placeholder={strings.sidebar.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (<button onClick={clearSearch} className={styles.searchClearButton}
                                             aria-label={strings.sidebar.clearSearch}>
                        <X size={12}/>
                    </button>)}
                </div>
            </div>

            <div className={styles.navigationContent}>
                {searchQuery ? (<div className={styles.searchResults}>
                    <div className={styles.searchResultsHeader}>{strings.sidebar.searchResults}({searchResults.length})</div>
                    <div className={styles.searchResultsList}>
                        {searchResults.length > 0 ? (searchResults.map((item) => (<div
                            key={item.path || item.title}
                            className={`${styles.searchResultItem} ${item.path && isActivePage(pathname, { title: item.title, path: item.path }) ? styles.active : ""}`}
                        >
                            {item.path ? (
                                <Link href={`${SITE_CONFIG.URL_PREFIX}${item.path}`} className={styles.searchResultLink}
                                      onClick={onCloseMobile}>
                                    <div className={styles.searchResultTitle}>
                                        {item.title}
                                        {item.hits ? (
                                            <span style={{marginLeft: '8px', fontSize: '0.65rem', color: 'var(--v0plex-text-secondary)'}}>
                                                ({item.hits} {strings.sidebar.hits})
                                            </span>
                                        ) : null}
                                    </div>
                                </Link>) : (
                                <div className={styles.searchResultTitle}>{item.title}</div>)}
                        </div>))) : (<div className={styles.noResults}>{strings.sidebar.noResults}</div>)}
                    </div>
                </div>) : null}

                <div className={styles.directoryStructure}>
                    <div className={styles.allArticlesHeader}>{strings.sidebar.allPosts || 'All Posts'}</div>
                    <div className={styles.directoryStructureContent}>
                        {navStructure.map((item) => renderNavItem(item))}
                    </div>
                </div>
            </div>

            <div className={`${styles.resizeHandle} ${isResizing ? styles.resizing : ""}`}
                 onMouseDown={handleMouseDown}/>
        </div>

        {isMobileOpen && (<div className={`${styles.mobileOverlay} ${isMobileOpen ? styles.show : ""}`}
                               onClick={onCloseMobile}/>)}
    </>)
}