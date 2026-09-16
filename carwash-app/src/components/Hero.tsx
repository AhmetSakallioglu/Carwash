'use client'

import React, { useEffect, useState, useRef } from 'react'
import { MapPin, ArrowRight } from 'lucide-react'

export function Hero() {
  const [hasAnimated, setHasAnimated] = useState(false)
  const metricsRef = useRef<HTMLDivElement>(null)

  const [vehiclesCount, setVehiclesCount] = useState(0)
  const [ratingCount, setRatingCount] = useState(0.0)
  const [waterCount, setWaterCount] = useState(0)
  const [warrantyCount, setWarrantyCount] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          // Animate counters
          const duration = 2000
          const start = performance.now()

          const step = (timestamp: number) => {
            const progress = Math.min((timestamp - start) / duration, 1)
            const easeProgress = 1 - Math.pow(1 - progress, 3)

            setVehiclesCount(Math.floor(easeProgress * 1400))
            setRatingCount(Number((easeProgress * 4.9).toFixed(1)))
            setWaterCount(Math.floor(easeProgress * 100))
            setWarrantyCount(Math.floor(easeProgress * 5))

            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setVehiclesCount(1400)
              setRatingCount(4.9)
              setWaterCount(100)
              setWarrantyCount(5)
            }
          }

          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )

    if (metricsRef.current) {
      observer.observe(metricsRef.current)
    }

    return () => observer.disconnect()
  }, [hasAnimated])

  return (
    <header className="relative min-h-[88svh] flex items-center justify-center pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glassmorphism text-[11px] sm:text-xs font-semibold text-brand-neon mb-6 border border-cyan-500/30 max-w-full">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-left">Mobile & Studio Detailing across Austin, TX</span>
        </div>

        <h1 className="font-display text-[2rem] leading-tight sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Precision Auto Care for <br className="hidden sm:inline" />
          <span className="gradient-text">Austin&apos;s Finest Vehicles.</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10">
          Deep interior extraction, swirl-free paint correction, and certified ceramic coatings.
          Precision results delivered directly to your doorstep.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 bg-brand-neon text-black font-bold rounded-xl hover:bg-cyan-300 transition duration-200 shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Calculate Price & Book <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#comparison"
            className="w-full sm:w-auto px-8 py-4 glassmorphism text-white font-semibold rounded-xl hover:bg-slate-800/80 transition duration-200 border border-slate-700/60 hover:scale-105 active:scale-95 cursor-pointer"
          >
            View Transformation
          </a>
        </div>

        {/* Quick Metrics */}
        <div
          ref={metricsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-800/80"
        >
          <div>
            <div className="font-display text-3xl font-bold text-white">
              {vehiclesCount}+
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Vehicles Restored</div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-brand-neon">
              {ratingCount.toFixed(1)} ★
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Google Rating</div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-white">
              {waterCount}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Deionized Pure Water</div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-brand-neon">
              {warrantyCount}-Year
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Ceramic Warranty</div>
          </div>
        </div>
      </div>
    </header>
  )
}
