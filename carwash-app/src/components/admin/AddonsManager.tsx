'use client'

import React, { useState } from 'react'
import { Addon } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit2, Trash2, X, Loader2, Sparkles } from 'lucide-react'

interface AddonsManagerProps {
  initialAddons: Addon[]
}

export function AddonsManager({ initialAddons }: AddonsManagerProps) {
  const [addons, setAddons] = useState<Addon[]>(initialAddons)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAddon, setCurrentAddon] = useState<Partial<Addon> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setCurrentAddon({
      name: '',
      price: 50,
      duration_minutes: 30,
      is_active: true,
      sort_order: addons.length + 1,
    })
    setIsEditing(true)
  }

  const handleOpenEdit = (addon: Addon) => {
    setCurrentAddon(addon)
    setIsEditing(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAddon) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const isNew = !currentAddon.id
      const url = isNew ? '/api/admin/addons' : `/api/admin/addons/${currentAddon.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentAddon),
      })

      const data = await res.json()
      if (data.addon) {
        if (isNew) {
          setAddons([...addons, data.addon])
        } else {
          setAddons(addons.map(a => (a.id === data.addon.id ? data.addon : a)))
        }
        setIsEditing(false)
      } else {
        setErrorMessage(data.error || 'Failed to save add-on')
      }
    } catch {
      setErrorMessage('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return

    try {
      const res = await fetch(`/api/admin/addons/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setAddons(addons.filter(a => a.id !== id))
      } else {
        alert(data.error || 'Failed to delete add-on')
      }
    } catch {
      alert('Error deleting add-on')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-white">Add-On Services</h3>
          <p className="text-xs text-slate-400">
            Configure optional upgrade add-ons for the Austin price builder.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Upgrade
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {addons.map(addon => (
          <div
            key={addon.id}
            className="glassmorphism p-4 rounded-2xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-brand-neon flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(addon)}
                    type="button"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(addon.id)}
                    type="button"
                    className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h4 className="font-display text-sm font-bold text-white mb-1">{addon.name}</h4>
              <div className="text-lg font-bold text-brand-neon font-display">
                +{formatCurrency(addon.price)}
              </div>
              <p className="text-[11px] text-slate-400">Adds ~{addon.duration_minutes} mins</p>
            </div>

            <div className="pt-3 border-t border-slate-800 mt-3 flex justify-between items-center text-xs">
              <span className="text-slate-500">Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  addon.is_active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {addon.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isEditing && currentAddon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md glassmorphism bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-xl font-bold text-white">
                {currentAddon.id ? 'Edit Add-On' : 'New Add-On Service'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                type="button"
                className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Add-On Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine Bay Detail & Dressing"
                  value={currentAddon.name || ''}
                  onChange={e => setCurrentAddon({ ...currentAddon, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={currentAddon.price ?? 50}
                    onChange={e =>
                      setCurrentAddon({ ...currentAddon, price: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration (Min) *</label>
                  <input
                    type="number"
                    step="15"
                    min="0"
                    required
                    value={currentAddon.duration_minutes ?? 30}
                    onChange={e =>
                      setCurrentAddon({
                        ...currentAddon,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={Boolean(currentAddon.is_active ?? true)}
                  onChange={e => setCurrentAddon({ ...currentAddon, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                />
                <span>Active for Customer Booking</span>
              </label>

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
                  <span>Save Add-On</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
