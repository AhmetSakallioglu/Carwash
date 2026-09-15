import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_BUSINESS_SETTINGS } from '@/lib/supabase/mock-data'

export async function GET() {
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          return NextResponse.json({ settings: MOCK_BUSINESS_SETTINGS })
        }
        return NextResponse.json({ settings: data || MOCK_BUSINESS_SETTINGS })
      } catch {
        return NextResponse.json({ settings: MOCK_BUSINESS_SETTINGS })
      }
    }

    return NextResponse.json({ settings: MOCK_BUSINESS_SETTINGS })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching settings'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const updatePayload = {
      ...(body.business_name && { business_name: body.business_name }),
      ...(body.address && { address: body.address }),
      ...(body.phone && { phone: body.phone }),
      ...(body.email && { email: body.email }),
      ...(body.timezone && { timezone: body.timezone }),
      ...(body.slot_interval_minutes && { slot_interval_minutes: Number(body.slot_interval_minutes) }),
      updated_at: new Date().toISOString(),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('business_settings')
        .upsert(updatePayload)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ settings: data })
    }

    Object.assign(MOCK_BUSINESS_SETTINGS, updatePayload)
    return NextResponse.json({ settings: MOCK_BUSINESS_SETTINGS })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating settings'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
