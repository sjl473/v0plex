"use client"

import type React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import Link from "next/link"
import {usePathname} from "next/navigation"
import {Search, X} from "lucide-react"
import {ChevronDown, ChevronRight} from "@carbon/icons-react"
import styles from "./sidebar.module.css"

interface NavItem {
    title: string
    path?: string
    type?: 'folder' | 'page'
    children?: NavItem[]
}

interface SiteData {
    navigation: NavItem[];
    images: any[];
}

interface CarbonSidebarProps {
    isMobileOpen: boolean
    onCloseMobile: () => void
    width: number
    onResize: (width: number) => void
}

const loadNavigationStructure = async (): Promise<NavItem[]> => {
    try {
        const response = await fetch('/vmdjson/site-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: SiteData = await response.json();
        return data.navigation || [];
    } catch (error) {
        console.error('Failed to load navigation structure:', error);
        return [];
    }
};

function generateUniqueId(item: NavItem, parentId: string = ""): string {
    const baseId = item.path || item.title;
    return parentId ? `${parentId}/${baseId}` : baseId;
}

function flattenNavigation(items: NavItem[]): NavItem[] {
    const result: NavItem[] = []

    function traverse(items: NavItem[]) {
        for (const item of items) {
            result.push(item)
            if (item.children) {
                traverse(item.children)
            }
        }
    }

    traverse(items)
    return result
}

function isActivePage(pathname: string, item: NavItem): boolean {
    if (!item.path || (item.children && item.children.length > 0)) {
        return false
    }

    const normalizePath = (path: string) => {
        return path.replace(/\/$/, "") || "/"
    }

    const normalizedPathname = normalizePath(pathname)
    const normalizedItemPath = normalizePath(`/out${item.path}`)

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

export default ({isMobileOpen, onCloseMobile, width, onResize}: CarbonSidebarProps) => {
    const [searchQuery, setSearchQuery] = useState("")
    const [manuallyExpandedItems, setManuallyExpandedItems] = useState<Set<string>>(new Set())
    const [manuallyCollapsedItems, setManuallyCollapsedItems] = useState<Set<string>>(new Set())
    const [isResizing, setIsResizing] = useState(false)
    const [navStructure, setNavStructure] = useState<NavItem[]>([])
    const sidebarRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    useEffect(() => {
        loadNavigationStructure().then(data => {
            setNavStructure(data);
        });
    }, []);

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

    const allItems = flattenNavigation(navStructure)
    const filteredItems = allItems.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || (item.path && item.path.toLowerCase().includes(searchQuery.toLowerCase())),)

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
    }, [onResize],)

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
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                    <span className={styles.navItemText}>{item.title}</span>
                    <span className={styles.navItemChevron}>
                {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
              </span>
                </button>) : item.path ? (
                    <Link href={`/out${item.path}`} className={styles.navItemLink} onClick={onCloseMobile}>
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
                        placeholder="Search Contents (Not Implted Yet)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (<button onClick={clearSearch} className={styles.searchClearButton}
                                             aria-label="Clear search">
                        <X size={12}/>
                    </button>)}
                </div>
            </div>

            <div className={styles.navigationContent}>
                {searchQuery ? (<div className={styles.searchResults}>
                    <div className={styles.searchResultsHeader}>搜索结果({filteredItems.length})</div>
                    <div className={styles.searchResultsList}>
                        {filteredItems.length > 0 ? (filteredItems.map((item) => (<div
                            key={item.path || item.title}
                            className={`${styles.searchResultItem} ${isActivePage(pathname, item) ? styles.active : ""}`}
                        >
                            {item.path ? (
                                <Link href={`/out${item.path}`} className={styles.searchResultLink}
                                      onClick={onCloseMobile}>
                                    <div className={styles.searchResultTitle}>{item.title}</div>
                                    <div className={styles.searchResultPath}>{item.path}</div>
                                </Link>) : (
                                <div className={styles.searchResultTitle}>{item.title}</div>)}
                        </div>))) : (<div className={styles.noResults}>暂无搜索结果</div>)}
                    </div>
                </div>) : null}

                <div className={styles.directoryStructure}>
                    <div className={styles.allArticlesHeader}>All Posts</div>
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