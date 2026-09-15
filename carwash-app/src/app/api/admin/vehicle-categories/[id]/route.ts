import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_VEHICLE_CATEGORIES } from '@/lib/supabase/mock-data'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const updatePayload = {
      ...(body.label && { label: body.label }),
      ...(body.multiplier !== undefined && { multiplier: Number(body.multiplier) }),
      ...(body.is_active !== undefined && { is_active: Boolean(body.is_active) }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('vehicle_categories')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ vehicle_category: data })
    }

    const cat = MOCK_VEHICLE_CATEGORIES.find(c => c.id === id)
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    Object.assign(cat, updatePayload)
    return NextResponse.json({ vehicle_category: cat })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating category'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { error } = await supabase.from('vehicle_categories').delete().eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const idx = MOCK_VEHICLE_CATEGORIES.findIndex(c => c.id === id)
    if (idx !== -1) {
      MOCK_VEHICLE_CATEGORIES.splice(idx, 1)
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting category'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
