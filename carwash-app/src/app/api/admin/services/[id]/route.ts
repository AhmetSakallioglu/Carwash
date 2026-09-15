import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_SERVICES } from '@/lib/supabase/mock-data'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const updatePayload = {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.features && { features: body.features }),
      ...(body.base_price !== undefined && { base_price: Number(body.base_price) }),
      ...(body.duration_minutes !== undefined && { duration_minutes: Number(body.duration_minutes) }),
      ...(body.is_featured !== undefined && { is_featured: Boolean(body.is_featured) }),
      ...(body.is_active !== undefined && { is_active: Boolean(body.is_active) }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
      updated_at: new Date().toISOString(),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('services')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ service: data })
    }

    const service = MOCK_SERVICES.find(s => s.id === id)
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    Object.assign(service, updatePayload)
    return NextResponse.json({ service })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating service'
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
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const idx = MOCK_SERVICES.findIndex(s => s.id === id)
    if (idx !== -1) {
      MOCK_SERVICES.splice(idx, 1)
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting service'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
