'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { getAppointments } from '@/lib/supabase/queries'
import { MOCK_APPOINTMENTS } from '@/lib/supabase/mock-data'
import { formatDateTimeCT } from '@/lib/utils'
import { sendBookingRescheduledSMS, sendBookingCancelledSMS } from '@/lib/twilio'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import {
  Addon,
  Appointment,
  BlackoutDate,
  BusinessSchedule,
  BusinessSettings,
  Service,
  VehicleCategory,
} from '@/types'

export type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

function revalidateAdmin() {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/services')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/settings')
}

function formatDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (message.toLowerCase().includes('fetch failed') || message.toLowerCase().includes('econn') || message.toLowerCase().includes('timed out')) {
    return 'Could not reach Supabase. Check your internet connection and that the project is not paused.'
  }
  return message
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function saveServiceAction(payload: Partial<Service> & { name: string }): Promise<ActionResult<Service>> {
  try {
    const supabase = createAdminClient()
    const slug = payload.slug || slugify(payload.name)
    const record = {
      name: payload.name,
      slug,
      description: payload.description || '',
      features: Array.isArray(payload.features) ? payload.features : [],
      base_price: Number(payload.base_price),
      duration_minutes: Number(payload.duration_minutes) || 60,
      is_featured: Boolean(payload.is_featured),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }

    if (payload.id) {
      const { data, error } = await supabase.from('services').update(record).eq('id', payload.id).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to update service' }
      revalidateAdmin()
      return { success: true, data: data as unknown as Service }
    }

    const { data, error } = await supabase.from('services').insert(record).select().single()
    if (error || !data) return { success: false, error: error?.message || 'Failed to create service' }
    revalidateAdmin()
    return { success: true, data: data as unknown as Service }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save service' }
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  try {
    const { error } = await createAdminClient().from('services').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete service' }
  }
}

export async function saveVehicleCategoryAction(
  payload: Partial<VehicleCategory> & { label: string }
): Promise<ActionResult<VehicleCategory>> {
  try {
    const supabase = createAdminClient()
    const record = {
      label: payload.label,
      multiplier: Number(payload.multiplier),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
    }

    if (payload.id) {
      const { data, error } = await supabase.from('vehicle_categories').update(record).eq('id', payload.id).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to update category' }
      revalidateAdmin()
      return { success: true, data: data as unknown as VehicleCategory }
    }

    const { data, error } = await supabase.from('vehicle_categories').insert(record).select().single()
    if (error || !data) return { success: false, error: error?.message || 'Failed to create category' }
    revalidateAdmin()
    return { success: true, data: data as unknown as VehicleCategory }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save category' }
  }
}

export async function deleteVehicleCategoryAction(id: string): Promise<ActionResult> {
  try {
    const { error } = await createAdminClient().from('vehicle_categories').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete category' }
  }
}

export async function saveAddonAction(payload: Partial<Addon> & { name: string }): Promise<ActionResult<Addon>> {
  try {
    const supabase = createAdminClient()
    const record = {
      name: payload.name,
      price: Number(payload.price),
      duration_minutes: Number(payload.duration_minutes) || 30,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
    }

    if (payload.id) {
      const { data, error } = await supabase.from('addons').update(record).eq('id', payload.id).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to update add-on' }
      revalidateAdmin()
      return { success: true, data: data as unknown as Addon }
    }

    const { data, error } = await supabase.from('addons').insert(record).select().single()
    if (error || !data) return { success: false, error: error?.message || 'Failed to create add-on' }
    revalidateAdmin()
    return { success: true, data: data as unknown as Addon }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save add-on' }
  }
}

export async function deleteAddonAction(id: string): Promise<ActionResult> {
  try {
    const { error } = await createAdminClient().from('addons').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete add-on' }
  }
}

// ---------------------------------------------------------------------------
// Hours / blackouts / settings
// ---------------------------------------------------------------------------

export async function saveSchedulesAction(
  schedules: Array<{ day_of_week: number; is_open: boolean; open_time: string; close_time: string }>
): Promise<ActionResult<BusinessSchedule[]>> {
  try {
    const supabase = createAdminClient()
    for (const item of schedules) {
      await supabase.from('business_schedules').upsert(
        {
          day_of_week: item.day_of_week,
          is_open: Boolean(item.is_open),
          open_time: item.open_time,
          close_time: item.close_time,
        },
        { onConflict: 'day_of_week' }
      )
    }

    const { data, error } = await supabase
      .from('business_schedules')
      .select('*')
      .order('day_of_week', { ascending: true })

    if (error) return { success: false, error: error.message }
    revalidateAdmin()
    return { success: true, data: (data || []) as unknown as BusinessSchedule[] }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save schedules' }
  }
}

export async function saveSettingsAction(payload: Partial<BusinessSettings>): Promise<ActionResult<BusinessSettings>> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase keys are missing in .env.local' }
    }

    const supabase = createAdminClient()
    const { data: existing } = await supabase.from('business_settings').select('id').limit(1).maybeSingle()

    const record = {
      id: payload.id || existing?.id || '00000000-0000-0000-0000-000000000001',
      business_name: payload.business_name,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      timezone: payload.timezone || 'America/Chicago',
      slot_interval_minutes: payload.slot_interval_minutes
        ? Number(payload.slot_interval_minutes)
        : 30,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('business_settings')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to save settings' }
    }

    revalidateAdmin()
    return { success: true, data: data as unknown as BusinessSettings }
  } catch (err) {
    return { success: false, error: formatDbError(err) }
  }
}

