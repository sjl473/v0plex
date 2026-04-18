import type {Metadata, Viewport} from 'next'
import './globals.css'
import ClientLayout from './client-layout'

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
}

export const metadata: Metadata = {
    title: 'v0plex', description: 'Commercial Loan Platform Management Handbooks', icons: {
        icon: '/v0plex_avatar.svg', // Eximbank logo as favicon
    },
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