import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_APPOINTMENTS } from '@/lib/supabase/mock-data'
import { formatDateTimeCT } from '@/lib/utils'
import { sendBookingRescheduledSMS, sendBookingCancelledSMS } from '@/lib/twilio'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import { Appointment } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const isLiveDb = isSupabaseConfigured()

  if (isLiveDb) {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(*),
        vehicle_category:vehicle_categories(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({ appointment: data })
  } else {
    const found = MOCK_APPOINTMENTS.find(a => a.id === id)
    if (!found) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json({ appointment: found })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    let currentAppointment: Appointment | null = null

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          vehicle_category:vehicle_categories(*)
        `)
        .eq('id', id)
        .single()
      currentAppointment = data as unknown as Appointment
    } else {
      currentAppointment = MOCK_APPOINTMENTS.find(a => a.id === id) || null
    }

    if (!currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const wasRescheduled = body.start_time && body.start_time !== currentAppointment.start_time
    const wasCancelled = body.status === 'cancelled' && currentAppointment.status !== 'cancelled'

    const updatePayload: Partial<Appointment> = {
      ...(body.customer_name && { customer_name: body.customer_name }),
      ...(body.customer_phone && { customer_phone: body.customer_phone }),
      ...(body.customer_address && { customer_address: body.customer_address }),
      ...(body.vehicle_details && { vehicle_details: body.vehicle_details }),
      ...(body.total_price !== undefined && { total_price: Number(body.total_price) }),
      ...(body.start_time && { start_time: body.start_time }),
      ...(body.end_time && { end_time: body.end_time }),
      ...(body.status && { status: body.status }),
      ...(body.cancellation_reason !== undefined && { cancellation_reason: body.cancellation_reason }),
      updated_at: new Date().toISOString(),
    }

    let updatedRecord: Appointment

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('appointments')
        .update(updatePayload as never)
        .eq('id', id)
        .select(`
          *,
          service:services(*),
          vehicle_category:vehicle_categories(*)
        `)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
      }
      updatedRecord = data as unknown as Appointment
    } else {
      Object.assign(currentAppointment, updatePayload)
      updatedRecord = { ...currentAppointment }
    }

    const serviceName = updatedRecord.service?.name || 'Detailing Service'
    const vehicleLabel = updatedRecord.vehicle_category?.label || 'Vehicle'

    // 1. Handle Google Calendar Update / Delete
    if (updatedRecord.google_event_id) {
      if (wasCancelled) {
        await deleteCalendarEvent(updatedRecord.google_event_id).catch(() => {})
      } else if (wasRescheduled || body.customer_name || body.total_price) {
        await updateCalendarEvent(updatedRecord.google_event_id, {
          appointment: updatedRecord,
          serviceName,
          vehicleLabel,
        }).catch(() => {})
      }
    }

    // 2. Handle Twilio SMS Notifications
    if (wasCancelled) {
      await sendBookingCancelledSMS({
        customerName: updatedRecord.customer_name,
        customerPhone: updatedRecord.customer_phone,
        appointmentCode: updatedRecord.appointment_code,
        serviceName,
        dateTimeFormatted: formatDateTimeCT(updatedRecord.start_time),
        customerAddress: updatedRecord.customer_address,
        totalPrice: updatedRecord.total_price,
        cancellationReason: updatedRecord.cancellation_reason || undefined,
      }).catch(err => console.error('[Twilio Cancel Notification Error]:', err))
    } else if (wasRescheduled) {
      await sendBookingRescheduledSMS({
        customerName: updatedRecord.customer_name,
        customerPhone: updatedRecord.customer_phone,
        appointmentCode: updatedRecord.appointment_code,
        serviceName,
        dateTimeFormatted: formatDateTimeCT(updatedRecord.start_time),
        customerAddress: updatedRecord.customer_address,
        totalPrice: updatedRecord.total_price,
      }).catch(err => console.error('[Twilio Reschedule Notification Error]:', err))
    }

    return NextResponse.json({ success: true, appointment: updatedRecord })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating appointment'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data: apt } = await supabase.from('appointments').select('google_event_id').eq('id', id).single()
      if (apt?.google_event_id) {
        await deleteCalendarEvent(apt.google_event_id).catch(() => {})
      }

      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const idx = MOCK_APPOINTMENTS.findIndex(a => a.id === id)
      if (idx !== -1) {
        MOCK_APPOINTMENTS.splice(idx, 1)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting appointment'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
