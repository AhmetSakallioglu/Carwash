import { getServices, getVehicleCategories, getAddons } from '@/lib/supabase/queries'
import { AdminServicesClient } from '@/components/admin/AdminServicesClient'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const [services, categories, addons] = await Promise.all([
    getServices(),
    getVehicleCategories(),
    getAddons(),
  ])

  return <AdminServicesClient services={services} categories={categories} addons={addons} />
}
