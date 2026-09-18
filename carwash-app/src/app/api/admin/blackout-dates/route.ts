import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_BLACKOUTS } from '@/lib/supabase/mock-data'
import { BlackoutDate } from '@/types'

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('blackout_dates')
          .select('*')
          .order('start_datetime', { ascending: true })

        if (error || !data) {
          return NextResponse.json({ blackout_dates: MOCK_BLACKOUTS })
        }
        return NextResponse.json({ blackout_dates: data })
      } catch {
        return NextResponse.json({ blackout_dates: MOCK_BLACKOUTS })
      }
    }

    return NextResponse.json({ blackout_dates: MOCK_BLACKOUTS })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching blackout dates'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    if (!body.title || !body.start_datetime || !body.end_datetime) {
      return NextResponse.json({ error: 'Title, start date, and end date are required' }, { status: 400 })
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('blackout_dates')
        .insert({
          title: body.title,
          start_datetime: body.start_datetime,
          end_datetime: body.end_datetime,
          is_full_day: body.is_full_day !== undefined ? Boolean(body.is_full_day) : true,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ blackout_date: data })
    }

    const newBlackout: BlackoutDate = {
      id: `mock_bo_${Date.now()}`,
      title: body.title,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
      is_full_day: Boolean(body.is_full_day ?? true),
      created_at: new Date().toISOString(),
    }
    MOCK_BLACKOUTS.push(newBlackout)
    return NextResponse.json({ blackout_date: newBlackout })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating blackout date'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
