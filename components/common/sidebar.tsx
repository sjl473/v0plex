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
    h: string;       // page hash
    c: number;       // raw count
    s?: number;      // TF-IDF score (scaled by 10000)
    t?: number;      // title match flag (1 if in title, 0 otherwise)
}

interface LexemeWordData {
    t: number;       // total count
    df: number;      // document frequency
    dfr: number;     // document frequency ratio
    H: number;       // Shannon entropy
    idf?: number;    // IDF value
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
        hits?: number;         // Raw occurrence count for display
        score?: number;        // Internal TF-IDF score for sorting
        fromTitle?: boolean;   // Match found in title
        exactMatch?: boolean;  // Query exactly matches word/title
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

    // Search both lexeme words and page titles with TF-IDF scoring
    if (normalizedQuery) {
        interface PageHitData {
            title: string;
            score: number;      // TF-IDF based score (scaled)
            rawHits: number;    // Raw occurrence count for display
            fromTitle: boolean;
            exactMatch: boolean; // Query exactly matches a word
        }
        const pageHits: Record<string, PageHitData> = {};

        // Helper: calculate word match relevance
        // - Exact match: 1.0
        // - Prefix match: 0.8
        // - Contains match: 0.5
        const getMatchRelevance = (word: string, query: string): number => {
            const w = word.toLowerCase();
            const q = query.toLowerCase();
            if (w === q) return 1.0;
            if (w.startsWith(q)) return 0.8;
            if (w.includes(q)) return 0.5;
            return 0.3;
        };

        // 1. Search lexeme words (content search with TF-IDF weights)
        if (siteData?.lexemeStats?.byWord && siteData?.lexemeStats?.pageIndex) {
            const matchedWords = Object.keys(siteData.lexemeStats.byWord).filter(w => w.toLowerCase().includes(normalizedQuery));

            for (const word of matchedWords) {
                const wordData = siteData.lexemeStats.byWord[word];
                if (wordData && wordData.p) {
                    // Calculate how relevant this word match is
                    const matchRelevance = getMatchRelevance(word, normalizedQuery);
                    
                    for (const pageRef of wordData.p) {
                        const pageMeta = siteData.lexemeStats.pageIndex[pageRef.h];
                        if (pageMeta && validPathsForLocale.has(pageMeta.path)) {
                            if (!pageHits[pageMeta.path]) {
                                pageHits[pageMeta.path] = {
                                    title: pageMeta.title,
                                    score: 0,
                                    rawHits: 0,
                                    fromTitle: false,
                                    exactMatch: false
                                };
                            }
                            
                            // Use TF-IDF score if available (version 4+), otherwise fall back to count
                            const tfidfScore = pageRef.s ?? (pageRef.c * 100); // Scale legacy count
                            
                            // Apply match relevance to the score
                            const weightedScore = tfidfScore * matchRelevance;
                            
                            pageHits[pageMeta.path].score += weightedScore;
                            pageHits[pageMeta.path].rawHits += pageRef.c;
                            
                            // Track if this is an exact word match
                            if (matchRelevance === 1.0) {
                                pageHits[pageMeta.path].exactMatch = true;
                            }
                            
                            // Check if word is in title (use pre-calculated flag if available)
                            if (pageRef.t === 1) {
                                pageHits[pageMeta.path].fromTitle = true;
                            }
                        }
                    }
                }
            }
        }

        // 2. Search page titles directly (high priority)
        const searchInNav = (nodes: NavItem[]) => {
            for (const node of nodes) {
                if (node.path && node.title.toLowerCase().includes(normalizedQuery)) {
                    if (!pageHits[node.path]) {
                        pageHits[node.path] = {
                            title: node.title,
                            score: 0,
                            rawHits: 0,
                            fromTitle: true,
                            exactMatch: false
                        };
                    }
                    
                    // Calculate title match relevance
                    const titleMatchRelevance = getMatchRelevance(node.title, normalizedQuery);
                    
                    // Title matches get significant boost (equivalent to high TF-IDF)
                    // Scale: 50000 = roughly equivalent to a word with IDF=5 appearing prominently
                    const titleBoost = 50000 * titleMatchRelevance;
                    pageHits[node.path].score += titleBoost;
                    pageHits[node.path].fromTitle = true;
                    
                    // For title-only matches, show at least 1 hit for display
                    // This makes sense because the query was found in the title
                    if (pageHits[node.path].rawHits === 0) {
                        pageHits[node.path].rawHits = 1;
                    }
                    
                    // Mark exact title matches
                    if (node.title.toLowerCase() === normalizedQuery) {
                        pageHits[node.path].exactMatch = true;
                    }
                }
                if (node.children) {
                    searchInNav(node.children);
                }
            }
        };
        searchInNav(navStructure);

        // Convert to results array
        for (const [path, data] of Object.entries(pageHits)) {
            searchResults.push({
                title: data.title,
                path: path,
                hits: data.rawHits, // Use raw occurrence count for display
                score: data.score,  // Use TF-IDF score for sorting only
                fromTitle: data.fromTitle,
                exactMatch: data.exactMatch
            });
        }

        // Sort by score (highest first), with exact matches prioritized
        searchResults.sort((a, b) => {
            // Exact matches first
            if (a.exactMatch && !b.exactMatch) return -1;
            if (!a.exactMatch && b.exactMatch) return 1;
            // Then by score
            return (b.score || 0) - (a.score || 0);
        });
    }

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Disable resize completely - sidebar width is fixed on all devices
        return
    }, [])

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
        const paddingLeft = `${0.3 + (level * 0.1)}rem`

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
                    <Search size={10} className={styles.searchIcon} strokeWidth={1.5}/>
                    <input
                        type="text"
                        placeholder={strings.sidebar.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (<button onClick={clearSearch} className={styles.searchClearButton}
                                             aria-label={strings.sidebar.clearSearch}>
                        <X size={10} strokeWidth={1.5}/>
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
                                            <span className={styles.searchHits}>
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