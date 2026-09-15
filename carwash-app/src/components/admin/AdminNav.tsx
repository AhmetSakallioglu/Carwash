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

export function AdminNav({ userEmail, onSignOut }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Appointments & Schedule', href: '/admin', icon: CalendarDays },
    { label: 'Services & Pricing', href: '/admin/services', icon: Layers },
    { label: 'Hours & Blackout Dates', href: '/admin/schedule', icon: Clock },
    { label: 'Business Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 text-brand-neon group-hover:rotate-12 transition duration-300" />
              <span className="font-display font-bold text-lg text-white">
                APEX<span className="text-brand-cyan">.ATX</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-brand-cyan/30 text-[11px] font-semibold text-brand-neon">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Operations
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-brand-neon border border-brand-cyan/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-cyan px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {userEmail && (
              <span className="text-xs text-slate-500 hidden lg:inline max-w-[150px] truncate">
                {userEmail}
              </span>
            )}

            {onSignOut && (
              <button
                onClick={onSignOut}
                type="button"
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center gap-1 py-2 overflow-x-auto border-t border-slate-900">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-brand-neon border border-brand-cyan/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
