import { NextRequest, NextResponse } from 'next/server'
import { unauthorizedIfNotAdmin } from '@/lib/auth'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_BUSINESS_SETTINGS } from '@/lib/supabase/mock-data'
import { normalizeBusinessSettings } from '@/lib/settings'

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          return NextResponse.json({ settings: normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS) })
        }
        return NextResponse.json({ settings: normalizeBusinessSettings(data || MOCK_BUSINESS_SETTINGS) })
      } catch {
        return NextResponse.json({ settings: normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS) })
      }
    }

    return NextResponse.json({ settings: normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS) })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching settings'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const isLiveDb = isSupabaseConfigured()

    const updatePayload = {
      ...(body.id && { id: body.id }),
      ...(body.business_name && { business_name: body.business_name }),
      ...(body.address && { address: body.address }),
      ...(body.phone && { phone: body.phone }),
      ...(body.email && { email: body.email }),
      ...(body.timezone && { timezone: body.timezone }),
      ...(body.slot_interval_minutes && { slot_interval_minutes: Number(body.slot_interval_minutes) }),
      ...(body.tagline !== undefined && { tagline: body.tagline }),
      ...(body.show_google_reviews !== undefined && { show_google_reviews: Boolean(body.show_google_reviews) }),
      ...(body.google_place_id !== undefined && { google_place_id: body.google_place_id }),
      ...(body.hero_vehicles_count !== undefined && { hero_vehicles_count: Number(body.hero_vehicles_count) }),
      ...(body.hero_rating_override !== undefined && {
        hero_rating_override: body.hero_rating_override === null ? null : Number(body.hero_rating_override),
      }),
      ...(body.hero_review_count_override !== undefined && {
        hero_review_count_override:
          body.hero_review_count_override === null ? null : Number(body.hero_review_count_override),
      }),
      ...(body.hero_stat_3_value !== undefined && { hero_stat_3_value: body.hero_stat_3_value }),
      ...(body.hero_stat_3_label !== undefined && { hero_stat_3_label: body.hero_stat_3_label }),
      ...(body.hero_stat_4_value !== undefined && { hero_stat_4_value: body.hero_stat_4_value }),
      ...(body.hero_stat_4_label !== undefined && { hero_stat_4_label: body.hero_stat_4_label }),
      ...(body.show_before_after !== undefined && { show_before_after: Boolean(body.show_before_after) }),
      ...(body.before_after_before_image_url !== undefined && {
        before_after_before_image_url: body.before_after_before_image_url,
      }),
      ...(body.before_after_after_image_url !== undefined && {
        before_after_after_image_url: body.before_after_after_image_url,
      }),
      updated_at: new Date().toISOString(),
    }

    if (isLiveDb) {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('business_settings')
        .upsert(updatePayload)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ settings: normalizeBusinessSettings(data) })
    }

    Object.assign(MOCK_BUSINESS_SETTINGS, updatePayload)
    return NextResponse.json({ settings: normalizeBusinessSettings(MOCK_BUSINESS_SETTINGS) })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating settings'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
