'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Appointment, TimeSlot, SlotsApiResponse } from '@/types'
import { formatDateTimeCT } from '@/lib/utils'
import { updateAppointmentAction } from '@/app/actions/admin'
import { X, Calendar, RotateCcw, AlertCircle, Loader2 } from 'lucide-react'
import { DatePickerCalendar, toISODate } from '@/components/DatePickerCalendar'

interface AppointmentRescheduleModalProps {
  appointment: Appointment | null
  onClose: () => void
  onSuccess: () => void
}

export function AppointmentRescheduleModal({
  appointment,
  onClose,
  onSuccess,
}: AppointmentRescheduleModalProps) {
  const todayStr = toISODate(new Date())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlotIso, setSelectedSlotIso] = useState('')
  const [selectedSlotEndIso, setSelectedSlotEndIso] = useState('')
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchSlots = useCallback(async (date: string, serviceId?: string, addonIds?: string[]) => {
    if (!date) return
    setIsLoadingSlots(true)
    setErrorMessage(null)
    try {
      const addonQuery = (addonIds || []).join(',')
      const res = await fetch(`/api/slots?date=${date}&serviceId=${serviceId || ''}&addonIds=${addonQuery}`)
      const data: SlotsApiResponse = await res.json()
      if (data.success) {
        setSlots(data.slots)
        if (data.slots.length > 0) {
          setSelectedSlotIso(data.slots[0].startIso)
          setSelectedSlotEndIso(data.slots[0].endIso)
        } else {
          setSelectedSlotIso('')
          setSelectedSlotEndIso('')
        }
      }
    } catch {
      setErrorMessage('Error loading slots for this date')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (appointment && selectedDate) {
      const addonIds = (appointment.selected_addons || []).map(a => a.id)
      fetchSlots(selectedDate, appointment.service_id, addonIds)
    }
  }, [appointment, selectedDate, fetchSlots])

  const handleSlotChange = (startIso: string) => {
    setSelectedSlotIso(startIso)
    const slotObj = slots.find(s => s.startIso === startIso)
    if (slotObj) {
      setSelectedSlotEndIso(slotObj.endIso)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !selectedSlotIso) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await updateAppointmentAction(appointment.id, {
        start_time: selectedSlotIso,
        end_time: selectedSlotEndIso,
        status: 'confirmed',
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setErrorMessage(result.error || 'Failed to reschedule appointment')
      }
    } catch {
      setErrorMessage('Server connection error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!appointment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-md glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
              <RotateCcw className="w-3.5 h-3.5" /> Appointment Reschedule
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              Reschedule {appointment.appointment_code}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400">Customer: <strong className="text-white">{appointment.customer_name}</strong></div>
            <div className="text-slate-400">Current Time: <span className="text-amber-300 font-medium">{formatDateTimeCT(appointment.start_time)}</span></div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-2">
              New Date *
            </label>
            <DatePickerCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={todayStr}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>New Available Slot *</span>
              {isLoadingSlots && <Loader2 className="w-3 h-3 animate-spin text-brand-cyan" />}
            </label>

            {isLoadingSlots ? (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 text-xs flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking slot availability...
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((s, idx) => {
                  const active = s.startIso === selectedSlotIso
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotChange(s.startIso)}
                      className={`px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-brand-cyan text-black border-brand-cyan'
                          : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-brand-cyan/50'
                      }`}
                    >
                      {s.time}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="w-full bg-slate-950/80 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-amber-300 text-xs">
                No slots available on this date.
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Note: Updating will automatically trigger an SMS notification to the customer and update the Google Calendar event.
          </p>

          <div className="pt-3 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlotIso}
              className={`px-5 py-2 text-black font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer ${
                isSubmitting || !selectedSlotIso
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-neon hover:bg-cyan-300'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rescheduling...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm Reschedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
