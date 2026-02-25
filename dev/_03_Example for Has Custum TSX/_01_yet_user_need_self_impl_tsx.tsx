"use client"

import {GlobalTheme, ListItem, Theme, UnorderedList} from "@carbon/react"
import {useTheme} from "@/components/common/theme-provider"

export default function HomePage() {
    const {theme} = useTheme()

    return (<GlobalTheme theme={theme}>
        <div className="v0plex-content">
            <div className="page-typography-content">
                <h1 style={{
                    fontWeight: 'medium', fontFamily: 'IBM Plex Mono', fontSize: '6rem', marginTop: '1rem',

                }}>b</h1>


            </div>
        </div>
    </GlobalTheme>)
}
