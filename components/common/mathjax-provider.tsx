"use client"

import type React from "react"
import {createContext, useContext, useEffect, useState} from "react"

interface MathJaxContextType {
    isLoaded: boolean
    typeset: (element?: HTMLElement) => Promise<void>
}

const MathJaxContext = createContext<MathJaxContextType>({
    isLoaded: false, typeset: async () => {
    },
})

export function MathJaxProvider({children}: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        // Check if MathJax is already loaded
        if ((window as any).MathJax) {
            setIsLoaded(true)
            return
        }
        // Configure MathJax before loading
        ;(window as any).MathJax = {
            tex: {
                inlineMath: [["$", "$"]], displayMath: [["$$", "$$"]], processEscapes: true, processEnvironments: true,
            }, chtml: {
                scale: 1,
                minScale: 0.5,
                matchFontHeight: false,
                // Changed from CDN to local path
                fontURL: "/mathjax-fonts",
                adaptiveCSS: true,
            }, options: {
                skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
            }, startup: {
                ready: () => {
                    ;(window as any).MathJax.startup.defaultReady()
                    setIsLoaded(true)
                    // console.log("MathJax loaded successfully with proper font configuration")
                },
            },
        }

        const script = document.createElement("script")
        script.src = "/tex-chtml-full-speech.js"
        script.async = true
        script.onload = () => {
            // console.log("MathJax script loaded from /tex-chtml.js")
        }
        script.onerror = () => {
            // console.error("Failed to load local MathJax, falling back to CDN")
            const cdnScript = document.createElement("script")
            cdnScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"
            cdnScript.async = true
            cdnScript.onload = () => {
                // console.log("MathJax loaded from CDN fallback")
            }
            document.head.appendChild(cdnScript)
        }
        document.head.appendChild(script)
    }, [])

    const typeset = async (element?: HTMLElement) => {
        if (!isLoaded || !(window as any).MathJax) return

        try {
            if ((window as any).MathJax.typesetPromise) {
                await (window as any).MathJax.typesetPromise(element ? [element] : undefined)
            } else if ((window as any).MathJax.typeset) {
                ;(window as any).MathJax.typeset(element ? [element] : undefined)
            }
        } catch (error) {
            // console.error("MathJax typeset error:", error)
        }
    }

    return <MathJaxContext.Provider value={{isLoaded, typeset}}>{children}</MathJaxContext.Provider>
}

export const useMathJax = () => useContext(MathJaxContext)