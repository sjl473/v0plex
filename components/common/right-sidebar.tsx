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
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { strings } = useLanguage()

  useEffect(() => {
    setItems([])
    setActiveId("")
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    // Defer scan to allow Next.js to finish rendering new page content
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
            if (entry.isIntersecting) {
              visibleSet.add(entry.target.id)
            } else {
              visibleSet.delete(entry.target.id)
            }
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

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <aside className={styles.sidebar} aria-label="Table of contents">
      <div className={styles.content}>
        <div className={styles.tocHeader}>{strings.sidebar.catalog}</div>
        <nav className={styles.tocNav}>
          {items.length === 0 && (
            <span className={styles.tocEmpty}>No headings found</span>
          )}
          {items.map((item) => (
            <button
              key={item.id}
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
