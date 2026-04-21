import type {Metadata, Viewport} from 'next'
import './globals.css'
import ClientLayout from './client-layout'
import { SITE_METADATA } from '@/config/site.config'

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
}

export const metadata: Metadata = {
    title: SITE_METADATA.title,
    icons: SITE_METADATA.icons,
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (<html lang="en" suppressHydrationWarning>
    <body>
    <ClientLayout>{children}</ClientLayout>
    </body>
    </html>)
}