'use client'

import React, { useState } from 'react'
import { Appointment } from '@/types'
import { formatTimeOnlyCT, formatCurrency } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onSelectAppointment: (appointment: Appointment) => void
}

export function AppointmentCalendar({
  appointments,
  onSelectAppointment,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Generate 7 days of the current week (starting Sunday or Monday)
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // Sunday

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const todayWeek = () => {
    setCurrentDate(new Date())
  }

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(a => a.start_time.startsWith(dateStr))
  }

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="glassmorphism rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl min-w-0">
      {/* Calendar Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-brand-neon flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Austin Schedule View</h3>
            <span className="text-xs text-brand-cyan font-semibold">{monthYearLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={todayWeek}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={prevWeek}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextWeek}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="mt-6 -mx-1 overflow-x-auto pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 min-w-0 lg:min-w-[840px]">
        {weekDays.map((day, idx) => {
          const dayApts = getAppointmentsForDay(day)
          const isToday = day.toDateString() === new Date().toDateString()
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
          const dayNum = day.getDate()

          return (
            <div
              key={idx}
              className={`rounded-2xl p-3.5 border min-h-[220px] flex flex-col justify-start transition ${
                isToday
                  ? 'bg-cyan-500/10 border-brand-cyan/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {dayName}
                </span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday ? 'bg-brand-neon text-black' : 'text-white'
                  }`}
                >
                  {dayNum}
                </span>
              </div>

              {/* Day Appointments Chips */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {dayApts.length === 0 ? (
                  <div className="text-[11px] text-slate-600 italic py-4 text-center">
                    No bookings
                  </div>
                ) : (
                  dayApts.map(apt => {
                    const isCancelled = apt.status === 'cancelled'
                    const isCompleted = apt.status === 'completed'

                    return (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => onSelectAppointment(apt)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition cursor-pointer border select-none ${
                          isCancelled
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 opacity-60 line-through'
                            : isCompleted
                            ? 'bg-cyan-500/10 border-brand-cyan/30 text-brand-neon'
                            : 'bg-slate-900 border-slate-700 hover:border-brand-cyan text-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-mono font-bold text-brand-cyan">
                            {apt.appointment_code}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeOnlyCT(apt.start_time)}
                          </span>
                        </div>
                        <div className="font-semibold truncate text-[11px] text-white">
                          {apt.customer_name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {apt.service?.name || 'Detailing'}
                        </div>
                        <div className="text-[10px] font-bold text-brand-neon mt-1">
                          {formatCurrency(apt.total_price)}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
