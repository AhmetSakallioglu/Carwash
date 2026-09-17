'use client'

import React, { useState } from 'react'
import { LocationZone } from '@/types'
import { saveLocationZoneAction, deleteLocationZoneAction } from '@/app/actions/admin'
import { Plus, Edit2, Trash2, MapPin, X, Loader2, Clock, DollarSign, Navigation } from 'lucide-react'

interface LocationsManagerProps {
  initialZones: LocationZone[]
}

function zipCodesToInput(zipCodes: string[] | undefined): string {
  return (zipCodes || []).join(', ')
}

function parseZipCodes(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map(zip => zip.trim())
    .filter(Boolean)
}

export function LocationsManager({ initialZones }: LocationsManagerProps) {
  const [zones, setZones] = useState<LocationZone[]>(initialZones)
  const [isEditing, setIsEditing] = useState(false)
  const [currentZone, setCurrentZone] = useState<(Partial<LocationZone> & { zip_codes_input?: string }) | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleOpenNew = () => {
    setCurrentZone({
      zone_name: '',
      zip_codes: [],
      zip_codes_input: '',
      travel_fee: 0,
      travel_time_minutes: 30,
      is_active: true,
      sort_order: zones.length + 1,
    })
    setErrorMessage(null)
    setIsEditing(true)
  }

  const handleOpenEdit = (zone: LocationZone) => {
    setCurrentZone({
      ...zone,
      zip_codes_input: zipCodesToInput(zone.zip_codes),
    })
    setErrorMessage(null)
    setIsEditing(true)
  }

  const persistZone = async (payload: Partial<LocationZone> & { zone_name: string }) => {
    const result = await saveLocationZoneAction(payload)
    if (result.success && result.data) {
      setZones(prev => {
        const exists = prev.some(z => z.id === result.data!.id)
        return exists
          ? prev.map(z => (z.id === result.data!.id ? result.data! : z))
          : [...prev, result.data!]
      })
    }
    return result
  }

  const handleQuickToggleActive = async (zone: LocationZone) => {
    setSavingId(zone.id)
    try {
      const result = await persistZone({
        ...zone,
        zone_name: zone.zone_name,
        is_active: !zone.is_active,
      })
      if (!result.success) {
        alert(result.error || 'Failed to update location zone')
      }
    } catch {
      alert('Error updating location zone')
    } finally {
      setSavingId(null)
    }
  }

  const handleQuickFieldSave = async (
    zone: LocationZone,
    field: 'travel_fee' | 'travel_time_minutes',
    value: number
  ) => {
    const nextValue = Math.max(0, Number(value) || 0)
    if (nextValue === Number(zone[field])) return

    setSavingId(zone.id)
    try {
      const result = await persistZone({
        ...zone,
        zone_name: zone.zone_name,
        [field]: nextValue,
      })
      if (!result.success) {
        alert(result.error || 'Failed to update location zone')
      }
    } catch {
      alert('Error updating location zone')
    } finally {
      setSavingId(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentZone || !currentZone.zone_name?.trim()) {
      setErrorMessage('Zone name is required.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const isNew = !currentZone.id
      const result = await persistZone({
        ...currentZone,
        zone_name: currentZone.zone_name.trim(),
        zip_codes: parseZipCodes(currentZone.zip_codes_input || ''),
        travel_fee: Math.max(0, Number(currentZone.travel_fee) || 0),
        travel_time_minutes: Math.max(0, Number(currentZone.travel_time_minutes) || 0),
      })

      if (result.success && result.data) {
        if (isNew) {
          setZones(prev => (prev.some(z => z.id === result.data!.id) ? prev : [...prev, result.data!]))
        }
        setIsEditing(false)
      } else {
        setErrorMessage(result.error || 'Failed to save location zone')
      }
    } catch {
      setErrorMessage('Connection error saving location zone')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service area zone? Existing bookings will keep their stored travel fee.')) return

    try {
      const result = await deleteLocationZoneAction(id)
      if (result.success) {
        setZones(zones.filter(z => z.id !== id))
      } else {
        alert(result.error || 'Failed to delete location zone')
      }
    } catch {
      alert('Error deleting location zone')
    }
  }

  const sortedZones = [...zones].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-white">Greater Austin Service Zones</h3>
          <p className="text-xs text-slate-400">
            Control travel fees and round-trip transit buffers used by the booking slot engine.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {sortedZones.map(zone => {
          const isSaving = savingId === zone.id
          return (
            <div
              key={zone.id}
              className={`glassmorphism p-5 rounded-2xl border transition flex flex-col justify-between ${
                zone.is_active ? 'border-slate-800 hover:border-brand-cyan/40' : 'border-slate-800/40 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-brand-neon flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display text-base font-bold text-white leading-snug">
                        {zone.zone_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Order #{zone.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(zone)}
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title="Edit Zone"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      type="button"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Covered zips:{' '}
                  <span className="text-slate-300">
                    {zone.zip_codes && zone.zip_codes.length > 0
                      ? zone.zip_codes.join(', ')
                      : 'Austin metro (custom coverage)'}
                  </span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      <DollarSign className="w-3 h-3 text-brand-cyan" /> Travel Fee
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={zone.travel_fee}
                        key={`${zone.id}-fee-${zone.travel_fee}`}
                        onBlur={e => handleQuickFieldSave(zone, 'travel_fee', Number(e.target.value))}
                        className="w-full bg-transparent text-sm font-bold text-brand-neon focus:outline-none"
                      />
                    </div>
                  </label>
                  <label className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      <Clock className="w-3 h-3 text-brand-cyan" /> Transit Buffer
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        defaultValue={zone.travel_time_minutes}
                        key={`${zone.id}-time-${zone.travel_time_minutes}`}
                        onBlur={e => handleQuickFieldSave(zone, 'travel_time_minutes', Number(e.target.value))}
                        className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                      />
                      <span className="text-slate-500 text-[10px] shrink-0">min</span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      zone.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {zone.is_active ? 'Active for booking' : 'Hidden'}
                  </span>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleQuickToggleActive(zone)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      zone.is_active
                        ? 'bg-slate-800 text-slate-300 hover:text-white'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                    {zone.is_active ? 'Disable Zone' : 'Enable Zone'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sortedZones.length === 0 && (
        <div className="glassmorphism rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          No service zones yet. Add Greater Austin coverage so the calculator can apply travel fees and slot buffers.
        </div>
      )}

      {isEditing && currentZone && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-lg glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-brand-neon flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  {currentZone.id ? 'Edit Service Zone' : 'Create Service Zone'}
                </h3>
              </div>
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
                <label className="block font-semibold text-slate-300 mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Georgetown / Buda / San Marcos"
                  value={currentZone.zone_name || ''}
                  onChange={e => setCurrentZone({ ...currentZone, zone_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Travel Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={currentZone.travel_fee ?? 0}
                    onChange={e =>
                      setCurrentZone({ ...currentZone, travel_fee: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Travel Time (min)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={currentZone.travel_time_minutes ?? 30}
                    onChange={e =>
                      setCurrentZone({ ...currentZone, travel_time_minutes: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Covered Zip Codes</label>
                <textarea
                  rows={3}
                  placeholder="78701, 78702, 78704"
                  value={currentZone.zip_codes_input || ''}
                  onChange={e => setCurrentZone({ ...currentZone, zip_codes_input: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Comma-separated Austin / Travis / Williamson County zip codes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={currentZone.sort_order ?? 1}
                    onChange={e =>
                      setCurrentZone({ ...currentZone, sort_order: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-5">
                  <input
                    type="checkbox"
                    checked={Boolean(currentZone.is_active ?? true)}
                    onChange={e =>
                      setCurrentZone({ ...currentZone, is_active: e.target.checked })
                    }
                    className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                  />
                  <span>Active for booking</span>
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
                  <span>Save Zone</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
