"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  AVAILABLE_LANGUAGES,
  SITE_CONFIG,
  isValidLocale,
  type Locale,
  type I18nStrings,
  getStrings,
} from "@/config/site.config"

interface PageLookupEntry {
  locale: string
  languageLinks?: Record<string, string>
  prefixId?: string
}

type LanguageContextType = {
  locale: Locale
  strings: I18nStrings
  availableLanguages: typeof AVAILABLE_LANGUAGES
  toggleLocale: () => void
  setLocale: (locale: Locale) => void
  mounted: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function buildPageLookup(navigation: any[]): Map<string, PageLookupEntry> {
  const lookup = new Map<string, PageLookupEntry>()

  function walk(nodes: any[]) {
    for (const node of nodes) {
      if (node.type === 'page' && node.path) {
        lookup.set(node.path, {
          locale: node.locale || '',
          languageLinks: node.languageLinks,
          prefixId: node.prefixId,
        })
      }
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }

  walk(navigation)
  return lookup
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [mounted, setMounted] = useState(false)
  const [pageLookup, setPageLookup] = useState<Map<string, PageLookupEntry>>(new Map())
  const pathname = usePathname()
  const router = useRouter()

  // Load saved locale and page lookup on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (savedLocale && isValidLocale(savedLocale)) {
        setLocaleState(savedLocale)
      }
    } catch {
      // Ignore localStorage errors
    }

    fetch(SITE_CONFIG.DATA_PATHS.SITE_DATA)
      .then(res => res.json())
      .then(data => {
        if (data?.navigation) {
          setPageLookup(buildPageLookup(data.navigation))
        }
      })
      .catch(() => {
        // Ignore fetch errors
      })

    setMounted(true)
  }, [])

  // Save locale to localStorage when it changes
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      // Ignore localStorage errors
    }
  }, [locale, mounted])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
  }, [])

  const strings = getStrings(locale)
  const availableLanguages = AVAILABLE_LANGUAGES

  // Toggle language and navigate to equivalent page
  const toggleLocale = useCallback(() => {
    const currentIndex = availableLanguages.findIndex(lang => lang.code === locale)
    const nextIndex = (currentIndex + 1) % availableLanguages.length
    const nextLocale = availableLanguages[nextIndex].code

    // Extract current page hash from pathname
    // Path format: /page/HASH or /page/HASH/subpath
    const hashMatch = pathname.match(/\/page\/([^\/]+)/)

    if (hashMatch) {
      const currentHash = '/' + hashMatch[1]
      const pageInfo = pageLookup.get(currentHash)

      if (pageInfo?.languageLinks?.[nextLocale]) {
        // Navigate to equivalent page in new language
        const newPath = pageInfo.languageLinks[nextLocale]
        setLocaleState(nextLocale)
        router.push(`${SITE_CONFIG.URL_PREFIX}${newPath}`)
        return
      }
    }

    // Fallback: just update locale if no equivalent page found
    setLocaleState(nextLocale)
  }, [locale, availableLanguages, pathname, pageLookup, router])

  return (
    <LanguageContext.Provider
      value={{
        locale,
        strings,
        availableLanguages,
        toggleLocale,
        setLocale,
        mounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
