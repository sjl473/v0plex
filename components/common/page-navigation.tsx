"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { SITE_CONFIG, getStrings } from "@/config/site.config"
import { useLanguage } from "@/components/common/language-provider"
import styles from "./page-navigation.module.css"

// Content max width - should match .page-typography-content max-width
const CONTENT_MAX_WIDTH = 800;

interface SiteNode {
  title: string;
  type: 'folder' | 'page';
  path: string;
  hash: string;
  locale?: string;
  children: SiteNode[];
}

interface SiteData {
  navigation: SiteNode[];
  images: any[];
}

// Filter and flatten pages by locale
const flattenPagesByLocale = (nodes: SiteNode[], locale: string): SiteNode[] => {
  let pages: SiteNode[] = [];
  for (const node of nodes) {
    if (node.type === 'page' && node.locale === locale) {
      pages.push(node);
    }
    if (node.children && node.children.length > 0) {
      pages = pages.concat(flattenPagesByLocale(node.children, locale));
    }
  }
  return pages;
};

const normalizePath = (path: string) => {
  return path.replace(/\/$/, "") || "/"
}

const truncateTitle = (title: string, maxLength: number = 30) => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

export default function PageNavigation() {
  const pathname = usePathname()
  const normalizedPath = normalizePath(pathname)
  const [pages, setPages] = useState<SiteNode[]>([])
  const { strings, locale } = useLanguage()
  const navRef = useRef<HTMLDivElement>(null)

  // Set CSS variable for max-width on both navigation divs
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (navRef.current) {
        navRef.current.style.setProperty('--page-nav-max-width', `${CONTENT_MAX_WIDTH}px`)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetch('/vmdjson/site-data.json')
      .then(response => response.json())
      .then((data: SiteData) => {
        // Flatten navigation to pages for current locale only
        const flatPages = flattenPagesByLocale(data.navigation, locale);
        setPages(flatPages)
      })
      .catch(() => {
        setPages([])
      })
  }, [locale])

  if (pages.length === 0) {
    return (
      <div ref={navRef} className={styles.navigation}>
        <div className={styles.navContainer}>
          <div className={`${styles.navLink} ${styles.disabled}`}>
            <div className={styles.navLabel}>{strings.pageNav.previousPage}</div>
            <div className={styles.navTitle}>...</div>
          </div>
          <div className={`${styles.navLink} ${styles.disabled}`}>
            <div className={styles.navLabel}>{strings.pageNav.nextPage}</div>
            <div className={styles.navTitle}>...</div>
          </div>
        </div>
      </div>
    )
  }

  const isRoot = normalizedPath === '/' || normalizedPath === '';

  let currentIndex = -1;

  if (!isRoot) {
    currentIndex = pages.findIndex(page => {
      return normalizedPath.endsWith(page.path);
    })
  }

  let prevPage: SiteNode | null = null;
  let nextPage: SiteNode | null = null;

  const homePage: SiteNode = {
    title: strings.pageNav.home,
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
    return `${SITE_CONFIG.URL_PREFIX}${page.path}`;
  };

  const prevTitle = prevPage ? prevPage.title : strings.pageNav.none
  const nextTitle = nextPage ? nextPage.title : strings.pageNav.none

  const truncatedPrevTitle = truncateTitle(prevTitle);
  const truncatedNextTitle = truncateTitle(nextTitle);

  return (
    <div ref={navRef} className={styles.navigation}>
      <div className={styles.navContainer}>
        {prevPage ? (
          <Link href={getNavHref(prevPage)} className={styles.navLink} title={prevTitle}>
            <div className={styles.navLabel}>{strings.pageNav.previousPage}</div>
            <div className={styles.navTitle}>{truncatedPrevTitle}</div>
          </Link>
        ) : (
          <div className={`${styles.navLink} ${styles.disabled}`}>
            <div className={styles.navLabel}>{strings.pageNav.previousPage}</div>
            <div className={styles.navTitle}>{strings.pageNav.none}</div>
          </div>
        )}

        {nextPage ? (
          <Link href={getNavHref(nextPage)} className={`${styles.navLink} ${styles.nextLink}`} title={nextTitle}>
            <div className={styles.navLabel}>{strings.pageNav.nextPage}</div>
            <div className={styles.navTitle}>{truncatedNextTitle}</div>
          </Link>
        ) : (
          <div className={`${styles.navLink} ${styles.disabled}`}>
            <div className={styles.navLabel}>{strings.pageNav.nextPage}</div>
            <div className={styles.navTitle}>{strings.pageNav.none}</div>
          </div>
        )}
      </div>
    </div>
  )
}
