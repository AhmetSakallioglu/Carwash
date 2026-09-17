'use client'

import React, { useMemo, useEffect, useRef, useState } from 'react'
import { Service, VehicleCategory, Addon, LocationZone } from '@/types'
import {
  formatCurrency,
  calculateBookingPrice,
  calculateDiscountedBasePrice,
  formatDurationMinutes,
  formatLocationZoneOption,
  hasActiveDiscount,
  matchLocationZone,
  OUT_OF_SERVICE_AREA_MESSAGE,
} from '@/lib/utils'
import { Check, Sparkles, MapPin, Tag } from 'lucide-react'
import { vehicleCategorySizeHint } from '@/lib/settings'

export interface SelectedConfiguration {
  selectedService: Service
  selectedCategory: VehicleCategory
  selectedAddons: Addon[]
  selectedZone: LocationZone | null
  serviceZip?: string
  totalPrice: number
  totalDurationMinutes: number
  discountSavings: number
}

interface PricingCalculatorProps {
  services: Service[]
  categories: VehicleCategory[]
  addons: Addon[]
  locationZones: LocationZone[]
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
  locationZones,
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
  const [locationQuery, setLocationQuery] = useState('')

  const activeServices = useMemo(() => services.filter(s => s.is_active), [services])
  const activeCategories = useMemo(() => categories.filter(c => c.is_active), [categories])
  const activeAddons = useMemo(() => addons.filter(a => a.is_active), [addons])
  const activeZones = useMemo(() => locationZones.filter(z => z.is_active), [locationZones])

  const currentService = useMemo(() => {
    return activeServices.find(s => s.id === selectedServiceId) || activeServices[0] || null
  }, [activeServices, selectedServiceId])

  const currentCategory = useMemo(() => {
    return activeCategories.find(c => c.id === selectedCategoryId) || activeCategories[0] || null
  }, [activeCategories, selectedCategoryId])

  const currentZone = useMemo(() => {
    return matchLocationZone(locationQuery, activeZones)
  }, [activeZones, locationQuery])

  const currentSelectedAddons = useMemo(() => {
    return activeAddons.filter(a => selectedAddonIds.includes(a.id))
  }, [activeAddons, selectedAddonIds])

  const hasDiscount = hasActiveDiscount(
    currentService?.discount_percentage,
    currentService?.discount_active
  )

  const discountedBasePrice = useMemo(() => {
    if (!currentService) return 0
    return calculateDiscountedBasePrice(
      currentService.base_price,
      currentService.discount_percentage,
      currentService.discount_active
    )
  }, [currentService])

  const totalPrice = useMemo(() => {
    if (!currentService || !currentCategory) return 0
    const addonPrices = currentSelectedAddons.map(a => a.price)
    const travelFee = currentZone?.travel_fee || 0
    return calculateBookingPrice(
      currentService.base_price,
      currentCategory.multiplier,
      addonPrices,
      travelFee,
      currentService.discount_percentage,
      currentService.discount_active
    )
  }, [currentService, currentCategory, currentSelectedAddons, currentZone])

  const originalTotalPriceWithoutDiscount = useMemo(() => {
    if (!currentService || !currentCategory) return 0
    const addonPrices = currentSelectedAddons.map(a => a.price)
    const travelFee = currentZone?.travel_fee || 0
    return calculateBookingPrice(
      currentService.base_price,
      currentCategory.multiplier,
      addonPrices,
      travelFee,
      0,
      false
    )
  }, [currentService, currentCategory, currentSelectedAddons, currentZone])

  const discountSavings = Math.max(0, originalTotalPriceWithoutDiscount - totalPrice)

  const totalDuration = useMemo(() => {
    if (!currentService) return 60
    const addonsDuration = currentSelectedAddons.reduce((acc, a) => acc + a.duration_minutes, 0)
    const travelBuffer = currentZone?.travel_time_minutes || 0
    return currentService.duration_minutes + addonsDuration + travelBuffer
  }, [currentService, currentSelectedAddons, currentZone])

