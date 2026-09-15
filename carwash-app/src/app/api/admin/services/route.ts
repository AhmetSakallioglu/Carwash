import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_SERVICES } from '@/lib/supabase/mock-data'
import { Service } from '@/types'

export async function GET() {
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ services: data })
    }

    return NextResponse.json({ services: MOCK_SERVICES })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching services'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: body.name,
          slug,
          description: body.description || '',
          features: Array.isArray(body.features) ? body.features : [],
          base_price: Number(body.base_price),
          duration_minutes: Number(body.duration_minutes) || 60,
          is_featured: Boolean(body.is_featured),
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
          sort_order: Number(body.sort_order) || 0,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ service: data })
    }

    const newService: Service = {
      id: `mock_svc_${Date.now()}`,
      name: body.name,
      slug,
      description: body.description || '',
      features: Array.isArray(body.features) ? body.features : [],
      base_price: Number(body.base_price),
      duration_minutes: Number(body.duration_minutes) || 60,
      is_featured: Boolean(body.is_featured),
      is_active: Boolean(body.is_active ?? true),
      sort_order: Number(body.sort_order) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_SERVICES.push(newService)
    return NextResponse.json({ service: newService })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating service'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
