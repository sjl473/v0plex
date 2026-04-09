"use client"
import React, { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/common/language-provider"
import styles from "./right-sidebar.module.css"

interface TocItem {
  id: string
  text: string
  tag: "h1" | "h2" | "h3"
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function RightSidebar() {
  const pathname = usePathname()
  const { strings } = useLanguage()
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [autoScroll, setAutoScroll] = useState<boolean>(true)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const setItemRef = (id: string, el: HTMLButtonElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  // Re-scan headings on every route change
  useEffect(() => {
    setItems([])
    setActiveId("")
    itemRefs.current.clear()
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const timer = setTimeout(() => {
      const container = document.querySelector(".page-typography-content")
      if (!container) return

      const headings = Array.from(
        container.querySelectorAll<HTMLElement>("h1, h2, h3")
      )

      const seenIds = new Map<string, number>()
      const tocItems: TocItem[] = headings.map((el, index) => {
        const text = el.textContent?.trim() ?? ""
        const base = slugify(text) || `heading-${index}`
        const count = seenIds.get(base) ?? 0
        seenIds.set(base, count + 1)
        const id = count === 0 ? base : `${base}-${count}`
        el.id = id
        return { id, text, tag: el.tagName.toLowerCase() as "h1" | "h2" | "h3" }
      })

      setItems(tocItems)

      const headingIds = tocItems.map((t) => t.id)
      const visibleSet = new Set<string>()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visibleSet.add(entry.target.id)
            else visibleSet.delete(entry.target.id)
          })
          const first = headingIds.find((id) => visibleSet.has(id))
          if (first) setActiveId(first)
        },
        { rootMargin: "0px 0px -70% 0px", threshold: 0 }
      )

      headings.forEach((el) => observerRef.current!.observe(el))
    }, 100)

    return () => {
      clearTimeout(timer)
      observerRef.current?.disconnect()
    }
  }, [pathname])

  // Scroll the TOC panel to keep the active item visible
  useEffect(() => {
    if (!autoScroll || !activeId || !contentRef.current) return
    const activeBtn = itemRefs.current.get(activeId)
    if (!activeBtn) return

    const scrollEl = contentRef.current
    const elTop = activeBtn.offsetTop
    const elHeight = activeBtn.offsetHeight
    const panelHeight = scrollEl.clientHeight
    const targetTop = elTop - panelHeight / 2 + elHeight / 2
    scrollEl.scrollTo({ top: targetTop, behavior: "smooth" })
  }, [activeId, autoScroll])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <aside className={styles.sidebar} aria-label="Table of contents">
      <div className={styles.tocHeaderRow}>
        <span className={styles.tocHeaderLabel}>{strings.sidebar.catalog}</span>
        <button
          className={`${styles.autoScrollBtn} ${autoScroll ? styles.autoScrollOn : ""}`}
          onClick={() => setAutoScroll((v) => !v)}
          title={autoScroll ? "Auto-scroll: ON" : "Auto-scroll: OFF"}
          aria-pressed={autoScroll}
        >
          {autoScroll ? "↕ ON" : "↕ OFF"}
        </button>
      </div>
      <div className={styles.content} ref={contentRef}>
        <nav className={styles.tocNav}>
          {items.length === 0 && (
            <span className={styles.tocEmpty}>No headings found</span>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              ref={(el) => setItemRef(item.id, el)}
              className={`${styles.tocItem} ${activeId === item.id ? styles.tocActive : ""}`}
              onClick={() => handleClick(item.id)}
              title={item.text}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