  const handleReserveClick = () => {
    if (!currentService || !currentCategory || !currentZone) return
    onReserve({
      selectedService: currentService,
      selectedCategory: currentCategory,
      selectedAddons: currentSelectedAddons,
      selectedZone: currentZone,
      serviceZip: locationQuery.trim(),
      totalPrice,
      totalDurationMinutes: totalDuration,
      discountSavings,
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
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950/80 border-y border-slate-800/80 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-cyan mb-2">
            Instant Estimate & Dynamic Travel Engine
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-white">
            Custom Package & Area Builder
          </p>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Select your vehicle type, core package, and Greater Austin ZIP so travel fees are assigned automatically.
          </p>
        </div>

        <div
          ref={boxRef}
          className="glassmorphism p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-800 grid md:grid-cols-5 gap-6 sm:gap-8 items-stretch transition-all duration-500 shadow-2xl"
        >
          {/* Configuration Controls (Left 3 Columns) */}
          <div className="md:col-span-3 space-y-6">
            {/* 1: Vehicle Size */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                1. Vehicle Category
              </label>
              <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2.5">
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
                      <div className="leading-snug">{cat.label}</div>
                      <div className="text-[10px] font-normal text-brand-neon/80 mt-0.5">
                        {vehicleCategorySizeHint(cat.label)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2: Core Service Package */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Core Service Package
                </label>
                {hasDiscount && (
                  <span className="text-[10px] font-bold text-brand-neon bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {currentService?.discount_percentage}% PROMO ACTIVE
                  </span>
                )}
              </div>

              <select
                value={currentService?.id || ''}
                onChange={e => onSelectServiceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan transition cursor-pointer"
              >
                {activeServices.map(svc => {
                  const isDisc = hasActiveDiscount(svc.discount_percentage, svc.discount_active)
                  const effBase = isDisc
                    ? calculateDiscountedBasePrice(svc.base_price, svc.discount_percentage, true)
                    : svc.base_price

                  return (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} — {formatCurrency(effBase)} {isDisc ? `(Special Promo: ${svc.discount_percentage}% OFF - orig. ${formatCurrency(svc.base_price)})` : 'Base'}, ~{svc.duration_minutes} min
                    </option>
                  )
                })}
              </select>

              {hasDiscount && (
                <div className="mt-2 p-2.5 rounded-xl bg-cyan-500/10 border border-brand-cyan/30 flex items-center justify-between text-xs text-brand-neon">
                  <span className="flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Promotional Price Active:
                  </span>
                  <div>
                    <span className="line-through text-slate-500 mr-2">
                      {formatCurrency(currentService?.base_price || 0)}
                    </span>
                    <span className="font-bold text-white">
                      {formatCurrency(discountedBasePrice)} Base
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3: High-Value Add-Ons */}
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
                      className={`flex items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-cyan-500/10 border-brand-cyan/60 text-white'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 text-xs min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 sm:mt-0 ${
                            isChecked
                              ? 'bg-brand-cyan border-brand-cyan text-black'
                              : 'border-slate-700 bg-slate-950'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium break-words">{addon.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2 whitespace-nowrap">
                            +{addon.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-brand-neon shrink-0">
                        +{formatCurrency(addon.price)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 4: Service Location via ZIP / City auto-detect */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-cyan" /> 4. Service ZIP or City
              </label>
              <input
                type="text"
                autoComplete="postal-code"
                placeholder="e.g. 78701, 78681, 78626 or Georgetown"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan transition"
              />

              {currentZone ? (
                <div className="mt-2 text-[11px] text-slate-400 flex items-start justify-between gap-2">
                  <span>
                    Auto-assigned: <strong className="text-white">{formatLocationZoneOption(currentZone)}</strong>
                  </span>
                  <span className="text-brand-neon font-medium shrink-0">
                    {currentZone.travel_fee > 0
                      ? `+${formatCurrency(currentZone.travel_fee)} Travel Fee`
                      : '✓ Free Austin Area Travel'}
                  </span>
                </div>
              ) : locationQuery.trim() ? (
                <p className="mt-2 text-[11px] text-amber-300/90">{OUT_OF_SERVICE_AREA_MESSAGE}</p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">
                  Enter a 5-digit ZIP to lock travel fee and transit time. Zone cannot be chosen manually.
                </p>
              )}
            </div>
          </div>

          {/* Summary & Reserve CTA (Right 2 Columns) */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-900 to-brand-card p-6 rounded-2xl border border-cyan-500/20 text-center flex flex-col justify-between h-full shadow-lg">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
                Estimated Total Quote
              </div>

              <div className="my-5">
                {hasDiscount && (
                  <div className="line-through text-slate-500 text-sm font-semibold mb-1">
                    {formatCurrency(originalTotalPriceWithoutDiscount)}
                  </div>
                )}
                <span className="text-4xl sm:text-5xl font-extrabold font-display text-brand-neon transition-transform duration-200 inline-block">
                  {formatCurrency(totalPrice)}
                </span>

                {discountSavings > 0 && (
                  <span className="text-xs text-emerald-400 block mt-1 font-bold">
                    You Save {formatCurrency(discountSavings)}!
                  </span>
                )}

                <span className="text-xs text-slate-400 block mt-1 font-medium">
                  {currentZone?.zone_name || 'Enter ZIP to assign travel zone'}
                </span>
                <span className="text-[11px] text-brand-neon/80 block mt-1">
                  Estimated Slot Window: ~{formatDurationMinutes(totalDuration)}
                  {currentZone?.travel_time_minutes ? ` (incl. ${currentZone.travel_time_minutes}m travel buffer)` : ''}
                </span>
              </div>

              {/* Breakdown Line Items */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-left text-xs space-y-1.5 mb-5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 truncate max-w-[140px]">{currentService?.name} ({currentCategory?.label}):</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(Math.round(discountedBasePrice * (currentCategory?.multiplier || 1) * 100) / 100)}
                  </span>
                </div>
                {currentSelectedAddons.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Add-ons ({currentSelectedAddons.length}):</span>
                    <span className="font-semibold text-white">
                      +{formatCurrency(currentSelectedAddons.reduce((acc, a) => acc + a.price, 0))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 truncate max-w-[140px]">Zone Travel Fee:</span>
                  <span className="font-semibold text-brand-neon">
                    {!currentZone
                      ? 'Pending ZIP'
                      : currentZone.travel_fee > 0
                        ? `+${formatCurrency(currentZone.travel_fee)}`
                        : '$0 (Free)'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Transparent pricing with no hidden fees. Includes prep decontamination, finish sealant, and multi-point inspection.
              </p>
            </div>

            <button
              onClick={handleReserveClick}
              type="button"
              disabled={!currentZone}
              className={`w-full py-3.5 font-bold text-sm rounded-xl transition shadow-lg block ${
                currentZone
                  ? 'bg-brand-neon hover:bg-cyan-300 text-black shadow-cyan-500/20 cursor-pointer hover:scale-[1.02] active:scale-95'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {currentZone ? 'Reserve This Package' : 'Enter ZIP to Reserve'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
