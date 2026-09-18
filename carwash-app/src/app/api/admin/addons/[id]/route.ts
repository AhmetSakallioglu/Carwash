import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_ADDONS } from '@/lib/supabase/mock-data'

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

    const updatePayload = {
      ...(body.name && { name: body.name }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.duration_minutes !== undefined && { duration_minutes: Number(body.duration_minutes) }),
      ...(body.is_active !== undefined && { is_active: Boolean(body.is_active) }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('addons')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ addon: data })
    }

    const addon = MOCK_ADDONS.find(a => a.id === id)
    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 })
    }
    Object.assign(addon, updatePayload)
    return NextResponse.json({ addon })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating addon'
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
      const { error } = await supabase.from('addons').delete().eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const idx = MOCK_ADDONS.findIndex(a => a.id === id)
    if (idx !== -1) {
      MOCK_ADDONS.splice(idx, 1)
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting addon'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
