"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { Toggle } from "@carbon/react"
import styles from "./right-sidebar.module.css"

interface TocItem {
  id: string
  text: string
  tag: "h1" | "h2" | "h3"
}

function slugify(text: string): string {
  const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text)
  
  if (hasCJK) {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `heading-${Math.abs(hash).toString(36).substring(0, 8)}`
  }
  
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
  const [autoScroll, setAutoScroll] = useState(true)
  const rafRef = useRef<number | null>(null)
  const lastActiveIdRef = useRef<string>("")
  const contentRef = useRef<HTMLDivElement>(null)
  const sidebarRafRef = useRef<number | null>(null)
  const isSyncingRef = useRef(false)
  const autoScrollRef = useRef(true)
  const itemsRef = useRef<TocItem[]>([])

  // Keep refs in sync with state
  useEffect(() => {
    autoScrollRef.current = autoScroll
  }, [autoScroll])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Extract headings from page
  useEffect(() => {
    setItems([])
    setActiveId("")
    lastActiveIdRef.current = ""

    const timer = setTimeout(() => {
      const container = document.querySelector(".page-typography-content")
      if (!container) return

      const headings = Array.from(
        container.querySelectorAll<HTMLElement>("h1, h2, h3")
      )

      const usedIds = new Set<string>()
      
      const tocItems: TocItem[] = headings.map((el) => {
        const text = el.textContent?.trim() ?? ""
        let id = el.id
        
        if (!id || usedIds.has(id)) {
          id = slugify(text)
          let candidate = id
          let count = 1
          while (usedIds.has(candidate)) {
            candidate = `${id}-${count++}`
          }
          usedIds.add(candidate)
          el.id = candidate
          id = candidate
        } else {
          usedIds.add(id)
        }
        return { id, text, tag: el.tagName.toLowerCase() as "h1" | "h2" | "h3" }
      })

      setItems(tocItems)
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [pathname])

  // Main page scroll handler (updates active TOC item)
  useEffect(() => {
    if (items.length === 0) return

    const headingIds = items.map((t) => t.id)

    const handleScroll = () => {
      if (!autoScrollRef.current || isSyncingRef.current) return
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const offset = 150

        let newActiveId = ""
        
        for (let i = 0; i < headingIds.length; i++) {
          const id = headingIds[i]
          const el = document.getElementById(id)
          if (!el) continue
          
          const rect = el.getBoundingClientRect()
          const elementTop = rect.top + scrollY
          
          if (elementTop <= scrollY + offset) {
            newActiveId = id
          }
        }

        if (newActiveId && newActiveId !== lastActiveIdRef.current) {
          lastActiveIdRef.current = newActiveId
          setActiveId(newActiveId)
        }
      })
    }

    handleScroll()
    
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [items])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      setActiveId(id)
      lastActiveIdRef.current = id
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Sidebar scroll handler - using callback ref pattern
  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      contentRef.current = node
      
      // Setup scroll handler when ref is set
      const syncMainContent = () => {
        if (!autoScrollRef.current) return

        const currentItems = itemsRef.current
        if (currentItems.length === 0) return

        const tocButtons = node.querySelectorAll<HTMLElement>('button[data-toc-index]')
        if (tocButtons.length === 0) return

        const sidebarRect = node.getBoundingClientRect()
        const viewportCenter = sidebarRect.top + sidebarRect.height / 2

        let closestIndex = 0
        let closestDistance = Infinity
        
        for (let i = 0; i < tocButtons.length; i++) {
          const btn = tocButtons[i]
          const rect = btn.getBoundingClientRect()
          const btnCenter = rect.top + rect.height / 2
          const distance = Math.abs(btnCenter - viewportCenter)
          
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = i
          }
        }

        const closestButton = tocButtons[closestIndex]
        const itemId = closestButton?.getAttribute('data-toc-id')
        
        if (itemId) {
          const targetEl = document.getElementById(itemId)
          if (targetEl) {
            isSyncingRef.current = true
            lastActiveIdRef.current = itemId
            setActiveId(itemId)
            targetEl.scrollIntoView({ behavior: "auto", block: "start" })
            
            setTimeout(() => {
              isSyncingRef.current = false
            }, 50)
          }
        }
      }

      const handleSidebarScroll = () => {
        if (!autoScrollRef.current) return
        
        if (sidebarRafRef.current) {
          cancelAnimationFrame(sidebarRafRef.current)
        }
        sidebarRafRef.current = requestAnimationFrame(syncMainContent)
      }

      node.addEventListener("scroll", handleSidebarScroll, { passive: true })
    }
  }, [])

  return (
    <aside className={styles.sidebar} aria-label="Table of contents">
      <div className={styles.tocHeaderRow}>
        <span className={styles.tocHeaderLabel}>On this page</span>
        <Toggle
          id="toc-autoscroll-toggle"
          size="sm"
          toggled={autoScroll}
          onToggle={(checked: boolean) => setAutoScroll(checked)}
          labelA=""
          labelB=""
          hideLabel
          className={styles.autoScrollToggle}
        />
      </div>
      <div ref={setContentRef} className={styles.content}>
        <nav className={styles.tocNav}>
          {items.length === 0 && (
            <span className={styles.tocEmpty}>No headings found</span>
          )}
          {items.map((item, index) => (
            <button
              key={item.id}
              data-toc-index={index}
              data-toc-id={item.id}
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
