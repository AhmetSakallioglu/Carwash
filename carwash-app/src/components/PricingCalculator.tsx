'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import { Service, VehicleCategory, Addon } from '@/types'
import { formatCurrency, calculateBookingPrice } from '@/lib/utils'
import { Check, Sparkles } from 'lucide-react'

function vehicleCategorySubLabel(label: string): string {
  const normalized = label.toLowerCase()
  if (normalized.includes('sedan') || normalized.includes('coupe')) return 'Standard'
  if (normalized.includes('crossover') || normalized.includes('mid-suv') || normalized.includes('mid suv')) {
    return 'Mid-Size'
  }
  if (normalized.includes('truck') || normalized.includes('3-row') || normalized.includes('3 row')) {
    return 'Full-Size / 3-Row'
  }
  return 'Vehicle class'
}

export interface SelectedConfiguration {
  selectedService: Service
  selectedCategory: VehicleCategory
  selectedAddons: Addon[]
  totalPrice: number
  totalDurationMinutes: number
}

interface PricingCalculatorProps {
  services: Service[]
  categories: VehicleCategory[]
  addons: Addon[]
  selectedServiceId: string
  selectedCategoryId: string
  selectedAddonIds: string[]
  onSelectServiceId: (id: string) => void
  onSelectCategoryId: (id: string) => void
  onToggleAddonId: (id: string) => void
  onReserve: (config: SelectedConfiguration) => void
  isHighlighted?: boolean
}

export function PricingCalculator({
  services,
  categories,
  addons,
  selectedServiceId,
  selectedCategoryId,
  selectedAddonIds,
  onSelectServiceId,
  onSelectCategoryId,
  onToggleAddonId,
  onReserve,
  isHighlighted = false,
}: PricingCalculatorProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  const activeServices = useMemo(() => services.filter(s => s.is_active), [services])
  const activeCategories = useMemo(() => categories.filter(c => c.is_active), [categories])
  const activeAddons = useMemo(() => addons.filter(a => a.is_active), [addons])

  const currentService = useMemo(() => {
    return activeServices.find(s => s.id === selectedServiceId) || activeServices[0] || null
  }, [activeServices, selectedServiceId])

  const currentCategory = useMemo(() => {
    return activeCategories.find(c => c.id === selectedCategoryId) || activeCategories[0] || null
  }, [activeCategories, selectedCategoryId])

  const currentSelectedAddons = useMemo(() => {
    return activeAddons.filter(a => selectedAddonIds.includes(a.id))
  }, [activeAddons, selectedAddonIds])

  const totalPrice = useMemo(() => {
    if (!currentService || !currentCategory) return 0
    const addonPrices = currentSelectedAddons.map(a => a.price)
    return calculateBookingPrice(currentService.base_price, currentCategory.multiplier, addonPrices)
  }, [currentService, currentCategory, currentSelectedAddons])

  const totalDuration = useMemo(() => {
    if (!currentService) return 60
    const addonsDuration = currentSelectedAddons.reduce((acc, a) => acc + a.duration_minutes, 0)
    return currentService.duration_minutes + addonsDuration
  }, [currentService, currentSelectedAddons])

  const handleReserveClick = () => {
    if (!currentService || !currentCategory) return
    onReserve({
      selectedService: currentService,
      selectedCategory: currentCategory,
      selectedAddons: currentSelectedAddons,
      totalPrice,
      totalDurationMinutes: totalDuration,
    })
  }

  useEffect(() => {
    if (isHighlighted && boxRef.current) {
      boxRef.current.classList.add('border-brand-neon', 'glow-effect')
      const timer = setTimeout(() => {
        if (boxRef.current) {
          boxRef.current.classList.remove('border-brand-neon', 'glow-effect')
        }
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [isHighlighted])

  return (
    <section id="pricing" className="py-24 px-6 bg-slate-950/80 border-y border-slate-800/80 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-cyan mb-2">
            Instant Estimate
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-white">
            Custom Package Builder
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Select your vehicle type and preferences for a transparent quote.
          </p>
        </div>

        <div
          ref={boxRef}
          className="glassmorphism p-6 sm:p-10 rounded-3xl border border-slate-800 grid md:grid-cols-5 gap-8 items-stretch transition-all duration-500 shadow-2xl"
        >
          {/* Configuration Controls (Left 3 Columns) */}
          <div className="md:col-span-3 space-y-6">
            {/* 1: Vehicle Size */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                1. Vehicle Category
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {activeCategories.map(cat => {
                  const isSelected = cat.id === currentCategory?.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onSelectCategoryId(cat.id)}
                      className={`px-3 py-3 rounded-xl text-xs font-bold text-center transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border border-brand-cyan bg-cyan-500/15 text-white shadow-sm'
                          : 'border border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <div>{cat.label}</div>
                      <div className="text-[10px] font-normal text-brand-neon/80 mt-0.5">
                        {vehicleCategorySubLabel(cat.label)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2: Core Service */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                2. Core Service Package
              </label>
              <select
                value={currentService?.id || ''}
                onChange={e => onSelectServiceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan transition cursor-pointer"
              >
                {activeServices.map(svc => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} — ({formatCurrency(svc.base_price)} Base, ~{svc.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            {/* 3: Add-ons */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                3. High-Value Add-Ons
              </label>
              <div className="space-y-2.5">
                {activeAddons.map(addon => {
                  const isChecked = selectedAddonIds.includes(addon.id)
                  return (
                    <label
                      key={addon.id}
                      onClick={() => onToggleAddonId(addon.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-cyan-500/10 border-brand-cyan/60 text-white'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-brand-cyan border-brand-cyan text-black'
                              : 'border-slate-700 bg-slate-950'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-medium">{addon.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            +{addon.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-brand-neon">
                        +{formatCurrency(addon.price)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Summary & Reserve CTA (Right 2 Columns) */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-900 to-brand-card p-6 rounded-2xl border border-cyan-500/20 text-center flex flex-col justify-between h-full shadow-lg">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
                Estimated Total
              </div>

              <div className="my-5">
                <span className="text-4xl sm:text-5xl font-extrabold font-display text-white transition-transform duration-200 inline-block">
                  {formatCurrency(totalPrice)}
                </span>
                <span className="text-xs text-slate-400 block mt-1 font-medium">
                  Austin Mobile or Studio
                </span>
                <span className="text-[11px] text-brand-neon/80 block mt-0.5">
                  Estimated Time: ~{Math.floor(totalDuration / 60)}h {totalDuration % 60 ? `${totalDuration % 60}m` : ''}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Includes complimentary tire dressing, hydrophobic glass treatment, and multi-point inspection.
              </p>
            </div>

            <button
              onClick={handleReserveClick}
              type="button"
              className="w-full py-3.5 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-sm rounded-xl transition shadow-lg shadow-cyan-500/20 block cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              Reserve This Package
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
