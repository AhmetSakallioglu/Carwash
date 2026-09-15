'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Appointment } from '@/types'
import { AppointmentsList } from '@/components/admin/AppointmentsList'
import { AppointmentCalendar } from '@/components/admin/AppointmentCalendar'
import { AppointmentDetailsModal } from '@/components/admin/AppointmentDetailsModal'
import { AppointmentRescheduleModal } from '@/components/admin/AppointmentRescheduleModal'
import { AppointmentCancelModal } from '@/components/admin/AppointmentCancelModal'
import { List, Calendar as CalendarIcon, RefreshCw, Loader2 } from 'lucide-react'

export default function AdminOverviewPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null)
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null)

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())

      const res = await fetch(`/api/admin/appointments?${params.toString()}`)
      const data = await res.json()
      if (data.appointments) {
        setAppointments(data.appointments)
      }
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchTerm])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        fetchAppointments()
        if (selectedAppointment && selectedAppointment.id === appointmentId) {
          setSelectedAppointment(data.appointment)
        }
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleDelete = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setAppointments(prev => prev.filter(a => a.id !== appointmentId))
      }
    } catch (err) {
      console.error('Error deleting appointment:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Appointments & Schedule</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Austin studio bookings, customer requests, and Google Calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={fetchAppointments}
            disabled={isLoading}
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh Appointments"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* View Mode Toggle */}
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
          appointments={appointments}
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
          appointments={appointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}

      {/* Appointment Modals */}
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
        onSuccess={() => {
          fetchAppointments()
        }}
      />

      <AppointmentCancelModal
        appointment={cancelAppointment}
        onClose={() => setCancelAppointment(null)}
        onSuccess={() => {
          fetchAppointments()
        }}
      />
    </div>
  )
}
