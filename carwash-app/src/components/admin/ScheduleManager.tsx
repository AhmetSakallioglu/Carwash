'use client'

import React, { useState } from 'react'
import { BusinessSchedule } from '@/types'
import { saveSchedulesAction } from '@/app/actions/admin'
import { Save, Check, Loader2, Clock } from 'lucide-react'

interface ScheduleManagerProps {
  initialSchedules: BusinessSchedule[]
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ScheduleManager({ initialSchedules }: ScheduleManagerProps) {
  // Ensure array has entries for 0-6
  const completeSchedules = Array.from({ length: 7 }, (_, i) => {
    const found = initialSchedules.find(s => s.day_of_week === i)
    return (
      found || {
        id: `sched_${i}`,
        day_of_week: i,
        is_open: i !== 0,
        open_time: '08:00',
        close_time: '18:00',
        created_at: new Date().toISOString(),
      }
    )
  })

  const [schedules, setSchedules] = useState<BusinessSchedule[]>(completeSchedules)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleToggleOpen = (dayIndex: number) => {
    setSchedules(prev =>
      prev.map(s => (s.day_of_week === dayIndex ? { ...s, is_open: !s.is_open } : s))
    )
    setSaveSuccess(false)
  }

  const handleTimeChange = (
    dayIndex: number,
    field: 'open_time' | 'close_time',
    value: string
  ) => {
    setSchedules(prev =>
      prev.map(s => (s.day_of_week === dayIndex ? { ...s, [field]: value } : s))
    )
    setSaveSuccess(false)
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const result = await saveSchedulesAction(schedules)
      if (result.success && result.data) {
        setSchedules(result.data)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setErrorMessage(result.error || 'Failed to save schedules')
      }
    } catch {
      setErrorMessage('Connection error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="glassmorphism rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-neon shrink-0" /> Daily Operating Hours
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure weekly business hours for dynamic slot generation in Austin, TX.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 w-full sm:w-auto shrink-0"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saveSuccess ? 'Saved!' : 'Save Hours'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {schedules.map(schedule => {
          const dayName = DAY_NAMES[schedule.day_of_week]
          const isOpen = schedule.is_open

          return (
            <div
              key={schedule.day_of_week}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition ${
                isOpen
                  ? 'bg-slate-900/50 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {/* Day & Toggle */}
              <div className="flex items-center justify-between sm:justify-start gap-4 mb-3 sm:mb-0 w-full sm:w-44">
                <span className="font-semibold text-xs text-white">{dayName}</span>
                <button
                  type="button"
                  onClick={() => handleToggleOpen(schedule.day_of_week)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                    isOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {isOpen ? 'Open' : 'Closed'}
                </button>
              </div>

              {/* Time Inputs */}
              {isOpen ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <span className="text-slate-400 text-[11px] w-12 sm:w-auto">Opens:</span>
                    <input
                      type="time"
                      value={schedule.open_time.slice(0, 5)}
                      onChange={e =>
                        handleTimeChange(schedule.day_of_week, 'open_time', e.target.value)
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-cyan min-w-0"
                    />
                  </div>

                  <span className="text-slate-500 hidden sm:inline">—</span>

                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <span className="text-slate-400 text-[11px] w-12 sm:w-auto">Closes:</span>
                    <input
                      type="time"
                      value={schedule.close_time.slice(0, 5)}
                      onChange={e =>
                        handleTimeChange(schedule.day_of_week, 'close_time', e.target.value)
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-cyan min-w-0"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No slots available on this day</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
