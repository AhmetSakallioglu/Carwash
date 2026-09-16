'use client'

import React, { useState } from 'react'
import { VehicleCategory } from '@/types'
import { saveVehicleCategoryAction, deleteVehicleCategoryAction } from '@/app/actions/admin'
import { Plus, Edit2, Trash2, X, Loader2, Car } from 'lucide-react'

interface VehiclesManagerProps {
  initialCategories: VehicleCategory[]
}

export function VehiclesManager({ initialCategories }: VehiclesManagerProps) {
  const [categories, setCategories] = useState<VehicleCategory[]>(initialCategories)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCat, setCurrentCat] = useState<Partial<VehicleCategory> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setCurrentCat({
      label: '',
      multiplier: 1.0,
      is_active: true,
      sort_order: categories.length + 1,
    })
    setIsEditing(true)
  }

  const handleOpenEdit = (cat: VehicleCategory) => {
    setCurrentCat(cat)
    setIsEditing(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCat) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const isNew = !currentCat.id
      const result = await saveVehicleCategoryAction({
        ...currentCat,
        label: currentCat.label || '',
      })

      if (result.success && result.data) {
        if (isNew) {
          setCategories([...categories, result.data])
        } else {
          setCategories(categories.map(c => (c.id === result.data!.id ? result.data! : c)))
        }
        setIsEditing(false)
      } else {
        setErrorMessage(result.error || 'Failed to save vehicle category')
      }
    } catch {
      setErrorMessage('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle category?')) return

    try {
      const result = await deleteVehicleCategoryAction(id)
      if (result.success) {
        setCategories(categories.filter(c => c.id !== id))
      } else {
        alert(result.error || 'Failed to delete category')
      }
    } catch {
      alert('Error deleting category')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold text-white">Vehicle Category Multipliers</h3>
          <p className="text-xs text-slate-400">
            Control dynamic vehicle size multipliers applied to base detailing prices.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="glassmorphism p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-brand-neon flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    type="button"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    type="button"
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-display text-base font-bold text-white mb-1">{cat.label}</h4>
              <div className="text-2xl font-bold text-brand-neon font-display">
                {cat.multiplier}x
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {cat.multiplier === 1 ? 'Standard rate (100%)' : `+${Math.round((cat.multiplier - 1) * 100)}% surcharge`}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 mt-4 flex justify-between items-center text-xs">
              <span className="text-slate-500">Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  cat.is_active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {cat.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isEditing && currentCat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-md glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[96dvh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-xl font-bold text-white">
                {currentCat.id ? 'Edit Vehicle Category' : 'New Vehicle Category'}
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
                <label className="block font-semibold text-slate-300 mb-1">Category Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-SUV / Crossover"
                  value={currentCat.label || ''}
                  onChange={e => setCurrentCat({ ...currentCat, label: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Pricing Multiplier * (e.g. 1.0, 1.2, 1.4)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="5.0"
                  required
                  value={currentCat.multiplier ?? 1.0}
                  onChange={e =>
                    setCurrentCat({ ...currentCat, multiplier: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={Boolean(currentCat.is_active ?? true)}
                  onChange={e => setCurrentCat({ ...currentCat, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                />
                <span>Active in Price Calculator</span>
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
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
