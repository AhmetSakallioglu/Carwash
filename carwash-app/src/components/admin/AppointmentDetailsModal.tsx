'use client'

import React from 'react'
import { Appointment } from '@/types'
import { formatCurrency, formatDateTimeCT, formatDurationMinutes } from '@/lib/utils'
import { getPackageSizeRate } from '@/lib/catalog'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Car,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Trash2,
  Layers,
} from 'lucide-react'

interface AppointmentDetailsModalProps {
  appointment: Appointment | null
  onClose: () => void
  onReschedule: (appointment: Appointment) => void
  onCancelBooking: (appointment: Appointment) => void
  onStatusChange: (appointmentId: string, newStatus: Appointment['status']) => void
  onDelete: (appointmentId: string) => void
}

export function AppointmentDetailsModal({
  appointment,
  onClose,
  onReschedule,
  onCancelBooking,
  onStatusChange,
  onDelete,
}: AppointmentDetailsModalProps) {
  if (!appointment) return null

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Confirmed
          </span>
        )
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-brand-neon border border-brand-cyan/30">
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-2xl glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-cyan-500/10 border border-brand-cyan/30 text-brand-neon">
                {appointment.appointment_code}
              </span>
              {getStatusBadge(appointment.status)}
            </div>
            <h3 className="font-display text-xl font-bold text-white mt-2">
              Appointment Details
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

        {/* Body Content */}
        <div className="py-6 space-y-6 text-xs">
          {/* Section 1: Customer & Vehicle Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer Info
              </h4>
              <div>
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium ml-2">{appointment.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>
                <a
                  href={`tel:${appointment.customer_phone.replace(/\D/g, '')}`}
                  className="text-brand-neon hover:underline ml-2"
                >
                  {appointment.customer_phone}
                </a>
              </div>
              <div className="flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-white leading-relaxed">{appointment.customer_address}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Vehicle Info
              </h4>
              <div>
                <span className="text-slate-400">Category:</span>
                <span className="text-white font-medium ml-2">
                  {appointment.vehicle_category?.label || 'Sedan / Coupe'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Vehicle:</span>
                <span className="text-white font-medium ml-2">{appointment.vehicle_details}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Schedule Window & Google Cal */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Schedule Window
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Start Time:</span>
                  <span className="text-white font-semibold">
                    {formatDateTimeCT(appointment.start_time)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated End:</span>
                  <span className="text-white font-semibold">
                    {formatDateTimeCT(appointment.end_time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Google Calendar Sync:</span>
              {appointment.google_event_id && !appointment.google_event_id.startsWith('mock_') ? (
                <span className="text-emerald-400 font-medium">
                  ✓ Synced ({appointment.google_event_id.slice(0, 14)}...)
                </span>
              ) : (
                <span className="text-amber-300 font-medium">Not synced</span>
              )}
            </div>
          </div>

          {/* Section 3: Service & Pricing Breakdown */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Service & Pricing Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">
                  {appointment.service?.name || 'Selected Detailing Package'}
                </span>
                <span className="text-slate-300">
                  {appointment.service
                    ? formatCurrency(getPackageSizeRate(appointment.service, appointment.vehicle_category).price)
                    : ''}
                </span>
              </div>

              {appointment.selected_addons && appointment.selected_addons.length > 0 && (
                <div className="pl-3 border-l-2 border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Selected Add-Ons:
                  </span>
                  {appointment.selected_addons.map((a, idx) => (
                    <div key={idx} className="flex justify-between text-slate-400">
                      <span>• {a.name}</span>
                      <span>+{formatCurrency(a.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {(appointment.location_zone || appointment.travel_fee > 0 || appointment.travel_time_minutes > 0) && (
                <div className="flex justify-between items-start gap-3">
                  <span className="text-slate-400">
                    {appointment.location_zone?.zone_name || 'Travel Zone'}
                    {appointment.travel_time_minutes > 0
                      ? ` (${appointment.travel_time_minutes}m buffer)`
                      : ''}
                  </span>
                  <span className="text-brand-neon font-semibold">
                    {appointment.travel_fee > 0 ? `+${formatCurrency(appointment.travel_fee)}` : '$0'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400">
                <span>Reserved calendar block:</span>
                <span className="text-white font-medium">
                  {formatDurationMinutes(
                    Math.round(
                      (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000
                    )
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Total Amount (Pay on-site):</span>
                <span className="text-brand-neon text-base">
                  {formatCurrency(appointment.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Notice if Cancelled */}
          {appointment.status === 'cancelled' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4" /> Cancellation Notice
              </div>
              <p className="text-rose-200/90">
                Reason: {appointment.cancellation_reason || 'No specific reason provided.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            {appointment.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => {
                    onClose()
                    onReschedule(appointment)
                  }}
                  type="button"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-brand-cyan" />
                  Reschedule
                </button>

                <button
                  onClick={() => {
                    onClose()
                    onCancelBooking(appointment)
                  }}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium transition cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Cancel Booking
                </button>
              </>
            )}

            {appointment.status === 'confirmed' && (
              <button
                onClick={() => onStatusChange(appointment.id, 'completed')}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-medium transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Completed
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (confirm(`Are you sure you want to permanently delete appointment ${appointment.appointment_code}?`)) {
                onDelete(appointment.id)
                onClose()
              }
            }}
            type="button"
            className="flex items-center gap-1 text-slate-500 hover:text-rose-400 p-2 transition cursor-pointer"
            title="Delete Appointment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
