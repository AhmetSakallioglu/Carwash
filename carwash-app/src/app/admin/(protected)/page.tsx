import { getAppointments } from '@/lib/supabase/queries'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const appointments = await getAppointments()
  return <AdminDashboardClient initialAppointments={appointments} />
}
