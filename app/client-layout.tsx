"use client"

import type React from "react"
import {useCallback, useState} from "react"
import {ThemeProvider} from "@/components/common/theme-provider"
import {MathJaxProvider} from "@/components/common/mathjax-provider"
import Header from "@/components/common/header"
import Sidebar from "@/components/common/sidebar"
import Footer from "@/components/common/footer"
import styles from "./client-layout.module.css"
import PageNavigation from "@/components/common/page-navigation";

export default function ClientLayout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(400)

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen)
    }

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false)
    }

    // This callback controls the width for BOTH sidebar and content
    const handleSidebarResize = useCallback((newWidth: number) => {
        setSidebarWidth(newWidth)
    }, [])

    return (<ThemeProvider>
        <MathJaxProvider>
            <div className={styles.container}>
                <Header onToggleSidebar={toggleMobileSidebar}/>
                <div className={styles.layout}>
                    <Sidebar
                        isMobileOpen={isMobileSidebarOpen}
                        onCloseMobile={closeMobileSidebar}
                        width={sidebarWidth}
                        onResize={handleSidebarResize}
                    />
                    <main
                        className={styles.mainContent}
                        style={{marginLeft: `${sidebarWidth}px`}} // Inline style guarantees sync with sidebar
                    >
                        <div className={styles.contentWrapper}>{children}</div>
                        <PageNavigation/>
                        <Footer/>
                    </main>
                </div>
            </div>
        </MathJaxProvider>
    </ThemeProvider>)
}