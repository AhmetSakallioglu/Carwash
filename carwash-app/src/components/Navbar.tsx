'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, ShieldCheck } from 'lucide-react'

interface NavbarProps {
  onOpenBooking: () => void
}

export function Navbar({ onOpenBooking }: NavbarProps) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-40 rounded-full glassmorphism px-6 py-3.5 flex items-center justify-between border border-slate-800/80 shadow-2xl">
      <Link href="/" className="flex items-center gap-2 group">
        <Sparkles className="w-6 h-6 text-brand-neon group-hover:rotate-12 transition duration-300" />
        <span className="font-display font-bold text-xl tracking-wider text-white">
          APEX<span className="text-brand-cyan">.ATX</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#services" className="hover:text-brand-neon transition">
          Services
        </a>
        <a href="#comparison" className="hover:text-brand-neon transition">
          Results
        </a>
        <a href="#pricing" className="hover:text-brand-neon transition">
          Pricing & Calculator
        </a>
        <a href="#locations" className="hover:text-brand-neon transition">
          Austin Area
        </a>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-cyan transition px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-brand-neon" />
          Admin
        </Link>
      </div>

      <button
        onClick={onOpenBooking}
        type="button"
        className="bg-gradient-to-r from-brand-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs md:text-sm px-5 py-2.5 rounded-full transition shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
      >
        Book in Austin
      </button>
    </nav>
  )
}
