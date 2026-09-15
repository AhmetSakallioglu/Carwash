'use client'

import React, { useState } from 'react'
import { Service } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit2, Trash2, Check, Sparkles, X, Loader2 } from 'lucide-react'

interface ServicesManagerProps {
  initialServices: Service[]
}

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [isEditing, setIsEditing] = useState(false)
  const [currentService, setCurrentService] = useState<Partial<Service> | null>(null)
  const [featuresInput, setFeaturesInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setCurrentService({
      name: '',
      slug: '',
      description: '',
      features: [],
      base_price: 99,
      duration_minutes: 60,
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
    }

    try {
      const isNew = !currentService.id
      const url = isNew ? '/api/admin/services' : `/api/admin/services/${currentService.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.service) {
        if (isNew) {
          setServices([...services, data.service])
        } else {
          setServices(services.map(s => (s.id === data.service.id ? data.service : s)))
        }
        setIsEditing(false)
      } else {
        setErrorMessage(data.error || 'Failed to save service')
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
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setServices(services.filter(s => s.id !== id))
      } else {
        alert(data.error || 'Failed to delete service')
      }
    } catch {
      alert('Error deleting service')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-white">Service Packages</h3>
          <p className="text-xs text-slate-400">
            Define base prices and packages for the Austin booking calculator.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {services.map(s => (
          <div
            key={s.id}
            className={`glassmorphism p-5 rounded-2xl border transition flex flex-col justify-between ${
              s.is_featured ? 'border-brand-cyan/70 glow-effect-subtle' : 'border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-base font-bold text-white">{s.name}</h4>
                  {s.is_featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-cyan text-black uppercase tracking-wider">
                      Featured
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

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-display text-lg font-bold text-white">
                  {formatCurrency(s.base_price)}
                </span>
                <span className="text-slate-500 ml-2">~{s.duration_minutes} mins</span>
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
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isEditing && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg glassmorphism bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-xl font-bold text-white">
                {currentService.id ? 'Edit Service Package' : 'Create New Service'}
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
                  <span>Save Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
