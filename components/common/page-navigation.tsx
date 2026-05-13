"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import { SITE_CONFIG } from "@/config/site.config"
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

// Estimate text pixel width at 0.75rem (12px). CJK ≈ full width, ASCII ≈ 0.6 width.
function estimateWidth(text: string, fontSize = 12): number {
  let w = 0;
  for (const char of text) {
    w += /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char) ? fontSize : fontSize * 0.6;
  }
  return w;
}

// Truncate title so that (kept text + "...") fits into maxWidth.
// If text already fits, return as-is.
function truncateTitleByWidth(title: string, maxWidth: number): string {
  if (!maxWidth || maxWidth <= 0) return title;
  const ellipsisWidth = estimateWidth('...');
  if (estimateWidth(title) + ellipsisWidth <= maxWidth) return title;

  let low = 0;
  let high = title.length;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (estimateWidth(title.slice(0, mid)) + ellipsisWidth <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return title.slice(0, low) + '...';
}

// Compute available width for a single nav button.
// Each button is ~50vw. We subtract horizontal padding generously.
function getButtonAvailableWidth(): number {
  if (typeof window === 'undefined') return 200;
  const vw = window.innerWidth;
  // Each button is flex-basis 50%. Deduct padding (mobile: ~16px left + 8px right avg ≈ 30px).
  // Use a slightly conservative padding so we never overflow.
  const padding = vw <= 600 ? 36 : 60;
  return Math.max(40, vw / 2 - padding);
}

export default function PageNavigation() {
  const pathname = usePathname()
  const normalizedPath = normalizePath(pathname)
  const [pages, setPages] = useState<SiteNode[]>([])
  const { strings, locale } = useLanguage()
  const navRef = useRef<HTMLDivElement>(null)

  // Truncated titles driven by actual viewport width
  const [prevTruncated, setPrevTruncated] = useState<string>('')
  const [nextTruncated, setNextTruncated] = useState<string>('')

  // Set CSS variable for max-width on both navigation divs
  useEffect(() => {
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
        const flatPages = flattenPagesByLocale(data.navigation, locale);
        setPages(flatPages)
      })
      .catch(() => {
        setPages([])
      })
  }, [locale])

  const isRoot = normalizedPath === '/' || normalizedPath === '';

  let currentIndex = -1;
  if (!isRoot) {
    currentIndex = pages.findIndex(page => normalizedPath.endsWith(page.path))
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

  const prevTitleRaw = prevPage ? prevPage.title : strings.pageNav.none
  const nextTitleRaw = nextPage ? nextPage.title : strings.pageNav.none

  const recalcTruncation = useCallback(() => {
    const available = getButtonAvailableWidth();
    setPrevTruncated(truncateTitleByWidth(prevTitleRaw, available));
    setNextTruncated(truncateTitleByWidth(nextTitleRaw, available));
  }, [prevTitleRaw, nextTitleRaw]);

  useEffect(() => {
    recalcTruncation();
    window.addEventListener('resize', recalcTruncation);
    return () => window.removeEventListener('resize', recalcTruncation);
  }, [recalcTruncation]);

  return (
    <div ref={navRef} className={styles.navigation}>
      <div className={styles.navContainer}>
        {prevPage ? (
          <Link href={getNavHref(prevPage)} className={styles.navLink} title={prevTitleRaw}>
            <div className={styles.navLabel}>{strings.pageNav.previousPage}</div>
            <div className={styles.navTitle}>{prevTruncated}</div>
          </Link>
        ) : (
          <div className={`${styles.navLink} ${styles.disabled}`}>
            <div className={styles.navLabel}>{strings.pageNav.previousPage}</div>
            <div className={styles.navTitle}>{prevTruncated}</div>
          </div>
        )}

        {nextPage ? (
          <Link href={getNavHref(nextPage)} className={`${styles.navLink} ${styles.nextLink}`} title={nextTitleRaw}>
            <div className={styles.navLabel}>{strings.pageNav.nextPage}</div>
            <div className={styles.navTitle}>{nextTruncated}</div>
          </Link>
        ) : (
          <div className={`${styles.navLink} ${styles.disabled}`}>
            <div className={styles.navLabel}>{strings.pageNav.nextPage}</div>
            <div className={styles.navTitle}>{nextTruncated}</div>
          </div>
        )}
      </div>
    </div>
  )
}
