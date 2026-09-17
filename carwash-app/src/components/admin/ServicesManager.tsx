'use client'

import React, { useState } from 'react'
import { Service } from '@/types'
import { formatCurrency, calculateDiscountedBasePrice } from '@/lib/utils'
import { saveServiceAction, deleteServiceAction } from '@/app/actions/admin'
import { Plus, Edit2, Trash2, Check, X, Loader2, Tag, Percent } from 'lucide-react'

interface ServicesManagerProps {
  initialServices: Service[]
}

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [isEditing, setIsEditing] = useState(false)
  const [currentService, setCurrentService] = useState<Partial<Service> | null>(null)
  const [featuresInput, setFeaturesInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [togglingDiscountId, setTogglingDiscountId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setCurrentService({
      name: '',
      slug: '',
      description: '',
      features: [],
      base_price: 99,
      duration_minutes: 60,
      discount_percentage: 0,
      discount_active: false,
      is_featured: false,
      is_active: true,
      sort_order: services.length + 1,
    })
    setFeaturesInput('')
    setErrorMessage(null)
    setIsEditing(true)
  }

  const handleOpenEdit = (service: Service) => {
    setCurrentService(service)
    setFeaturesInput((service.features || []).join('\n'))
    setErrorMessage(null)
    setIsEditing(true)
  }

  const handleQuickDiscountPercent = async (service: Service, rawValue: string) => {
    const nextPercent = Math.min(100, Math.max(0, Number(rawValue) || 0))
    if (nextPercent === Number(service.discount_percentage)) return

    setTogglingDiscountId(service.id)
    try {
      const result = await saveServiceAction({
        ...service,
        discount_percentage: nextPercent,
        discount_active: nextPercent > 0 ? service.discount_active : false,
      })

      if (result.success && result.data) {
        setServices(services.map(s => (s.id === result.data!.id ? result.data! : s)))
      } else {
        alert(result.error || 'Failed to update discount percentage')
      }
    } catch {
      alert('Error updating discount percentage')
    } finally {
      setTogglingDiscountId(null)
    }
  }

  const handleQuickToggleDiscount = async (service: Service) => {
    setTogglingDiscountId(service.id)
    try {
      const updatedActive = !service.discount_active
      const result = await saveServiceAction({
        ...service,
        discount_active: updatedActive,
      })

      if (result.success && result.data) {
        setServices(services.map(s => (s.id === result.data!.id ? result.data! : s)))
      } else {
        alert(result.error || 'Failed to toggle discount')
      }
    } catch {
      alert('Error toggling discount')
    } finally {
      setTogglingDiscountId(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentService) return

    setIsLoading(true)
    setErrorMessage(null)

    const featuresArray = featuresInput
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean)

    const payload = {
      ...currentService,
      features: featuresArray,
      discount_percentage: Math.min(100, Math.max(0, Number(currentService.discount_percentage) || 0)),
      discount_active: Boolean(currentService.discount_active),
    }

    try {
      const isNew = !currentService.id
      const result = await saveServiceAction({
        ...payload,
        name: payload.name || '',
      })

      if (result.success && result.data) {
        if (isNew) {
          setServices([...services, result.data])
        } else {
          setServices(services.map(s => (s.id === result.data!.id ? result.data! : s)))
        }
        setIsEditing(false)
      } else {
        setErrorMessage(result.error || 'Failed to save service')
      }
    } catch {
      setErrorMessage('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service package?')) return

    try {
      const result = await deleteServiceAction(id)
      if (result.success) {
        setServices(services.filter(s => s.id !== id))
      } else {
        alert(result.error || 'Failed to delete service')
      }
    } catch {
      alert('Error deleting service')
    }
  }

  const previewEffectiveBase = currentService
    ? calculateDiscountedBasePrice(
        Number(currentService.base_price) || 0,
        Number(currentService.discount_percentage) || 0,
        Boolean(currentService.discount_active)
      )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold text-white">Service Packages & Dynamic Discounts</h3>
          <p className="text-xs text-slate-400">
            Define base prices, durations, promotional discounts, and packages for the Austin booking calculator.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {services.map(s => {
          const hasDiscount = Boolean(s.discount_active && s.discount_percentage > 0)
          const discountedPrice = hasDiscount
            ? calculateDiscountedBasePrice(s.base_price, s.discount_percentage, true)
            : s.base_price

          return (
            <div
              key={s.id}
              className={`glassmorphism p-5 rounded-2xl border transition flex flex-col justify-between ${
                hasDiscount
                  ? 'border-cyan-400/80 shadow-lg shadow-cyan-500/10'
                  : s.is_featured
                  ? 'border-brand-cyan/70 glow-effect-subtle'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-display text-base font-bold text-white">{s.name}</h4>
                    {s.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-cyan text-black uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-brand-cyan to-blue-500 text-black uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 stroke-[2.5]" />
                        {s.discount_percentage}% OFF PROMO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      type="button"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">
                  {s.description}
                </p>

                <div className="space-y-1.5 mb-4">
                  {(s.features || []).map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Check className="w-3 h-3 text-brand-cyan" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    {hasDiscount ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg font-bold text-brand-neon">
                          {formatCurrency(discountedPrice)}
                        </span>
                        <span className="line-through text-slate-500 text-xs">
                          {formatCurrency(s.base_price)}
                        </span>
                        <span className="text-slate-400 text-[11px]">~{s.duration_minutes} mins</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-display text-lg font-bold text-white">
                          {formatCurrency(s.base_price)}
                        </span>
                        <span className="text-slate-500 ml-2">~{s.duration_minutes} mins</span>
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {s.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Quick Discount Engine Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] gap-2">
                  <label className="text-slate-400 flex items-center gap-1.5 min-w-0">
                    <Percent className="w-3 h-3 text-brand-cyan shrink-0" />
                    <span>Discount</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      defaultValue={s.discount_percentage}
                      key={`${s.id}-pct-${s.discount_percentage}`}
                      onBlur={e => handleQuickDiscountPercent(s, e.target.value)}
                      className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-brand-cyan"
                    />
                    <span>% ({s.discount_active ? 'Active' : 'Off'})</span>
                  </label>
                  <button
                    type="button"
                    disabled={togglingDiscountId === s.id || s.discount_percentage <= 0}
                    onClick={() => handleQuickToggleDiscount(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      s.discount_percentage <= 0
                        ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        : s.discount_active
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-cyan-500/10 text-brand-cyan border border-brand-cyan/30 hover:bg-cyan-500/20'
                    }`}
                  >
                    {togglingDiscountId === s.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>{s.discount_active ? 'Deactivate Promo' : 'Enable Promo'}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit / Create Modal */}
      {isEditing && currentService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-lg glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-xl font-bold text-white">
                {currentService.id ? 'Edit Service Package & Promotion' : 'Create New Service Package'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                type="button"
                className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-5 space-y-3.5 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Complete Reset (In & Out)"
                  value={currentService.name || ''}
                  onChange={e => setCurrentService({ ...currentService, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={currentService.base_price ?? 99}
                    onChange={e =>
                      setCurrentService({ ...currentService, base_price: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    step="15"
                    min="15"
                    required
                    value={currentService.duration_minutes ?? 60}
                    onChange={e =>
                      setCurrentService({
                        ...currentService,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              {/* Dynamic Discount Engine Section */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-brand-neon" /> Promotional Discount Engine
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-brand-neon cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentService.discount_active)}
                      onChange={e =>
                        setCurrentService({ ...currentService, discount_active: e.target.checked })
                      }
                      className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                    />
                    <span className="font-semibold">Discount Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1 text-[11px]">
                      Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="e.g. 20"
                        value={currentService.discount_percentage ?? 0}
                        onChange={e =>
                          setCurrentService({
                            ...currentService,
                            discount_percentage: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-8 py-2 text-white focus:outline-none focus:border-brand-cyan"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
                    <span className="text-slate-400 block">Effective Base Rate:</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="font-bold text-brand-neon text-sm">
                        {formatCurrency(previewEffectiveBase)}
                      </span>
                      {Boolean(currentService.discount_active && (currentService.discount_percentage || 0) > 0) && (
                        <span className="line-through text-slate-500 text-[10px]">
                          {formatCurrency(Number(currentService.base_price) || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description displayed on website cards..."
                  value={currentService.description || ''}
                  onChange={e =>
                    setCurrentService({ ...currentService, description: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Features List (One feature per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Foam cannon pre-soak&#10;Wheel barrel iron removal&#10;Hydrophobic paint sealant"
                  value={featuresInput}
                  onChange={e => setFeaturesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentService.is_featured)}
                    onChange={e =>
                      setCurrentService({ ...currentService, is_featured: e.target.checked })
                    }
                    className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                  />
                  <span>Mark as Featured (Most Popular)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentService.is_active ?? true)}
                    onChange={e =>
                      setCurrentService({ ...currentService, is_active: e.target.checked })
                    }
                    className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                  />
                  <span>Active for Booking</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Package & Promotions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
