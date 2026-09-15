import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_VEHICLE_CATEGORIES } from '@/lib/supabase/mock-data'
import { VehicleCategory } from '@/types'

export async function GET() {
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ vehicle_categories: data })
    }

    return NextResponse.json({ vehicle_categories: MOCK_VEHICLE_CATEGORIES })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching categories'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('vehicle_categories')
        .insert({
          label: body.label,
          multiplier: Number(body.multiplier),
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
          sort_order: Number(body.sort_order) || 0,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ vehicle_category: data })
    }

    const newCat: VehicleCategory = {
      id: `mock_cat_${Date.now()}`,
      label: body.label,
      multiplier: Number(body.multiplier),
      is_active: Boolean(body.is_active ?? true),
      sort_order: Number(body.sort_order) || 0,
      created_at: new Date().toISOString(),
    }
    MOCK_VEHICLE_CATEGORIES.push(newCat)
    return NextResponse.json({ vehicle_category: newCat })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating category'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
