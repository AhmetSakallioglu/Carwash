'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import {
  getAppointments,
  getGalleryItems,
  getLocationZones,
  getBusinessSettings,
} from '@/lib/supabase/queries'
import {
  MOCK_APPOINTMENTS,
  MOCK_SERVICES,
  MOCK_GALLERY_ITEMS,
  MOCK_LOCATION_ZONES,
  MOCK_VEHICLE_CATEGORIES,
  MOCK_ADDONS,
} from '@/lib/supabase/mock-data'
import { formatDateTimeCT } from '@/lib/utils'
import { normalizeBusinessSettings } from '@/lib/settings'
import { sendBookingRescheduledSMS, sendBookingCancelledSMS } from '@/lib/twilio'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import {
  Addon,
  Appointment,
  BlackoutDate,
  BusinessSchedule,
  BusinessSettings,
  GalleryItem,
  LocationZone,
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
  revalidatePath('/admin/gallery')
  revalidatePath('/admin/locations')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/settings')
}

function formatDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (
    message.toLowerCase().includes('fetch failed') ||
    message.toLowerCase().includes('econn') ||
    message.toLowerCase().includes('timed out')
  ) {
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
// Services & Discounts
// ---------------------------------------------------------------------------

export async function saveServiceAction(
  payload: Partial<Service> & { name: string }
): Promise<ActionResult<Service>> {
  try {
    const slug = payload.slug || slugify(payload.name)
    const record = {
      name: payload.name,
      slug,
      description: payload.description || '',
      features: Array.isArray(payload.features) ? payload.features : [],
      base_price: Number(payload.base_price),
      duration_minutes: Number(payload.duration_minutes) || 60,
      discount_percentage: Math.min(100, Math.max(0, Number(payload.discount_percentage) || 0)),
      discount_active: Boolean(payload.discount_active),
      is_featured: Boolean(payload.is_featured),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      if (payload.id) {
        const { data, error } = await supabase
          .from('services')
          .update(record)
          .eq('id', payload.id)
          .select()
          .single()
        if (error || !data) return { success: false, error: error?.message || 'Failed to update service' }
        revalidateAdmin()
        return { success: true, data: data as unknown as Service }
      }

      const { data, error } = await supabase.from('services').insert(record).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to create service' }
      revalidateAdmin()
      return { success: true, data: data as unknown as Service }
    } else {
      // Mock Data persistence fallback
      if (payload.id) {
        const idx = MOCK_SERVICES.findIndex(s => s.id === payload.id)
        if (idx !== -1) {
          MOCK_SERVICES[idx] = { ...MOCK_SERVICES[idx], ...record }
          revalidateAdmin()
          return { success: true, data: MOCK_SERVICES[idx] }
        }
      }
      const newService: Service = {
        id: `mock_svc_${Date.now()}`,
        ...record,
        created_at: new Date().toISOString(),
      }
      MOCK_SERVICES.push(newService)
      revalidateAdmin()
      return { success: true, data: newService }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save service' }
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await createAdminClient().from('services').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
    } else {
      const idx = MOCK_SERVICES.findIndex(s => s.id === id)
      if (idx !== -1) MOCK_SERVICES.splice(idx, 1)
    }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete service' }
  }
}

// ---------------------------------------------------------------------------
// Vehicle Categories
// ---------------------------------------------------------------------------

export async function saveVehicleCategoryAction(
  payload: Partial<VehicleCategory> & { label: string }
): Promise<ActionResult<VehicleCategory>> {
  try {
    const record = {
      label: payload.label,
      multiplier: Number(payload.multiplier),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      if (payload.id) {
        const { data, error } = await supabase
          .from('vehicle_categories')
          .update(record)
          .eq('id', payload.id)
          .select()
          .single()
        if (error || !data) return { success: false, error: error?.message || 'Failed to update category' }
        revalidateAdmin()
        return { success: true, data: data as unknown as VehicleCategory }
      }

      const { data, error } = await supabase.from('vehicle_categories').insert(record).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to create category' }
      revalidateAdmin()
      return { success: true, data: data as unknown as VehicleCategory }
    } else {
      if (payload.id) {
        const idx = MOCK_VEHICLE_CATEGORIES.findIndex(c => c.id === payload.id)
        if (idx !== -1) {
          MOCK_VEHICLE_CATEGORIES[idx] = { ...MOCK_VEHICLE_CATEGORIES[idx], ...record }
          revalidateAdmin()
          return { success: true, data: MOCK_VEHICLE_CATEGORIES[idx] }
        }
      }
      const newCat: VehicleCategory = {
        id: `mock_cat_${Date.now()}`,
        ...record,
        created_at: new Date().toISOString(),
      }
      MOCK_VEHICLE_CATEGORIES.push(newCat)
      revalidateAdmin()
      return { success: true, data: newCat }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save category' }
  }
}

export async function deleteVehicleCategoryAction(id: string): Promise<ActionResult> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await createAdminClient().from('vehicle_categories').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
    } else {
      const idx = MOCK_VEHICLE_CATEGORIES.findIndex(c => c.id === id)
      if (idx !== -1) MOCK_VEHICLE_CATEGORIES.splice(idx, 1)
    }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete category' }
  }
}

