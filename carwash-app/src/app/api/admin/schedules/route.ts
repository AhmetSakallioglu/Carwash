import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_SCHEDULES } from '@/lib/supabase/mock-data'

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('business_schedules')
          .select('*')
          .order('day_of_week', { ascending: true })

        if (error || !data || data.length === 0) {
          return NextResponse.json({ schedules: MOCK_SCHEDULES })
        }
        return NextResponse.json({ schedules: data })
      } catch {
        return NextResponse.json({ schedules: MOCK_SCHEDULES })
      }
    }

    return NextResponse.json({ schedules: MOCK_SCHEDULES })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching schedules'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { schedules } = body // Array of { day_of_week, is_open, open_time, close_time }
    const isLiveDb = isSupabaseConfigured()

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: 'Expected an array of schedules' }, { status: 400 })
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      for (const item of schedules) {
        await supabase
          .from('business_schedules')
          .upsert(
            {
              day_of_week: item.day_of_week,
              is_open: Boolean(item.is_open),
              open_time: item.open_time,
              close_time: item.close_time,
            },
            { onConflict: 'day_of_week' }
          )
      }

      const { data } = await supabase
        .from('business_schedules')
        .select('*')
        .order('day_of_week', { ascending: true })

      return NextResponse.json({ schedules: data })
    }

    schedules.forEach(item => {
      const s = MOCK_SCHEDULES.find(sc => sc.day_of_week === item.day_of_week)
      if (s) {
        s.is_open = Boolean(item.is_open)
        s.open_time = item.open_time
        s.close_time = item.close_time
      }
    })

    return NextResponse.json({ schedules: MOCK_SCHEDULES })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating schedules'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
