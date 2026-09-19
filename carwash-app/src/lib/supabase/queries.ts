import { createAdminClient, isSupabaseConfigured } from './admin'
import {
  MOCK_SERVICES,
  MOCK_VEHICLE_CATEGORIES,
  MOCK_ADDONS,
  MOCK_GALLERY_ITEMS,
  MOCK_LOCATION_ZONES,
  MOCK_BUSINESS_SETTINGS,
  MOCK_SCHEDULES,
  MOCK_BLACKOUTS,
  MOCK_APPOINTMENTS,
} from './mock-data'
import { normalizeBusinessSettings, HOMEPAGE_BEFORE_AFTER_CATEGORY, businessSettingsHasBeforeAfterColumns, overlayBeforeAfterSettings } from '@/lib/settings'
import { hydrateService, hydrateVehicleCategory } from '@/lib/catalog'
import {
  Service,
  VehicleCategory,
  Addon,
  GalleryItem,
  LocationZone,
  BusinessSettings,
  BusinessSchedule,
  BlackoutDate,
  Appointment,
} from '@/types'

/**
 * Execute a promise with a safety timeout so it never hangs indefinitely
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<T>(resolve => {
    timer = setTimeout(() => {
      resolve(fallback)
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timer!)
    return result
  } catch (err) {
    clearTimeout(timer!)
    console.warn('[DB Query Timeout/Error fallback]:', err)
    return fallback
  }
}

export async function getServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) return MOCK_SERVICES

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('[getServices] Supabase error:', error.message)
        return MOCK_SERVICES
      }
      return (data || []).map(row => hydrateService(row as unknown as Service))
    })(),
    4000,
    MOCK_SERVICES
  )
}

export async function getVehicleCategories(): Promise<VehicleCategory[]> {
  if (!isSupabaseConfigured()) return MOCK_VEHICLE_CATEGORIES

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('[getVehicleCategories] Supabase error:', error.message)
        return MOCK_VEHICLE_CATEGORIES
      }
      return (data || []).map(row => hydrateVehicleCategory(row as unknown as VehicleCategory))
    })(),
    4000,
    MOCK_VEHICLE_CATEGORIES
  )
}

export async function getAddons(): Promise<Addon[]> {
  if (!isSupabaseConfigured()) return MOCK_ADDONS

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('[getAddons] Supabase error:', error.message)
        return MOCK_ADDONS
      }
      return (data || []) as unknown as Addon[]
    })(),
    4000,
    MOCK_ADDONS
  )
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured()) return MOCK_GALLERY_ITEMS

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('[getGalleryItems] Supabase error:', error.message)
        return MOCK_GALLERY_ITEMS
      }
      const items = (data && data.length > 0 ? data : MOCK_GALLERY_ITEMS) as unknown as GalleryItem[]
      return items.filter(item => item.category !== HOMEPAGE_BEFORE_AFTER_CATEGORY)
    })(),
    4000,
    MOCK_GALLERY_ITEMS
  )
}

export async function getLocationZones(): Promise<LocationZone[]> {
  if (!isSupabaseConfigured()) return MOCK_LOCATION_ZONES

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('location_zones')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        console.warn('[getLocationZones] Supabase error:', error.message)
        return MOCK_LOCATION_ZONES
      }
      return (data && data.length > 0 ? data : MOCK_LOCATION_ZONES) as unknown as LocationZone[]
    })(),
    4000,
    MOCK_LOCATION_ZONES
  )
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  if (!isSupabaseConfigured()) return normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS)

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single()

      if (error || !data) {
        return normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS)
      }

      const settings = normalizeBusinessSettings(data as unknown as BusinessSettings)
      if (businessSettingsHasBeforeAfterColumns(data as Record<string, unknown>)) {
        return settings
      }

      const { data: comparisonItem } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('category', HOMEPAGE_BEFORE_AFTER_CATEGORY)
        .limit(1)
        .maybeSingle()

      return overlayBeforeAfterSettings(settings, comparisonItem as GalleryItem | null)
    })(),
    4000,
    normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS)
  )
}

export async function getBusinessSchedules(): Promise<BusinessSchedule[]> {
  if (!isSupabaseConfigured()) return MOCK_SCHEDULES

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('business_schedules')
        .select('*')
        .order('day_of_week', { ascending: true })

      if (error) {
        console.warn('[getBusinessSchedules] Supabase error:', error.message)
        return MOCK_SCHEDULES
      }
      return (data && data.length > 0 ? data : MOCK_SCHEDULES) as unknown as BusinessSchedule[]
    })(),
    4000,
    MOCK_SCHEDULES
  )
}

export async function getBlackoutDates(): Promise<BlackoutDate[]> {
  if (!isSupabaseConfigured()) return MOCK_BLACKOUTS

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('blackout_dates')
        .select('*')
        .order('start_datetime', { ascending: true })

      if (error) {
        console.warn('[getBlackoutDates] Supabase error:', error.message)
        return []
      }
      return (data || []) as unknown as BlackoutDate[]
    })(),
    8000,
    []
  )
}

export async function getAppointments(filters?: {
  status?: string
  search?: string
  startDate?: string
  endDate?: string
}): Promise<Appointment[]> {
  if (!isSupabaseConfigured()) return MOCK_APPOINTMENTS

  return withTimeout(
    (async () => {
      const supabase = createAdminClient()
      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          vehicle_category:vehicle_categories(*),
          location_zone:location_zones(*)
        `)
        .order('start_time', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.startDate) {
        query = query.gte('start_time', `${filters.startDate}T00:00:00Z`)
      }

      if (filters?.endDate) {
        query = query.lte('start_time', `${filters.endDate}T23:59:59Z`)
      }

      if (filters?.search) {
        query = query.or(
          `customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,appointment_code.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) {
        console.warn('[getAppointments] Supabase error:', error.message)
        return MOCK_APPOINTMENTS
      }
      return (data || []) as unknown as Appointment[]
    })(),
    4000,
    MOCK_APPOINTMENTS
  )
}
