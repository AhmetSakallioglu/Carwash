'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Sparkles,
  Layers,
  Clock,
  Settings,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

interface AdminNavProps {
  userEmail?: string | null
  onSignOut?: () => void
}

const NAV_ITEMS = [
  { label: 'Appointments', shortLabel: 'Bookings', href: '/admin', icon: CalendarDays },
  { label: 'Services', shortLabel: 'Services', href: '/admin/services', icon: Layers },
  { label: 'Hours', shortLabel: 'Hours', href: '/admin/schedule', icon: Clock },
  { label: 'Settings', shortLabel: 'Settings', href: '/admin/settings', icon: Settings },
] as const

function isNavActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav({ userEmail, onSignOut }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-14 sm:h-16">
            <Link href="/admin" className="flex items-center gap-1.5 sm:gap-2 group min-w-0">
              <Sparkles className="w-5 h-5 text-brand-neon group-hover:rotate-12 transition duration-300 shrink-0" />
              <span className="font-display font-bold text-base sm:text-lg text-white truncate">
                OZER<span className="text-brand-cyan">.ATX</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-brand-cyan/30 text-[10px] font-semibold text-brand-neon">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 min-w-0">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                const active = isNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-cyan-500/15 text-brand-neon border border-brand-cyan/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-cyan px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              >
                <span className="hidden sm:inline">Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {userEmail && (
                <span className="text-xs text-slate-500 hidden xl:inline max-w-[140px] truncate">
                  {userEmail}
                </span>
              )}

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-2 sm:px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md safe-bottom">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isNavActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                  active ? 'text-brand-neon' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-brand-neon' : ''}`} />
                <span>{item.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
