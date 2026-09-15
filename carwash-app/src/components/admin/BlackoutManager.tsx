'use client'

import React, { useState } from 'react'
import { BlackoutDate } from '@/types'
import { formatDateTimeCT } from '@/lib/utils'
import { Plus, Trash2, CalendarOff, X, Loader2 } from 'lucide-react'

interface BlackoutManagerProps {
  initialBlackouts: BlackoutDate[]
}

export function BlackoutManager({ initialBlackouts }: BlackoutManagerProps) {
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>(initialBlackouts)
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isFullDay, setIsFullDay] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const startIso = isFullDay ? `${startDate}T00:00:00Z` : new Date(startDate).toISOString()
    const endIso = isFullDay ? `${endDate || startDate}T23:59:59Z` : new Date(endDate).toISOString()

    try {
      const res = await fetch('/api/admin/blackout-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          start_datetime: startIso,
          end_datetime: endIso,
          is_full_day: isFullDay,
        }),
      })

      const data = await res.json()
      if (data.blackout_date) {
        setBlackouts([...blackouts, data.blackout_date])
        setIsAdding(false)
        setTitle('')
        setStartDate('')
        setEndDate('')
      } else {
        setErrorMessage(data.error || 'Failed to create blackout date')
      }
    } catch {
      setErrorMessage('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blackout date / time off period?')) return

    try {
      const res = await fetch(`/api/admin/blackout-dates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setBlackouts(blackouts.filter(b => b.id !== id))
      } else {
        alert(data.error || 'Failed to delete')
      }
    } catch {
      alert('Error deleting blackout date')
    }
  }

  return (
    <div className="glassmorphism rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-rose-400" /> Blackout Dates & Holidays
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Block specific days or time windows so customers cannot schedule bookings.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Block Date / Time
        </button>
      </div>

      <div className="space-y-3">
        {blackouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">
            No active blackout dates or holiday blocks configured.
          </div>
        ) : (
          blackouts.map(b => (
            <div
              key={b.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{b.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {b.is_full_day ? 'Full Day Block' : 'Custom Window'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1">
                  {formatDateTimeCT(b.start_datetime)} — {formatDateTimeCT(b.end_datetime)}
                </div>
              </div>

              <button
                onClick={() => handleDelete(b.id)}
                type="button"
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                title="Remove Block"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md glassmorphism bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-xl font-bold text-white">Add Blackout Period</h3>
              <button
                onClick={() => setIsAdding(false)}
                type="button"
                className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="py-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Reason / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labor Day Holiday / Shop Maintenance"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isFullDay}
                  onChange={e => setIsFullDay(e.target.checked)}
                  className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                />
                <span>Full Day Block</span>
              </label>

              {isFullDay ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Blackout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
