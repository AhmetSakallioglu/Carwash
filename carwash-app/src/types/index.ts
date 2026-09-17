import { Database } from './database'

export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

export type VehicleCategory = Database['public']['Tables']['vehicle_categories']['Row']
export type VehicleCategoryInsert = Database['public']['Tables']['vehicle_categories']['Insert']
export type VehicleCategoryUpdate = Database['public']['Tables']['vehicle_categories']['Update']

export type Addon = Database['public']['Tables']['addons']['Row']
export type AddonInsert = Database['public']['Tables']['addons']['Insert']
export type AddonUpdate = Database['public']['Tables']['addons']['Update']

export type GalleryItem = Database['public']['Tables']['gallery_items']['Row']
export type GalleryItemInsert = Database['public']['Tables']['gallery_items']['Insert']
export type GalleryItemUpdate = Database['public']['Tables']['gallery_items']['Update']

export type LocationZone = Database['public']['Tables']['location_zones']['Row']
export type LocationZoneInsert = Database['public']['Tables']['location_zones']['Insert']
export type LocationZoneUpdate = Database['public']['Tables']['location_zones']['Update']

export type BusinessSettings = Database['public']['Tables']['business_settings']['Row']
export type BusinessSettingsUpdate = Database['public']['Tables']['business_settings']['Update']

export type BusinessSchedule = Database['public']['Tables']['business_schedules']['Row']
export type BusinessScheduleUpdate = Database['public']['Tables']['business_schedules']['Update']

export type BlackoutDate = Database['public']['Tables']['blackout_dates']['Row']
export type BlackoutDateInsert = Database['public']['Tables']['blackout_dates']['Insert']

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface SelectedAddon {
  id: string
  name: string
  price: number
  duration_minutes: number
}

export interface Appointment {
  id: string
  appointment_code: string
  customer_name: string
  customer_phone: string
  customer_address: string
  vehicle_details: string
  service_id: string
  vehicle_category_id: string
  location_zone_id?: string | null
  selected_addons: SelectedAddon[]
  travel_fee: number
  travel_time_minutes: number
  total_price: number
  start_time: string
  end_time: string
  status: AppointmentStatus
  cancellation_reason?: string | null
  google_event_id?: string | null
  created_at: string
  updated_at: string
  // Joined relations
  service?: Service
  vehicle_category?: VehicleCategory
  location_zone?: LocationZone
}

export interface TimeSlot {
  time: string // "09:00 AM"
  startIso: string // "2026-09-17T09:00:00-05:00"
  endIso: string // "2026-09-17T11:30:00-05:00"
  available: boolean
}

export interface BookingSubmissionPayload {
  website_trap?: string // Honeypot
  customer_name: string
  customer_phone: string
  customer_address: string
  zip_code?: string
  vehicle_details: string
  service_id: string
  vehicle_category_id: string
  location_zone_id?: string
  travel_fee?: number
  travel_time_minutes?: number
  selected_addon_ids: string[]
  start_time: string // ISO string
}

export interface BookingResponse {
  success: boolean
  appointment?: Appointment
  error?: string
}

export interface SlotsApiResponse {
  success: boolean
  date: string
  isOpen: boolean
  message?: string
  totalDurationMinutes: number
  travelTimeMinutes?: number
  slots: TimeSlot[]
}

export interface GoogleReview {
  author_name: string
  profile_photo_url: string | null
  rating: number
  relative_time_description: string
  text: string
}

export interface GoogleReviewsResponse {
  success: boolean
  enabled: boolean
  rating: number | null
  total_reviews: number | null
  reviews: GoogleReview[]
  place_url: string | null
  error?: string
}
