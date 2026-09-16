'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronsLeftRight } from 'lucide-react'

export function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const clampedOffset = Math.max(0, Math.min(offsetX, rect.width))
    const percentage = (clampedOffset / rect.width) * 100
    setSliderPosition(percentage)
  }, [])

  const onMouseDown = () => setIsDragging(true)
  const onTouchStart = () => setIsDragging(true)

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false)
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      handleMove(e.clientX)
    }

    const onTouchEnd = () => setIsDragging(false)
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      handleMove(e.touches[0].clientX)
    }

    if (isDragging) {
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('touchend', onTouchEnd)
      window.addEventListener('touchmove', onTouchMove)
    }

    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [isDragging, handleMove])

  return (
    <section id="comparison" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950/60 scroll-mt-24 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-cyan mb-2">
            Unmatched Craftsmanship
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-white">
            See the Transformation
          </p>
        </div>

        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="relative w-full max-w-4xl mx-auto h-56 sm:h-96 md:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none cursor-ew-resize touch-none"
        >
          {/* Before View (Background) */}
          <div
            className="absolute inset-0 bg-slate-900 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1400&q=80')",
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <span className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-10 text-[10px] sm:text-xs font-bold tracking-wider px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-black/70 backdrop-blur text-slate-300 border border-white/10">
              BEFORE
            </span>
          </div>

          {/* After View (Clipped) */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=80')",
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            }}
          >
            <span className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-10 text-[10px] sm:text-xs font-bold tracking-wider px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md bg-brand-cyan/90 text-black font-semibold">
              AFTER
            </span>
          </div>

          {/* Slider Divider & Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-brand-cyan z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-cyan text-black flex items-center justify-center shadow-2xl border-2 border-white transition-transform active:scale-110">
              <ChevronsLeftRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Drag the slider horizontally to compare before and after results.
        </p>
      </div>
    </section>
  )
}
