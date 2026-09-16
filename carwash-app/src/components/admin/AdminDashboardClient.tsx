'use client'

import React, { useMemo, useState } from 'react'
import { Appointment } from '@/types'
import { AppointmentsList } from '@/components/admin/AppointmentsList'
import { AppointmentCalendar } from '@/components/admin/AppointmentCalendar'
import { AppointmentDetailsModal } from '@/components/admin/AppointmentDetailsModal'
import { AppointmentRescheduleModal } from '@/components/admin/AppointmentRescheduleModal'
import { AppointmentCancelModal } from '@/components/admin/AppointmentCancelModal'
import {
  deleteAppointmentAction,
  loadAppointmentsAction,
  updateAppointmentAction,
} from '@/app/actions/admin'
import { List, Calendar as CalendarIcon, RefreshCw, Loader2 } from 'lucide-react'

interface AdminDashboardClientProps {
  initialAppointments: Appointment[]
}

export function AdminDashboardClient({ initialAppointments }: AdminDashboardClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null)
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null)

  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return appointments.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (!term) return true
      return (
        a.customer_name.toLowerCase().includes(term) ||
        a.customer_phone.includes(term) ||
        a.appointment_code.toLowerCase().includes(term)
      )
    })
  }, [appointments, searchTerm, statusFilter])

  const refreshAppointments = async () => {
    setIsLoading(true)
    try {
      const result = await loadAppointmentsAction()
      if (result.data) setAppointments(result.data)
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    const result = await updateAppointmentAction(appointmentId, { status: newStatus })
    if (result.success && result.data) {
      setAppointments(prev => prev.map(a => (a.id === appointmentId ? result.data! : a)))
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(result.data)
      }
    }
  }

  const handleDelete = async (appointmentId: string) => {
    const result = await deleteAppointmentAction(appointmentId)
    if (result.success) {
      setAppointments(prev => prev.filter(a => a.id !== appointmentId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Appointments & Schedule</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Austin studio bookings, customer requests, and Google Calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAppointments}
            disabled={isLoading}
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh Appointments"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('list')}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-brand-cyan text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-brand-cyan text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-neon mb-3" />
          <span className="text-xs text-slate-400">Loading Austin schedule data...</span>
        </div>
      ) : viewMode === 'list' ? (
        <AppointmentsList
          appointments={filteredAppointments}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectAppointment={setSelectedAppointment}
          onReschedule={setRescheduleAppointment}
          onCancel={setCancelAppointment}
          onMarkCompleted={id => handleStatusChange(id, 'completed')}
        />
      ) : (
        <AppointmentCalendar
          appointments={filteredAppointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onReschedule={apt => {
          setSelectedAppointment(null)
          setRescheduleAppointment(apt)
        }}
        onCancelBooking={apt => {
          setSelectedAppointment(null)
          setCancelAppointment(apt)
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />

      <AppointmentRescheduleModal
        appointment={rescheduleAppointment}
        onClose={() => setRescheduleAppointment(null)}
        onSuccess={refreshAppointments}
      />

      <AppointmentCancelModal
        appointment={cancelAppointment}
        onClose={() => setCancelAppointment(null)}
        onSuccess={refreshAppointments}
      />
    </div>
  )
}
