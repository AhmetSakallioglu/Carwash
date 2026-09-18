import type { Viewport } from 'next'
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'
import { buildRootMetadata } from '@/lib/seo'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '700'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata = buildRootMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-US"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} scroll-smooth dark`}
    >
      <body className="bg-brand-dark text-slate-200 font-sans antialiased selection:bg-brand-cyan selection:text-black min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
