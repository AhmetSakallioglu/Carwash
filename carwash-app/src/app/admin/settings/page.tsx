import { getBusinessSettings } from '@/lib/supabase/queries'
import { BusinessSettingsManager } from '@/components/admin/BusinessSettingsManager'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Business Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Update contact info, hero stats, Google reviews, and time slot intervals.
        </p>
      </div>

      <BusinessSettingsManager initialSettings={settings} />
    </div>
  )
}
