import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_LOCATION_ZONES } from '@/lib/supabase/mock-data'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const { id } = await params
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const zipCodesArray = body.zip_codes !== undefined
      ? Array.isArray(body.zip_codes)
        ? body.zip_codes
        : typeof body.zip_codes === 'string'
        ? body.zip_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
      : undefined

    const updatePayload = {
      ...(body.zone_name && { zone_name: body.zone_name.trim() }),
      ...(zipCodesArray !== undefined && { zip_codes: zipCodesArray }),
      ...(body.travel_fee !== undefined && { travel_fee: Math.max(0, Number(body.travel_fee) || 0) }),
      ...(body.travel_time_minutes !== undefined && {
        travel_time_minutes: Math.max(0, Number(body.travel_time_minutes) || 0),
      }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
      ...(body.is_active !== undefined && { is_active: Boolean(body.is_active) }),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('location_zones')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ zone: data })
    }

    const zone = MOCK_LOCATION_ZONES.find(z => z.id === id)
    if (!zone) {
      return NextResponse.json({ error: 'Location zone not found' }, { status: 404 })
    }
    Object.assign(zone, updatePayload)
    return NextResponse.json({ zone })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating location zone'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const { id } = await params
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { error } = await supabase
        .from('location_zones')
        .delete()
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const idx = MOCK_LOCATION_ZONES.findIndex(z => z.id === id)
    if (idx !== -1) {
      MOCK_LOCATION_ZONES.splice(idx, 1)
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting location zone'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
