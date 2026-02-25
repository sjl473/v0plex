"use client"

import React, { createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const VmdThemeContext = createContext<number>(0);

const getColorIndex = (pathname: string) => {
    if (!pathname) return 0;
    let hash = 0;
    for (let i = 0; i < pathname.length; i++) {
        hash = pathname.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 4; // 4 colors
};

export function VmdThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const colorIndex = useMemo(() => getColorIndex(pathname), [pathname]);

    return (
        <VmdThemeContext.Provider value={colorIndex}>
            {children}
        </VmdThemeContext.Provider>
    );
}

export const useVmdColorIndex = () => useContext(VmdThemeContext);