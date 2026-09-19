export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          features: string[]
          base_price: number
          duration_minutes: number
          pricing_matrix: Json
          discount_percentage: number
          discount_active: boolean
          is_featured: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description: string
          features?: string[]
          base_price: number
          duration_minutes?: number
          pricing_matrix?: Json
          discount_percentage?: number
          discount_active?: boolean
          is_featured?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          features?: string[]
          base_price?: number
          duration_minutes?: number
          pricing_matrix?: Json
          discount_percentage?: number
          discount_active?: boolean
          is_featured?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_categories: {
        Row: {
          id: string
          label: string
          size_key: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          size_key?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          size_key?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      addons: {
        Row: {
          id: string
          name: string
          price: number
          duration_minutes: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          duration_minutes?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          duration_minutes?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      gallery_items: {
        Row: {
          id: string
          title: string
          category: string
          image_url: string
          before_image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          category: string
          image_url: string
          before_image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          image_url?: string
          before_image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      location_zones: {
        Row: {
          id: string
          zone_name: string
          zip_codes: string[]
          travel_fee: number
          travel_time_minutes: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          zone_name: string
          zip_codes?: string[]
          travel_fee?: number
          travel_time_minutes?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          zone_name?: string
          zip_codes?: string[]
          travel_fee?: number
          travel_time_minutes?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      business_settings: {
        Row: {
          id: string
          business_name: string
          address: string
          phone: string
          email: string
          timezone: string
          slot_interval_minutes: number
          tagline: string
          show_google_reviews: boolean
          google_place_id: string
          hero_vehicles_count: number
          hero_rating_override: number | null
          hero_review_count_override: number | null
          hero_stat_3_value: string
          hero_stat_3_label: string
          hero_stat_4_value: string
          hero_stat_4_label: string
          show_before_after: boolean
          before_after_before_image_url: string
          before_after_after_image_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name?: string
          address?: string
          phone?: string
          email?: string
          timezone?: string
          slot_interval_minutes?: number
          tagline?: string
          show_google_reviews?: boolean
          google_place_id?: string
          hero_vehicles_count?: number
          hero_rating_override?: number | null
          hero_review_count_override?: number | null
          hero_stat_3_value?: string
          hero_stat_3_label?: string
          hero_stat_4_value?: string
          hero_stat_4_label?: string
          show_before_after?: boolean
          before_after_before_image_url?: string
          before_after_after_image_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          address?: string
          phone?: string
          email?: string
          timezone?: string
          slot_interval_minutes?: number
          tagline?: string
          show_google_reviews?: boolean
          google_place_id?: string
          hero_vehicles_count?: number
          hero_rating_override?: number | null
          hero_review_count_override?: number | null
          hero_stat_3_value?: string
          hero_stat_3_label?: string
          hero_stat_4_value?: string
          hero_stat_4_label?: string
          show_before_after?: boolean
          before_after_before_image_url?: string
          before_after_after_image_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_schedules: {
        Row: {
          id: string
          day_of_week: number
          is_open: boolean
          open_time: string
          close_time: string
          created_at: string
        }
        Insert: {
          id?: string
          day_of_week: number
          is_open?: boolean
          open_time?: string
          close_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          day_of_week?: number
          is_open?: boolean
          open_time?: string
          close_time?: string
          created_at?: string
        }
      }
      blackout_dates: {
        Row: {
          id: string
          title: string
          start_datetime: string
          end_datetime: string
          is_full_day: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          start_datetime: string
          end_datetime: string
          is_full_day?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_datetime?: string
          end_datetime?: string
          is_full_day?: boolean
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          appointment_code: string
          customer_name: string
          customer_phone: string
          customer_address: string
          vehicle_details: string
          service_id: string
          vehicle_category_id: string
          location_zone_id: string | null
          selected_addons: Json
          travel_fee: number
          travel_time_minutes: number
          total_price: number
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          cancellation_reason: string | null
          google_event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_code: string
          customer_name: string
          customer_phone: string
          customer_address: string
          vehicle_details: string
          service_id: string
          vehicle_category_id: string
          location_zone_id?: string | null
          selected_addons?: Json
          travel_fee?: number
          travel_time_minutes?: number
          total_price: number
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          cancellation_reason?: string | null
          google_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_code?: string
          customer_name?: string
          customer_phone?: string
          customer_address?: string
          vehicle_details?: string
          service_id?: string
          vehicle_category_id?: string
          location_zone_id?: string | null
          selected_addons?: Json
          travel_fee?: number
          travel_time_minutes?: number
          total_price?: number
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          cancellation_reason?: string | null
          google_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
