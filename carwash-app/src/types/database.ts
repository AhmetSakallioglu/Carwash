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
          multiplier: number
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          multiplier?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          multiplier?: number
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
      business_settings: {
        Row: {
          id: string
          business_name: string
          address: string
          phone: string
          email: string
          timezone: string
          slot_interval_minutes: number
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
          selected_addons: Json
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
          selected_addons?: Json
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
          selected_addons?: Json
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
