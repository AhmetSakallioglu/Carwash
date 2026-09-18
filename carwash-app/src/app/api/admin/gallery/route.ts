import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_GALLERY_ITEMS } from '@/lib/supabase/mock-data'
import { GalleryItem } from '@/types'

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .order('sort_order', { ascending: true })

        if (error || !data || data.length === 0) {
          return NextResponse.json({ gallery: MOCK_GALLERY_ITEMS })
        }
        return NextResponse.json({ gallery: data })
      } catch {
        return NextResponse.json({ gallery: MOCK_GALLERY_ITEMS })
      }
    }

    return NextResponse.json({ gallery: MOCK_GALLERY_ITEMS })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching gallery items'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('gallery_items')
        .insert({
          title: body.title,
          category: body.category,
          image_url: body.image_url,
          before_image_url: body.before_image_url || null,
          sort_order: Number(body.sort_order) || 0,
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ item: data })
    }

    const newItem: GalleryItem = {
      id: `mock_gal_${Date.now()}`,
      title: body.title,
      category: body.category,
      image_url: body.image_url,
      before_image_url: body.before_image_url || null,
      sort_order: Number(body.sort_order) || 0,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      created_at: new Date().toISOString(),
    }
    MOCK_GALLERY_ITEMS.push(newItem)
    return NextResponse.json({ item: newItem })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating gallery item'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
