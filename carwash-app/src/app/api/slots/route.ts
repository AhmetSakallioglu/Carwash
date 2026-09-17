import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import {
  MOCK_SERVICES,
  MOCK_ADDONS,
  MOCK_LOCATION_ZONES,
  MOCK_SCHEDULES,
  MOCK_BLACKOUTS,
  MOCK_APPOINTMENTS,
} from '@/lib/supabase/mock-data'
import { matchLocationZone } from '@/lib/utils'
import { LocationZone, SlotsApiResponse, TimeSlot } from '@/types'

// Helper: parse "HH:mm:ss" or "HH:mm" into minutes from midnight
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Helper: format minutes from midnight to "hh:mm AM/PM"
function minutesTo12Hour(minutes: number): string {
  const hours24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  const minsStr = mins.toString().padStart(2, '0')
  return `${hours12.toString().padStart(2, '0')}:${minsStr} ${period}`
}

// Helper: convert "YYYY-MM-DD" + minutes to ISO string in Central Time (-05:00 / -06:00)
function buildCentralIso(dateStr: string, minutes: number): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0')
  const mins = (minutes % 60).toString().padStart(2, '0')
  // Central Daylight Time is UTC-5, Central Standard Time is UTC-6
  // Defaulting to -05:00 for Austin CDT
  return `${dateStr}T${hours}:${mins}:00-05:00`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') // "2026-09-17"
    const serviceId = searchParams.get('serviceId')
    const zipCode = searchParams.get('zip') || searchParams.get('zipCode') || ''
    const addonIdsParam = searchParams.get('addonIds') || ''
    const addonIds = addonIdsParam ? addonIdsParam.split(',').filter(Boolean) : []

    if (!dateStr) {
      return NextResponse.json<SlotsApiResponse>(
        { success: false, date: '', isOpen: false, message: 'Date parameter is required', totalDurationMinutes: 0, slots: [] },
        { status: 400 }
      )
    }

    // Determine day of week from dateStr (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const [year, month, day] = dateStr.split('-').map(Number)
    const targetDate = new Date(year, month - 1, day)
    const dayOfWeek = targetDate.getDay()

    let isOpen = false
    let openTimeStr = '08:00:00'
    let closeTimeStr = '18:00:00'
    let slotInterval = 30
    let totalDuration = 60
    let travelTimeMinutes = 0
    let blackoutList: Array<{ start_datetime: string; end_datetime: string; is_full_day: boolean; title: string }> = []
    let bookedRanges: Array<{ start: number; end: number }> = []

    const isLiveDb = isSupabaseConfigured()

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()

        // 1. Fetch Business Schedule for this day
        const { data: scheduleData, error: schedError } = await supabase
          .from('business_schedules')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .single()

        if (!schedError && scheduleData) {
          isOpen = scheduleData.is_open
          openTimeStr = scheduleData.open_time
          closeTimeStr = scheduleData.close_time
        } else {
          // Fallback if business_schedules table is empty or not yet created
          const schedule = MOCK_SCHEDULES.find(s => s.day_of_week === dayOfWeek)
          if (schedule) {
            isOpen = schedule.is_open
            openTimeStr = schedule.open_time
            closeTimeStr = schedule.close_time
          }
        }

        // 2. Fetch Business Settings
        const { data: settingsData } = await supabase
          .from('business_settings')
          .select('slot_interval_minutes')
          .limit(1)
          .single()

        if (settingsData?.slot_interval_minutes) {
          slotInterval = settingsData.slot_interval_minutes
        }

        // 3. Fetch Service Duration
        if (serviceId) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', serviceId)
            .single()

          if (serviceData?.duration_minutes) {
            totalDuration = serviceData.duration_minutes
          } else {
            const svc = MOCK_SERVICES.find(s => s.id === serviceId)
            if (svc) totalDuration = svc.duration_minutes
          }
        }

        // 4. Fetch Addons Duration
        if (addonIds.length > 0) {
          const { data: addonsData } = await supabase
            .from('addons')
            .select('duration_minutes')
            .in('id', addonIds)

          if (addonsData && addonsData.length > 0) {
            const addonsMinutes = addonsData.reduce((acc, a) => acc + (a.duration_minutes || 0), 0)
            totalDuration += addonsMinutes
          } else {
            const selectedAddons = MOCK_ADDONS.filter(a => addonIds.includes(a.id))
            const addonsMinutes = selectedAddons.reduce((acc, a) => acc + a.duration_minutes, 0)
            totalDuration += addonsMinutes
          }
        }

        // 5. Resolve travel buffer from ZIP against location_zones.zip_codes
        if (zipCode) {
          let zones: LocationZone[] = MOCK_LOCATION_ZONES
          const { data: zoneRows } = await supabase.from('location_zones').select('*').eq('is_active', true)

          if (zoneRows && zoneRows.length > 0) {
            zones = zoneRows as unknown as LocationZone[]
          }

          const matchedZone = matchLocationZone(zipCode, zones)
          if (matchedZone) {
            travelTimeMinutes = Number(matchedZone.travel_time_minutes || 0)
            totalDuration += travelTimeMinutes
          }
        }

        // 6. Fetch Blackout Dates
        const startOfDay = `${dateStr}T00:00:00.000Z`
        const endOfDay = `${dateStr}T23:59:59.999Z`

        const { data: blackouts } = await supabase
          .from('blackout_dates')
          .select('*')
          .lte('start_datetime', endOfDay)
          .gte('end_datetime', startOfDay)

        if (blackouts) {
          blackoutList = blackouts
        }

        // 7. Fetch Existing Appointments (excluding cancelled)
        const { data: appointments } = await supabase
          .from('appointments')
          .select('start_time, end_time')
          .neq('status', 'cancelled')
          .gte('start_time', `${dateStr}T00:00:00-06:00`)
          .lte('start_time', `${dateStr}T23:59:59-05:00`)

        if (appointments) {
          appointments.forEach(apt => {
            const start = new Date(apt.start_time)
            const end = new Date(apt.end_time)
            const startMins = start.getUTCHours() * 60 + start.getUTCMinutes() - 300 // Approx CT offset
            const duration = Math.round((end.getTime() - start.getTime()) / 60000)
            bookedRanges.push({ start: startMins, end: startMins + duration })
          })
        }
      } catch (err) {
        console.warn('[Supabase Slot Engine fallback to mock]:', err)
        const schedule = MOCK_SCHEDULES.find(s => s.day_of_week === dayOfWeek)
        if (schedule) {
          isOpen = schedule.is_open
          openTimeStr = schedule.open_time
          closeTimeStr = schedule.close_time
        }
      }
    } else {
      // Fallback to Mock Data
      const schedule = MOCK_SCHEDULES.find(s => s.day_of_week === dayOfWeek)
      if (schedule) {
        isOpen = schedule.is_open
        openTimeStr = schedule.open_time
        closeTimeStr = schedule.close_time
      }

      const service = MOCK_SERVICES.find(s => s.id === serviceId)
      if (service) {
        totalDuration = service.duration_minutes
      }

      const selectedAddons = MOCK_ADDONS.filter(a => addonIds.includes(a.id))
      const addonsMinutes = selectedAddons.reduce((acc, a) => acc + a.duration_minutes, 0)
      totalDuration += addonsMinutes

      if (zipCode) {
        const zone = matchLocationZone(zipCode, MOCK_LOCATION_ZONES)
        if (zone) {
          travelTimeMinutes = zone.travel_time_minutes
          totalDuration += travelTimeMinutes
        }
      }

      blackoutList = MOCK_BLACKOUTS.filter(b => {
        return b.start_datetime.startsWith(dateStr) || b.end_datetime.startsWith(dateStr)
      })

      MOCK_APPOINTMENTS.filter(a => a.status !== 'cancelled' && a.start_time.startsWith(dateStr)).forEach(apt => {
        const start = new Date(apt.start_time)
        const end = new Date(apt.end_time)
        const startMins = start.getHours() * 60 + start.getMinutes()
        const duration = Math.round((end.getTime() - start.getTime()) / 60000)
        bookedRanges.push({ start: startMins, end: startMins + duration })
      })
    }

    if (!isOpen) {
      return NextResponse.json<SlotsApiResponse>({
        success: true,
        date: dateStr,
        isOpen: false,
        message: "We're closed on this day.",
        totalDurationMinutes: totalDuration,
        travelTimeMinutes,
        slots: [],
      })
    }

    // Check full-day blackout
    const isFullDayBlackout = blackoutList.some(b => b.is_full_day)
    if (isFullDayBlackout) {
      const blackout = blackoutList.find(b => b.is_full_day)
      return NextResponse.json<SlotsApiResponse>({
        success: true,
        date: dateStr,
        isOpen: false,
        message: `Closed for: ${blackout?.title || 'Scheduled Maintenance / Holiday'}`,
        totalDurationMinutes: totalDuration,
        travelTimeMinutes,
        slots: [],
      })
    }

    const openMinutes = timeToMinutes(openTimeStr)
    const closeMinutes = timeToMinutes(closeTimeStr)

    // Generate Slot Intervals
    const slots: TimeSlot[] = []
    const now = new Date()
    const isToday = targetDate.toDateString() === now.toDateString()
    const currentMinsToday = now.getHours() * 60 + now.getMinutes()

    for (let slotStart = openMinutes; slotStart + totalDuration <= closeMinutes; slotStart += slotInterval) {
      const slotEnd = slotStart + totalDuration

      // If today, filter out times that have already passed (add 30 min buffer)
      if (isToday && slotStart <= currentMinsToday + 30) {
        continue
      }

      // Check collision with existing bookings
      const hasCollision = bookedRanges.some(booking => {
        return slotStart < booking.end && slotEnd > booking.start
      })

      if (!hasCollision) {
        const timeLabel = minutesTo12Hour(slotStart)
        slots.push({
          time: timeLabel,
          startIso: buildCentralIso(dateStr, slotStart),
          endIso: buildCentralIso(dateStr, slotEnd),
          available: true,
        })
      }
    }

    return NextResponse.json<SlotsApiResponse>({
      success: true,
      date: dateStr,
      isOpen: true,
      totalDurationMinutes: totalDuration,
      travelTimeMinutes,
      slots,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error calculating available slots'
    console.error('[API /api/slots Error]:', errorMsg)
    return NextResponse.json<SlotsApiResponse>(
      { success: false, date: '', isOpen: false, message: errorMsg, totalDurationMinutes: 0, slots: [] },
      { status: 500 }
    )
  }
}
