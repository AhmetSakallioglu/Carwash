import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_ADDONS } from '@/lib/supabase/mock-data'
import { Addon } from '@/types'

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('addons')
          .select('*')
          .order('sort_order', { ascending: true })

        if (error || !data || data.length === 0) {
          return NextResponse.json({ addons: MOCK_ADDONS })
        }
        return NextResponse.json({ addons: data })
      } catch {
        return NextResponse.json({ addons: MOCK_ADDONS })
      }
    }

    return NextResponse.json({ addons: MOCK_ADDONS })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching addons'
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
        .from('addons')
        .insert({
          name: body.name,
          price: Number(body.price),
          duration_minutes: Number(body.duration_minutes) || 30,
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
          sort_order: Number(body.sort_order) || 0,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ addon: data })
    }

    const newAddon: Addon = {
      id: `mock_addon_${Date.now()}`,
      name: body.name,
      price: Number(body.price),
      duration_minutes: Number(body.duration_minutes) || 30,
      is_active: Boolean(body.is_active ?? true),
      sort_order: Number(body.sort_order) || 0,
      created_at: new Date().toISOString(),
    }
    MOCK_ADDONS.push(newAddon)
    return NextResponse.json({ addon: newAddon })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating addon'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