// ---------------------------------------------------------------------------
// Addons
// ---------------------------------------------------------------------------

export async function saveAddonAction(
  payload: Partial<Addon> & { name: string }
): Promise<ActionResult<Addon>> {
  try {
    const record = {
      name: payload.name,
      price: Number(payload.price),
      duration_minutes: Number(payload.duration_minutes) || 30,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      if (payload.id) {
        const { data, error } = await supabase
          .from('addons')
          .update(record)
          .eq('id', payload.id)
          .select()
          .single()
        if (error || !data) return { success: false, error: error?.message || 'Failed to update add-on' }
        revalidateAdmin()
        return { success: true, data: data as unknown as Addon }
      }

      const { data, error } = await supabase.from('addons').insert(record).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to create add-on' }
      revalidateAdmin()
      return { success: true, data: data as unknown as Addon }
    } else {
      if (payload.id) {
        const idx = MOCK_ADDONS.findIndex(a => a.id === payload.id)
        if (idx !== -1) {
          MOCK_ADDONS[idx] = { ...MOCK_ADDONS[idx], ...record }
          revalidateAdmin()
          return { success: true, data: MOCK_ADDONS[idx] }
        }
      }
      const newAddon: Addon = {
        id: `mock_addon_${Date.now()}`,
        ...record,
        created_at: new Date().toISOString(),
      }
      MOCK_ADDONS.push(newAddon)
      revalidateAdmin()
      return { success: true, data: newAddon }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save add-on' }
  }
}

export async function deleteAddonAction(id: string): Promise<ActionResult> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await createAdminClient().from('addons').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
    } else {
      const idx = MOCK_ADDONS.findIndex(a => a.id === id)
      if (idx !== -1) MOCK_ADDONS.splice(idx, 1)
    }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete add-on' }
  }
}

// ---------------------------------------------------------------------------
// Dynamic Gallery Management
// ---------------------------------------------------------------------------

export async function loadGalleryItemsAction(): Promise<ActionResult<GalleryItem[]>> {
  try {
    const items = await getGalleryItems()
    return { success: true, data: items }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load gallery', data: MOCK_GALLERY_ITEMS }
  }
}

export async function saveGalleryItemAction(
  payload: Partial<GalleryItem> & { title: string; image_url: string; category: string }
): Promise<ActionResult<GalleryItem>> {
  try {
    const record = {
      title: payload.title.trim(),
      category: payload.category.trim(),
      image_url: payload.image_url.trim(),
      before_image_url: payload.before_image_url ? payload.before_image_url.trim() : null,
      sort_order: Number(payload.sort_order) || 0,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      if (payload.id) {
        const { data, error } = await supabase
          .from('gallery_items')
          .update(record)
          .eq('id', payload.id)
          .select()
          .single()
        if (error || !data) return { success: false, error: error?.message || 'Failed to update gallery item' }
        revalidateAdmin()
        return { success: true, data: data as unknown as GalleryItem }
      }

      const { data, error } = await supabase.from('gallery_items').insert(record).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to create gallery item' }
      revalidateAdmin()
      return { success: true, data: data as unknown as GalleryItem }
    } else {
      if (payload.id) {
        const idx = MOCK_GALLERY_ITEMS.findIndex(g => g.id === payload.id)
        if (idx !== -1) {
          MOCK_GALLERY_ITEMS[idx] = { ...MOCK_GALLERY_ITEMS[idx], ...record }
          revalidateAdmin()
          return { success: true, data: MOCK_GALLERY_ITEMS[idx] }
        }
      }
      const newItem: GalleryItem = {
        id: `mock_gal_${Date.now()}`,
        ...record,
        created_at: new Date().toISOString(),
      }
      MOCK_GALLERY_ITEMS.push(newItem)
      revalidateAdmin()
      return { success: true, data: newItem }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save gallery item' }
  }
}

export async function deleteGalleryItemAction(id: string): Promise<ActionResult> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await createAdminClient().from('gallery_items').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
    } else {
      const idx = MOCK_GALLERY_ITEMS.findIndex(g => g.id === id)
      if (idx !== -1) MOCK_GALLERY_ITEMS.splice(idx, 1)
    }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete gallery item' }
  }
}

