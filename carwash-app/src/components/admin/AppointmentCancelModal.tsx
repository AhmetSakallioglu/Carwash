'use client'

import React, { useState } from 'react'
import { Appointment } from '@/types'
import { updateAppointmentAction } from '@/app/actions/admin'
import { X, Ban, AlertTriangle, Loader2 } from 'lucide-react'

interface AppointmentCancelModalProps {
  appointment: Appointment | null
  onClose: () => void
  onSuccess: () => void
}

export function AppointmentCancelModal({
  appointment,
  onClose,
  onSuccess,
}: AppointmentCancelModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await updateAppointmentAction(appointment.id, {
        status: 'cancelled',
        cancellation_reason: reason.trim() || 'Cancelled by administrator',
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setErrorMessage(result.error || 'Failed to cancel appointment')
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
            <div className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Ban className="w-3.5 h-3.5" /> Cancel Reservation
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              Cancel {appointment.appointment_code}
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
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Confirm Cancellation
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              This will mark appointment <strong>{appointment.appointment_code}</strong> for{' '}
              <strong>{appointment.customer_name}</strong> as cancelled, free up the calendar slot, and dispatch an automated cancellation SMS.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Customer request, weather conditions, emergency scheduling conflict..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500 transition resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className={`px-5 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer ${
                isSubmitting || !reason.trim()
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirm Cancellation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
