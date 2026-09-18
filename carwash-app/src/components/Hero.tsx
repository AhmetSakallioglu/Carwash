'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { MapPin, ArrowRight } from 'lucide-react'
import { BusinessSettings } from '@/types'

interface HeroProps {
  settings: BusinessSettings
  googleRating?: number | null
}

function parseStatValue(value: string): { numeric: number | null; prefix: string; suffix: string } {
  const match = value.trim().match(/^(.*?)(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return { numeric: null, prefix: '', suffix: value }
  return {
    numeric: Number(match[2]),
    prefix: match[1],
    suffix: match[3],
  }
}

function formatAnimatedValue(numeric: number, target: number, suffix: string, prefix: string) {
  const isDecimal = !Number.isInteger(target) || suffix.includes('★')
  const display = isDecimal ? numeric.toFixed(1) : String(Math.round(numeric))
  return `${prefix}${display}${suffix}`
}

export function Hero({ settings, googleRating }: HeroProps) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const metricsRef = useRef<HTMLDivElement>(null)
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0])

  const ratingValue = googleRating ?? settings.hero_rating_override ?? 5
  const stats = useMemo(
    () => [
      {
        value: `${settings.hero_vehicles_count}+`,
        label: 'Vehicles Detailed',
        highlight: false,
      },
      {
        value: `${Number(ratingValue).toFixed(1)} ★`,
        label: 'Google Rating',
        highlight: true,
      },
      {
        value: settings.hero_stat_3_value,
        label: settings.hero_stat_3_label,
        highlight: false,
      },
      {
        value: settings.hero_stat_4_value,
        label: settings.hero_stat_4_label,
        highlight: true,
      },
    ],
    [
      settings.hero_vehicles_count,
      ratingValue,
      settings.hero_stat_3_value,
      settings.hero_stat_3_label,
      settings.hero_stat_4_value,
      settings.hero_stat_4_label,
    ]
  )

  const parsedStats = useMemo(() => stats.map(stat => parseStatValue(stat.value)), [stats])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const start = performance.now()
          const targets = parsedStats.map(stat => stat.numeric ?? 0)

          const step = (timestamp: number) => {
            const progress = Math.min((timestamp - start) / duration, 1)
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            setAnimatedValues(targets.map(target => target * easeProgress))
            if (progress < 1) requestAnimationFrame(step)
            else setAnimatedValues(targets)
          }

          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )

    if (metricsRef.current) observer.observe(metricsRef.current)
    return () => observer.disconnect()
  }, [hasAnimated, parsedStats])

  return (
    <header className="relative min-h-[88svh] flex items-center justify-center pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glassmorphism text-[11px] sm:text-xs font-semibold text-brand-neon mb-6 border border-cyan-500/30 max-w-full">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-left">{settings.tagline} · Austin, TX</span>
        </div>

        <h1 className="font-display text-[2rem] leading-tight sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Premium Auto Detailing <br className="hidden sm:inline" />
          <span className="gradient-text">& Mobile Wash in Austin.</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10">
          {settings.business_name} brings showroom-level interior and exterior detailing to your driveway
          across Greater Austin. Book online, we come to you, and you pay on-site when the work is done.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 bg-brand-neon text-black font-bold rounded-xl hover:bg-cyan-300 transition duration-200 shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Calculate Price & Book <ArrowRight className="w-4 h-4" />
          </a>
          {settings.show_before_after && (
            <a
              href="#comparison"
              className="w-full sm:w-auto px-8 py-4 glassmorphism text-white font-semibold rounded-xl hover:bg-slate-800/80 transition duration-200 border border-slate-700/60 hover:scale-105 active:scale-95 cursor-pointer"
            >
              View Transformation
            </a>
          )}
        </div>

        <div
          ref={metricsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-800/80"
        >
          {stats.map((stat, index) => {
            const parsed = parsedStats[index]
            const display =
              parsed.numeric === null
                ? stat.value
                : formatAnimatedValue(animatedValues[index] || 0, parsed.numeric, parsed.suffix, parsed.prefix)

            return (
              <div key={stat.label}>
                <div
                  className={`font-display text-3xl font-bold ${
                    stat.highlight ? 'text-brand-neon' : 'text-white'
                  }`}
                >
                  {display}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </header>
  )
}
