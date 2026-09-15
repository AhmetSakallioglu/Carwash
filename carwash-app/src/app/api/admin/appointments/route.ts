import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import { MOCK_APPOINTMENTS } from '@/lib/supabase/mock-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      const supabase = createAdminClient()
      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          vehicle_category:vehicle_categories(*)
        `)
        .order('start_time', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (startDate) {
        query = query.gte('start_time', `${startDate}T00:00:00Z`)
      }

      if (endDate) {
        query = query.lte('start_time', `${endDate}T23:59:59Z`)
      }

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,appointment_code.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('[Admin Appointments Query Error]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ appointments: data })
    } else {
      // Return filtered mock data
      let filtered = [...MOCK_APPOINTMENTS]

      if (status && status !== 'all') {
        filtered = filtered.filter(a => a.status === status)
      }

      if (search) {
        const s = search.toLowerCase()
        filtered = filtered.filter(
          a =>
            a.customer_name.toLowerCase().includes(s) ||
            a.customer_phone.includes(s) ||
            a.appointment_code.toLowerCase().includes(s)
        )
      }

      if (startDate) {
        filtered = filtered.filter(a => new Date(a.start_time) >= new Date(startDate))
      }

      if (endDate) {
        filtered = filtered.filter(a => new Date(a.start_time) <= new Date(`${endDate}T23:59:59`))
      }

      return NextResponse.json({ appointments: filtered })
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching appointments'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
