import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeScript } from '@/components/theme-script'
import { PageLoader } from '@/components/page-loader'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TestForge — Lightweight HTTP Inspection & Debugging Utility',
  description:
    'Fast, practical HTTP request inspection tool with server-side proxy, request history, and response debugging. Built for developers.',
  applicationName: 'TestForge',
  authors: [{ name: 'Vishal Ghuge' }],
  keywords: ['HTTP', 'API', 'Inspector', 'Postman', 'Debugging', 'Web Development'],
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    title: 'TestForge',
    description: 'Lightweight HTTP Inspection & Debugging Utility',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${geist.className} antialiased bg-background text-foreground transition-colors`}>
        <PageLoader />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
