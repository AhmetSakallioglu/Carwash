import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_GALLERY_ITEMS } from '@/lib/supabase/mock-data'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const updatePayload = {
      ...(body.title && { title: body.title.trim() }),
      ...(body.category && { category: body.category.trim() }),
      ...(body.image_url && { image_url: body.image_url.trim() }),
      ...(body.before_image_url !== undefined && {
        before_image_url: body.before_image_url ? body.before_image_url.trim() : null,
      }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
      ...(body.is_active !== undefined && { is_active: Boolean(body.is_active) }),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('gallery_items')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ item: data })
    }

    const item = MOCK_GALLERY_ITEMS.find(g => g.id === id)
    if (!item) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 })
    }
    Object.assign(item, updatePayload)
    return NextResponse.json({ item })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating gallery item'
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
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const idx = MOCK_GALLERY_ITEMS.findIndex(g => g.id === id)
    if (idx !== -1) {
      MOCK_GALLERY_ITEMS.splice(idx, 1)
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error deleting gallery item'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
