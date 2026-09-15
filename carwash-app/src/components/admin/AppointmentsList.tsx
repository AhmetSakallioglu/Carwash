'use client'

import React from 'react'
import { Appointment } from '@/types'
import { formatCurrency, formatDateTimeCT } from '@/lib/utils'
import {
  Search,
  Filter,
  Eye,
  RotateCcw,
  Ban,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  Car,
} from 'lucide-react'

interface AppointmentsListProps {
  appointments: Appointment[]
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onSelectAppointment: (appointment: Appointment) => void
  onReschedule: (appointment: Appointment) => void
  onCancel: (appointment: Appointment) => void
  onMarkCompleted: (appointmentId: string) => void
}

export function AppointmentsList({
  appointments,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectAppointment,
  onReschedule,
  onCancel,
  onMarkCompleted,
}: AppointmentsListProps) {
  // Metrics calculation
  const totalRevenue = appointments
    .filter(a => a.status !== 'cancelled')
    .reduce((acc, a) => acc + Number(a.total_price), 0)

  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length
  const completedCount = appointments.filter(a => a.status === 'completed').length
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Confirmed
          </span>
        )
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-brand-neon border border-brand-cyan/30">
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glassmorphism p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Value</span>
            <DollarSign className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Non-cancelled bookings</div>
        </div>

        <div className="glassmorphism p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Confirmed</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display text-2xl font-bold text-emerald-400">
            {confirmedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Upcoming detailing slots</div>
        </div>

        <div className="glassmorphism p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-brand-neon" />
          </div>
          <div className="font-display text-2xl font-bold text-brand-neon">
            {completedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Finished services</div>
        </div>

        <div className="glassmorphism p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cancelled</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-display text-2xl font-bold text-rose-400">
            {cancelledCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Cancelled reservations</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, code..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan transition cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="glassmorphism rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Customer & Phone</th>
                <th className="px-5 py-3.5">Date & Time (CT)</th>
                <th className="px-5 py-3.5">Service & Vehicle</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-brand-cyan" />
                    No appointments match your filters.
                  </td>
                </tr>
              ) : (
                appointments.map(apt => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => onSelectAppointment(apt)}
                  >
                    <td className="px-5 py-4 font-mono font-bold text-brand-neon">
                      {apt.appointment_code}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{apt.customer_name}</div>
                      <div className="text-slate-400 text-[11px]">{apt.customer_phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white font-medium">
                        {formatDateTimeCT(apt.start_time)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-200 font-medium truncate max-w-[200px]">
                        {apt.service?.name || 'Detailing Package'}
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[180px]">{apt.vehicle_details}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      {formatCurrency(apt.total_price)}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(apt.status)}</td>
                    <td
                      className="px-5 py-4 text-right space-x-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectAppointment(apt)}
                        type="button"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {apt.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => onReschedule(apt)}
                            type="button"
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-brand-neon border border-cyan-500/30 transition"
                            title="Reschedule"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onCancel(apt)}
                            type="button"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                            title="Cancel Booking"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => onMarkCompleted(apt.id)}
                          type="button"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                          title="Mark Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
