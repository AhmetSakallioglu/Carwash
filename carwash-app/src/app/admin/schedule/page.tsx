import { getBusinessSchedules, getBlackoutDates } from '@/lib/supabase/queries'
import { ScheduleManager } from '@/components/admin/ScheduleManager'
import { BlackoutManager } from '@/components/admin/BlackoutManager'

export const dynamic = 'force-dynamic'

export default async function AdminSchedulePage() {
  const [schedules, blackouts] = await Promise.all([
    getBusinessSchedules(),
    getBlackoutDates(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Hours & Blackout Schedule</h1>
        <p className="text-xs text-slate-400 mt-1">
          Control when OZER Studio accepts appointments and block off holidays or maintenance days.
        </p>
      </div>

      <div className="space-y-8">
        <ScheduleManager initialSchedules={schedules} />
        <BlackoutManager initialBlackouts={blackouts} />
      </div>
    </div>
  )
}
