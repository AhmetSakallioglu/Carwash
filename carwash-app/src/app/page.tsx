import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_SERVICES, MOCK_VEHICLE_CATEGORIES, MOCK_ADDONS } from '@/lib/supabase/mock-data'
import { LandingPageClient } from '@/components/LandingPageClient'
import { Service, VehicleCategory, Addon } from '@/types'

export const revalidate = 0 // Always fetch fresh dynamic pricing data

export default async function HomePage() {
  let services: Service[] = MOCK_SERVICES
  let categories: VehicleCategory[] = MOCK_VEHICLE_CATEGORIES
  let addons: Addon[] = MOCK_ADDONS

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      const [servicesRes, categoriesRes, addonsRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('vehicle_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('addons').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])

      if (servicesRes.data && servicesRes.data.length > 0) {
        services = servicesRes.data as unknown as Service[]
      }
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        categories = categoriesRes.data as unknown as VehicleCategory[]
      }
      if (addonsRes.data && addonsRes.data.length > 0) {
        addons = addonsRes.data as unknown as Addon[]
      }
    } catch (err) {
      console.warn('[Supabase Fetch Warning, using fallback data]:', err)
    }
  }

  return <LandingPageClient services={services} categories={categories} addons={addons} />
}
