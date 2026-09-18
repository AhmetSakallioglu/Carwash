import { getLocationZones } from '@/lib/supabase/queries'
import { LocationsManager } from '@/components/admin/LocationsManager'

export const dynamic = 'force-dynamic'

export default async function AdminLocationsPage() {
  const zones = await getLocationZones()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Service Areas & Travel Engine</h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust Greater Austin zone fees and transit buffers. These values feed live pricing and reserved slot duration.
        </p>
      </div>

      <LocationsManager initialZones={zones} />
    </div>
  )
}
