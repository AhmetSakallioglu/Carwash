'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { BusinessSettings } from '@/types'

interface NavbarProps {
  onOpenBooking: () => void
  settings: BusinessSettings
}

const NAV_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#comparison', label: 'Results' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#locations', label: 'Austin Area' },
] as const

export function Navbar({ onOpenBooking, settings }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 768) setMenuOpen(false)
    }
    window.addEventListener('resize', closeOnDesktop)
    return () => window.removeEventListener('resize', closeOnDesktop)
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const navLinks = NAV_LINKS.filter(
    link => settings.show_before_after || link.href !== '#comparison'
  )

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/55 md:hidden"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[92%] max-w-6xl z-40 rounded-2xl sm:rounded-full glassmorphism px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 border border-slate-800/80 shadow-2xl">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0" onClick={closeMenu}>
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand-neon group-hover:rotate-12 transition duration-300 shrink-0" />
          <BrandMark name={settings.business_name} className="text-lg sm:text-xl truncate" />
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="hover:text-brand-neon transition">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              closeMenu()
              onOpenBooking()
            }}
            type="button"
            className="bg-gradient-to-r from-brand-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs md:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="sm:hidden">Book</span>
            <span className="hidden sm:inline">Book in Austin</span>
          </button>

          <button
            type="button"
            className="md:hidden p-2.5 rounded-full bg-slate-800/80 border border-slate-700 text-white cursor-pointer"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 md:hidden glassmorphism rounded-2xl border border-slate-800 p-2 shadow-2xl max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain">
            <div className="flex flex-col">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="px-3.5 py-3.5 text-base font-medium text-slate-200 hover:text-brand-neon hover:bg-slate-800/70 rounded-xl transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
