import { getServices, getVehicleCategories, getAddons } from '@/lib/supabase/queries'
import { LandingPageClient } from '@/components/LandingPageClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [services, categories, addons] = await Promise.all([
    getServices(),
    getVehicleCategories(),
    getAddons(),
  ])

  return <LandingPageClient services={services} categories={categories} addons={addons} />
}