export async function reorderGalleryItemAction(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult<GalleryItem[]>> {
  try {
    const items = (await getGalleryItems()).slice().sort((a, b) => a.sort_order - b.sort_order)
    const index = items.findIndex(item => item.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    if (index < 0 || swapIndex < 0 || swapIndex >= items.length) {
      return { success: true, data: items }
    }

    const current = items[index]
    const neighbor = items[swapIndex]
    const currentOrder = current.sort_order
    const neighborOrder = neighbor.sort_order

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      const { error: firstError } = await supabase
        .from('gallery_items')
        .update({ sort_order: neighborOrder } as never)
        .eq('id', current.id)
      if (firstError) return { success: false, error: firstError.message }

      const { error: secondError } = await supabase
        .from('gallery_items')
        .update({ sort_order: currentOrder } as never)
        .eq('id', neighbor.id)
      if (secondError) return { success: false, error: secondError.message }
    } else {
      current.sort_order = neighborOrder
      neighbor.sort_order = currentOrder
    }

    revalidateAdmin()
    const updated = (await getGalleryItems()).slice().sort((a, b) => a.sort_order - b.sort_order)
    return { success: true, data: updated }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to reorder gallery item' }
  }
}

// ---------------------------------------------------------------------------
// Location Zones & Travel Fees
// ---------------------------------------------------------------------------

export async function loadLocationZonesAction(): Promise<ActionResult<LocationZone[]>> {
  try {
    const zones = await getLocationZones()
    return { success: true, data: zones }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load location zones', data: MOCK_LOCATION_ZONES }
  }
}

export async function saveLocationZoneAction(
  payload: Partial<LocationZone> & { zone_name: string }
): Promise<ActionResult<LocationZone>> {
  try {
    const zipCodesArray = Array.isArray(payload.zip_codes)
      ? payload.zip_codes
      : typeof payload.zip_codes === 'string'
      ? (payload.zip_codes as string).split(',').map(s => s.trim()).filter(Boolean)
      : []

    const record = {
      zone_name: payload.zone_name.trim(),
      zip_codes: zipCodesArray,
      travel_fee: Math.max(0, Number(payload.travel_fee) || 0),
      travel_time_minutes: Math.max(0, Number(payload.travel_time_minutes) || 0),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      sort_order: Number(payload.sort_order) || 0,
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient()
      if (payload.id) {
        const { data, error } = await supabase
          .from('location_zones')
          .update(record)
          .eq('id', payload.id)
          .select()
          .single()
        if (error || !data) return { success: false, error: error?.message || 'Failed to update location zone' }
        revalidateAdmin()
        return { success: true, data: data as unknown as LocationZone }
      }

      const { data, error } = await supabase.from('location_zones').insert(record).select().single()
      if (error || !data) return { success: false, error: error?.message || 'Failed to create location zone' }
      revalidateAdmin()
      return { success: true, data: data as unknown as LocationZone }
    } else {
      if (payload.id) {
        const idx = MOCK_LOCATION_ZONES.findIndex(z => z.id === payload.id)
        if (idx !== -1) {
          MOCK_LOCATION_ZONES[idx] = { ...MOCK_LOCATION_ZONES[idx], ...record }
          revalidateAdmin()
          return { success: true, data: MOCK_LOCATION_ZONES[idx] }
        }
      }
      const newZone: LocationZone = {
        id: `mock_zone_${Date.now()}`,
        ...record,
        created_at: new Date().toISOString(),
      }
      MOCK_LOCATION_ZONES.push(newZone)
      revalidateAdmin()
      return { success: true, data: newZone }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save location zone' }
  }
}

export async function deleteLocationZoneAction(id: string): Promise<ActionResult> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await createAdminClient().from('location_zones').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
    } else {
      const idx = MOCK_LOCATION_ZONES.findIndex(z => z.id === id)
      if (idx !== -1) MOCK_LOCATION_ZONES.splice(idx, 1)
    }
    revalidateAdmin()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete location zone' }
  }
}

// ---------------------------------------------------------------------------
// Hours / Blackouts / Settings
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
      tagline: payload.tagline,
      show_google_reviews:
        payload.show_google_reviews === undefined ? true : Boolean(payload.show_google_reviews),
      google_place_id: payload.google_place_id || '',
      hero_vehicles_count:
        payload.hero_vehicles_count === undefined || payload.hero_vehicles_count === null
          ? 250
          : Number(payload.hero_vehicles_count),
      hero_rating_override:
        payload.hero_rating_override === undefined || payload.hero_rating_override === null
          ? null
          : Number(payload.hero_rating_override),
      hero_review_count_override:
        payload.hero_review_count_override === undefined || payload.hero_review_count_override === null
          ? null
          : Number(payload.hero_review_count_override),
      hero_stat_3_value: payload.hero_stat_3_value,
      hero_stat_3_label: payload.hero_stat_3_label,
      hero_stat_4_value: payload.hero_stat_4_value,
      hero_stat_4_label: payload.hero_stat_4_label,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('business_settings')
      .upsert(record as never, { onConflict: 'id' })
      .select()
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to save settings' }
    }

    revalidateAdmin()
    return { success: true, data: normalizeBusinessSettings(data as unknown as BusinessSettings) }
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
        .select(`*, service:services(*), vehicle_category:vehicle_categories(*), location_zone:location_zones(*)`)
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
      ...(body.travel_fee !== undefined && { travel_fee: Number(body.travel_fee) }),
      ...(body.travel_time_minutes !== undefined && { travel_time_minutes: Number(body.travel_time_minutes) }),
      ...(body.location_zone_id !== undefined && { location_zone_id: body.location_zone_id }),
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
        .select(`*, service:services(*), vehicle_category:vehicle_categories(*), location_zone:location_zones(*)`)
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

    const settings = await getBusinessSettings()

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
        businessName: settings.business_name,
        businessPhone: settings.phone,
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
        businessName: settings.business_name,
        businessPhone: settings.phone,
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
