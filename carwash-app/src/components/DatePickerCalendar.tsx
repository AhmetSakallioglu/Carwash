'use client'

import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatReadableDate(value: string): string {
  if (!value) return ''
  return parseISODate(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function buildMonthCells(viewDate: Date): Array<Date | null> {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const leading = first.getDay()
  const cells: Array<Date | null> = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

interface DatePickerCalendarProps {
  value: string
  onChange: (isoDate: string) => void
  minDate?: string
  accent?: 'cyan' | 'rose'
}

export function DatePickerCalendar({
  value,
  onChange,
  minDate,
  accent = 'cyan',
}: DatePickerCalendarProps) {
  const today = toISODate(new Date())
  const [viewMonth, setViewMonth] = useState(() => (value ? parseISODate(value) : new Date()))
  const monthCells = useMemo(() => buildMonthCells(viewMonth), [viewMonth])
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const tomorrow = toISODate(addDays(new Date(), 1))

  const selectedClass =
    accent === 'rose'
      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
      : 'bg-brand-cyan text-black shadow-lg shadow-cyan-500/20'
  const todayClass =
    accent === 'rose'
      ? 'border border-rose-400/50 text-rose-200'
      : 'border border-brand-cyan/50 text-brand-neon'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (minDate && today < minDate) return
            onChange(today)
            setViewMonth(new Date())
          }}
          className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(tomorrow)
            setViewMonth(addDays(new Date(), 1))
          }}
          className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs cursor-pointer"
        >
          Tomorrow
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="font-display font-bold text-white text-sm">{monthLabel}</div>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-[10px] uppercase tracking-wider text-slate-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthCells.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} />
            const iso = toISODate(date)
            const disabled = Boolean(minDate && iso < minDate)
            const selected = iso === value
            const isToday = iso === today

            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => onChange(iso)}
                className={`h-9 rounded-lg text-xs font-semibold transition ${
                  disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : selected
                      ? `${selectedClass} cursor-pointer`
                      : isToday
                        ? `${todayClass} hover:bg-slate-800 cursor-pointer`
                        : 'text-slate-300 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      {value && (
        <div className="text-[11px] text-slate-400">
          Selected: <span className="text-white font-semibold">{formatReadableDate(value)}</span>
        </div>
      )}
    </div>
  )
}