export async function createBlackoutAction(payload: {
  title: string
  start_datetime: string
  end_datetime: string
  is_full_day: boolean
}): Promise<ActionResult<BlackoutDate>> {
  try {
    const { data, error } = await createAdminClient()
      .from('blackout_dates')
      .insert({
        title: payload.title,
        start_datetime: payload.start_datetime,
        end_datetime: payload.end_datetime,
        is_full_day: payload.is_full_day,
      })
      .select()
      .single()

    if (error || !data) return { success: false, error: error?.message || 'Failed to create blackout' }
    revalidateAdmin()
    return { success: true, data: data as unknown as BlackoutDate }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create blackout' }
  }
}

export async function deleteBlackoutAction(id: string): Promise<ActionResult> {
  try {
    const { error } = await createAdminClient().from('blackout_dates').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete blackout' }
  }
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function loadAppointmentsAction(): Promise<ActionResult<Appointment[]>> {
  try {
    const appointments = await getAppointments()
    return { success: true, data: appointments }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load appointments', data: MOCK_APPOINTMENTS }
  }
}

export async function updateAppointmentAction(
  id: string,
  body: Partial<Appointment>
): Promise<ActionResult<Appointment>> {
  try {
    const isLiveDb = isSupabaseConfigured()
    let currentAppointment: Appointment | null = null

    if (isLiveDb) {
      const { data } = await createAdminClient()
        .from('appointments')
        .select(`*, service:services(*), vehicle_category:vehicle_categories(*)`)
        .eq('id', id)
        .single()
      currentAppointment = data as unknown as Appointment
    } else {
      currentAppointment = MOCK_APPOINTMENTS.find(a => a.id === id) || null
    }

    if (!currentAppointment) {
      return { success: false, error: 'Appointment not found' }
    }

    const wasRescheduled = Boolean(body.start_time && body.start_time !== currentAppointment.start_time)
    const wasCancelled = body.status === 'cancelled' && currentAppointment.status !== 'cancelled'

    const updatePayload = {
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
      const { data, error } = await createAdminClient()
        .from('appointments')
        .update(updatePayload as never)
        .eq('id', id)
        .select(`*, service:services(*), vehicle_category:vehicle_categories(*)`)
        .single()

      if (error || !data) return { success: false, error: error?.message || 'Update failed' }
      updatedRecord = data as unknown as Appointment
    } else {
      Object.assign(currentAppointment, updatePayload)
      updatedRecord = { ...currentAppointment }
    }

    const serviceName = updatedRecord.service?.name || 'Detailing Service'
    const vehicleLabel = updatedRecord.vehicle_category?.label || 'Vehicle'

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

    revalidateAdmin()
    return { success: true, data: updatedRecord }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update appointment' }
  }
}

export async function deleteAppointmentAction(id: string): Promise<ActionResult> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      const { data: apt } = await supabase.from('appointments').select('google_event_id').eq('id', id).single()
      if (apt?.google_event_id) {
        await deleteCalendarEvent(apt.google_event_id).catch(() => {})
      }
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
    } else {
      const idx = MOCK_APPOINTMENTS.findIndex(a => a.id === id)
      if (idx !== -1) MOCK_APPOINTMENTS.splice(idx, 1)
    }

    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete appointment' }
  }
}
