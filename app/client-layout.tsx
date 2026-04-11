"use client"

import type React from "react"
import {useCallback, useEffect, useState} from "react"
import {ThemeProvider} from "@/components/common/theme-provider"
import {LanguageProvider} from "@/components/common/language-provider"
import {MathJaxProvider} from "@/components/common/mathjax-provider"
import Header from "@/components/common/header"
import Sidebar from "@/components/common/sidebar"
import Footer from "@/components/common/footer"
import styles from "./client-layout.module.css"
import PageNavigation from "@/components/common/page-navigation";
import { LAYOUT_CONFIG } from "@/config/site.config";
import RightSidebar from "@/components/common/right-sidebar";

// Layout width constants
const SIDEBAR_WIDTH = LAYOUT_CONFIG.SIDEBAR_WIDTH;
const RIGHT_SIDEBAR_WIDTH = LAYOUT_CONFIG.RIGHT_SIDEBAR_WIDTH;

// Left content offset - controls left alignment for content across all layouts
// These values ensure content aligns with the header's left edge
const LEFT_CONTENT_OFFSET = LAYOUT_CONFIG.LEFT_CONTENT_OFFSET;

export default function ClientLayout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH)
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
    const toggleRightSidebar = useCallback(() => {
        setIsRightSidebarOpen(prev => {
            const next = !prev
            document.documentElement.style.setProperty(
                '--right-sidebar-width',
                next ? `${RIGHT_SIDEBAR_WIDTH}px` : '0px'
            )
            return next
        })
    }, [])

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen)
    }

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false)
    }

    // Set CSS variables for sidebar width and content left offsets
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--sidebar-width', `${SIDEBAR_WIDTH}px`)
            document.documentElement.style.setProperty('--content-left-offset-pc', LEFT_CONTENT_OFFSET.pc)
            document.documentElement.style.setProperty('--content-left-offset-tablet', LEFT_CONTENT_OFFSET.tablet)
            document.documentElement.style.setProperty('--content-left-offset-mobile', LEFT_CONTENT_OFFSET.mobile)
            document.documentElement.style.setProperty('--right-sidebar-width', `${RIGHT_SIDEBAR_WIDTH}px`)
            // Debug: log the values
            console.log('CSS Variables set:', {
                '--sidebar-width': `${SIDEBAR_WIDTH}px`,
                '--right-sidebar-width': `${RIGHT_SIDEBAR_WIDTH}px`,
                '--content-left-offset-pc': LEFT_CONTENT_OFFSET.pc,
                '--content-left-offset-tablet': LEFT_CONTENT_OFFSET.tablet,
                '--content-left-offset-mobile': LEFT_CONTENT_OFFSET.mobile
            })
        }
    }, [])

    // Debug: check actual offsets after mount
    useEffect(() => {
        const checkOffsets = () => {
            const mainContent = document.querySelector('[class*="mainContent"]');
            const contentWrapper = document.querySelector('[class*="contentWrapper"]');
            const footerMain = document.querySelector('[class*="footer_main__"]');
            const footerContainer = document.querySelector('[class*="footer_container__"]');
            const navContainer = document.querySelector('[class*="page-navigation_navContainer__"]');
            const navFirstChild = document.querySelector('[class*="page-navigation_navContainer__"] > :first-child');
            
            console.log('=== OFFSET DEBUG ===');
            console.log('mainContent:', mainContent?.getBoundingClientRect().left);
            console.log('contentWrapper:', contentWrapper?.getBoundingClientRect().left);
            console.log('footerMain:', footerMain?.getBoundingClientRect().left);
            console.log('footerContainer:', footerContainer?.getBoundingClientRect().left);
            console.log('navContainer:', navContainer?.getBoundingClientRect().left);
            console.log('navFirstChild:', navFirstChild?.getBoundingClientRect().left);
            console.log('===================');
        };
        
        // Check after a short delay to ensure DOM is ready
        setTimeout(checkOffsets, 1000);
        
        // Also check on resize
        window.addEventListener('resize', checkOffsets);
        return () => window.removeEventListener('resize', checkOffsets);
    }, [])

    // This callback controls the width for BOTH sidebar and content
    const handleSidebarResize = useCallback((newWidth: number) => {
        // Disable resize completely - sidebar width is fixed
        return
    }, [])

    return (<ThemeProvider>
        <LanguageProvider>
        <MathJaxProvider>
            <div className={styles.container}>
                <Header onToggleSidebar={toggleMobileSidebar} onToggleRightSidebar={toggleRightSidebar} isRightSidebarOpen={isRightSidebarOpen} isSidebarOpen={isMobileSidebarOpen}/>
                <div className={styles.layout}>
                    <Sidebar
                        isMobileOpen={isMobileSidebarOpen}
                        onCloseMobile={closeMobileSidebar}
                        width={sidebarWidth}
                        onResize={handleSidebarResize}
                    />
                    <main
                        className={styles.mainContent}
                    >
                        <div className={styles.contentWrapper}>{children}</div>
                        <PageNavigation/>
                        <Footer/>
                    </main>
                    <RightSidebar />
                </div>
            </div>
        </MathJaxProvider>
        </LanguageProvider>
    </ThemeProvider>)
}