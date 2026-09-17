import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_LOCATION_ZONES } from '@/lib/supabase/mock-data'
import { LocationZone } from '@/types'

export async function GET() {
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('location_zones')
          .select('*')
          .order('sort_order', { ascending: true })

        if (error || !data || data.length === 0) {
          return NextResponse.json({ zones: MOCK_LOCATION_ZONES })
        }
        return NextResponse.json({ zones: data })
      } catch {
        return NextResponse.json({ zones: MOCK_LOCATION_ZONES })
      }
    }

    return NextResponse.json({ zones: MOCK_LOCATION_ZONES })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching location zones'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const zipCodesArray = Array.isArray(body.zip_codes)
      ? body.zip_codes
      : typeof body.zip_codes === 'string'
      ? body.zip_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('location_zones')
        .insert({
          zone_name: body.zone_name.trim(),
          zip_codes: zipCodesArray,
          travel_fee: Math.max(0, Number(body.travel_fee) || 0),
          travel_time_minutes: Math.max(0, Number(body.travel_time_minutes) || 0),
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
          sort_order: Number(body.sort_order) || 0,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ zone: data })
    }

    const newZone: LocationZone = {
      id: `mock_zone_${Date.now()}`,
      zone_name: body.zone_name.trim(),
      zip_codes: zipCodesArray,
      travel_fee: Math.max(0, Number(body.travel_fee) || 0),
      travel_time_minutes: Math.max(0, Number(body.travel_time_minutes) || 0),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      sort_order: Number(body.sort_order) || 0,
      created_at: new Date().toISOString(),
    }
    MOCK_LOCATION_ZONES.push(newZone)
    return NextResponse.json({ zone: newZone })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating location zone'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
