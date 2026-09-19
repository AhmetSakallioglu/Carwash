import { after, NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import {
  MOCK_SERVICES,
  MOCK_VEHICLE_CATEGORIES,
  MOCK_ADDONS,
  MOCK_LOCATION_ZONES,
  MOCK_APPOINTMENTS,
} from '@/lib/supabase/mock-data'
import {
  isValidUSPhone,
  formatUSPhoneNumber,
  formatDateTimeCT,
  generateAppointmentCode,
  calculateBookingPrice,
  matchLocationZone,
  OUT_OF_SERVICE_AREA_MESSAGE,
} from '@/lib/utils'
import { sendBookingConfirmedSMS } from '@/lib/twilio'
import { createCalendarEvent, isRealGoogleEventId } from '@/lib/calendar'
import { BookingSubmissionPayload, SelectedAddon, Appointment, LocationZone, Service, VehicleCategory } from '@/types'
import { getBusinessSettings } from '@/lib/supabase/queries'
import { getPackageSizeRate, hydrateService, hydrateVehicleCategory } from '@/lib/catalog'

export const maxDuration = 60

async function loadActiveLocationZones(isLiveDb: boolean): Promise<LocationZone[]> {
  if (!isLiveDb) return MOCK_LOCATION_ZONES.filter(zone => zone.is_active)

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('location_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return MOCK_LOCATION_ZONES.filter(zone => zone.is_active)
    }

    return data as unknown as LocationZone[]
  } catch {
    return MOCK_LOCATION_ZONES.filter(zone => zone.is_active)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingSubmissionPayload

    // 1. Anti-Spam Honeypot Trap Check
    if (body.website_trap && body.website_trap.trim() !== '') {
      console.warn('[Spam Blocked] Honeypot field filled by bot.')
      // Return fake success to spam bot
      return NextResponse.json({
        success: true,
        appointment: {
          appointment_code: 'OZER-SPAM',
          customer_name: body.customer_name,
        },
      })
    }

    // 2. Input Validations
    if (
      !body.customer_name ||
      !body.customer_phone ||
      !body.customer_address ||
      !body.vehicle_details ||
      !body.service_id ||
      !body.vehicle_category_id ||
      !body.start_time
    ) {
      return NextResponse.json(
        { success: false, error: 'All booking fields are required.' },
        { status: 400 }
      )
    }

    if (!isValidUSPhone(body.customer_phone)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit US phone number.' },
        { status: 400 }
      )
    }

    const formattedPhone = formatUSPhoneNumber(body.customer_phone)
    const startTimeDate = new Date(body.start_time)
    if (isNaN(startTimeDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid start time selected.' },
        { status: 400 }
      )
    }

    const isLiveDb = isSupabaseConfigured()
    const locationLookup = [body.zip_code, body.customer_address].filter(Boolean).join(' ')
    const activeZones = await loadActiveLocationZones(isLiveDb)
    const matchedZone = matchLocationZone(locationLookup, activeZones)

    if (!matchedZone) {
      return NextResponse.json(
        { success: false, error: OUT_OF_SERVICE_AREA_MESSAGE },
        { status: 400 }
      )
    }

    // Server-authoritative zone: ignore client-supplied zone_id / travel_fee
    let serviceName = 'Full Detail'
    let serviceBasePrice = 249
    let serviceDuration = 150
    let serviceDiscountPercentage = 0
    let serviceDiscountActive = false
    let vehicleLabel = 'Sedan / Coupe'
    let locationZoneName = matchedZone.zone_name
    let locationTravelFee = Number(matchedZone.travel_fee || 0)
    let locationTravelTimeMinutes = Number(matchedZone.travel_time_minutes || 0)
    const resolvedZoneId = matchedZone.id
    const selectedAddonsData: SelectedAddon[] = []
    let totalDuration = 60

    if (isLiveDb) {
      const supabase = createAdminClient()

      // Fetch Service
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', body.service_id)
        .single()

      if (service) {
        const categoryRow = (
          await supabase.from('vehicle_categories').select('*').eq('id', body.vehicle_category_id).single()
        ).data
        const hydratedService = hydrateService(service as unknown as Service)
        const hydratedCategory = hydrateVehicleCategory(
          (categoryRow || { id: body.vehicle_category_id }) as unknown as VehicleCategory
        )
        const sizeRate = getPackageSizeRate(hydratedService, hydratedCategory)
        serviceName = hydratedService.name
        serviceBasePrice = sizeRate.price
        serviceDuration = sizeRate.durationMinutes
        serviceDiscountPercentage = Number(hydratedService.discount_percentage || 0)
        serviceDiscountActive = Boolean(hydratedService.discount_active)
        vehicleLabel = hydratedCategory.label
        totalDuration = serviceDuration
      }

      // Fetch Addons
      if (body.selected_addon_ids && body.selected_addon_ids.length > 0) {
        const { data: addons } = await supabase
          .from('addons')
          .select('*')
          .in('id', body.selected_addon_ids)

        if (addons) {
          addons.forEach(a => {
            selectedAddonsData.push({
              id: a.id,
              name: a.name,
              price: Number(a.price),
              duration_minutes: a.duration_minutes,
            })
            totalDuration += a.duration_minutes
          })
        }
      }
    } else {
      // Mock Data lookup
      const service = hydrateService(MOCK_SERVICES.find(s => s.id === body.service_id) || MOCK_SERVICES[0])
      const category =
        hydrateVehicleCategory(
          MOCK_VEHICLE_CATEGORIES.find(c => c.id === body.vehicle_category_id) || MOCK_VEHICLE_CATEGORIES[0]
        )
      const sizeRate = getPackageSizeRate(service, category)
      serviceName = service.name
      serviceBasePrice = sizeRate.price
      serviceDuration = sizeRate.durationMinutes
      serviceDiscountPercentage = service.discount_percentage || 0
      serviceDiscountActive = service.discount_active || false
      vehicleLabel = category.label
      totalDuration = serviceDuration

      if (body.selected_addon_ids && body.selected_addon_ids.length > 0) {
        const addons = MOCK_ADDONS.filter(a => body.selected_addon_ids.includes(a.id))
        addons.forEach(a => {
          selectedAddonsData.push({
            id: a.id,
            name: a.name,
            price: a.price,
            duration_minutes: a.duration_minutes,
          })
          totalDuration += a.duration_minutes
        })
      }
    }

    // Add Travel Time Buffer to Total Booking Block Duration
    totalDuration += locationTravelTimeMinutes

    // 3. Price & End Time Calculations
    const addonPrices = selectedAddonsData.map(a => a.price)
    const totalPrice = calculateBookingPrice(
      serviceBasePrice,
      addonPrices,
      locationTravelFee,
      serviceDiscountPercentage,
      serviceDiscountActive
    )
    const originalPrice = calculateBookingPrice(
      serviceBasePrice,
      addonPrices,
      locationTravelFee,
      0,
      false
    )
    const discountSavings = Math.max(0, originalPrice - totalPrice)
    const endTimeDate = new Date(startTimeDate.getTime() + totalDuration * 60000)
    const appointmentCode = generateAppointmentCode()

    let createdAppointment: Appointment

    if (isLiveDb) {
      try {
        const supabase = createAdminClient()

        const { data: inserted, error: insertError } = await supabase
          .from('appointments')
          .insert({
            appointment_code: appointmentCode,
            customer_name: body.customer_name.trim(),
            customer_phone: formattedPhone,
            customer_address: body.customer_address.trim(),
            vehicle_details: body.vehicle_details.trim(),
            service_id: body.service_id,
            vehicle_category_id: body.vehicle_category_id,
            location_zone_id: resolvedZoneId,
            selected_addons: selectedAddonsData,
            travel_fee: locationTravelFee,
            travel_time_minutes: locationTravelTimeMinutes,
            total_price: totalPrice,
            start_time: startTimeDate.toISOString(),
            end_time: endTimeDate.toISOString(),
            status: 'confirmed',
          })
          .select()
          .single()

        if (insertError || !inserted) {
          console.warn('[Supabase Insert fallback to memory]:', insertError)
          createdAppointment = {
            id: `mock_apt_${Date.now()}`,
            appointment_code: appointmentCode,
            customer_name: body.customer_name.trim(),
            customer_phone: formattedPhone,
            customer_address: body.customer_address.trim(),
            vehicle_details: body.vehicle_details.trim(),
            service_id: body.service_id,
            vehicle_category_id: body.vehicle_category_id,
            location_zone_id: resolvedZoneId,
            selected_addons: selectedAddonsData,
            travel_fee: locationTravelFee,
            travel_time_minutes: locationTravelTimeMinutes,
            total_price: totalPrice,
            start_time: startTimeDate.toISOString(),
            end_time: endTimeDate.toISOString(),
            status: 'confirmed',
            cancellation_reason: null,
            google_event_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          MOCK_APPOINTMENTS.unshift(createdAppointment)
        } else {
          createdAppointment = inserted as unknown as Appointment
        }
      } catch (dbErr) {
        console.warn('[Supabase DB exception fallback]:', dbErr)
        createdAppointment = {
          id: `mock_apt_${Date.now()}`,
          appointment_code: appointmentCode,
          customer_name: body.customer_name.trim(),
          customer_phone: formattedPhone,
          customer_address: body.customer_address.trim(),
          vehicle_details: body.vehicle_details.trim(),
          service_id: body.service_id,
          vehicle_category_id: body.vehicle_category_id,
          location_zone_id: resolvedZoneId,
          selected_addons: selectedAddonsData,
          travel_fee: locationTravelFee,
          travel_time_minutes: locationTravelTimeMinutes,
          total_price: totalPrice,
          start_time: startTimeDate.toISOString(),
          end_time: endTimeDate.toISOString(),
          status: 'confirmed',
          cancellation_reason: null,
          google_event_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        MOCK_APPOINTMENTS.unshift(createdAppointment)
      }
    } else {
      // Create Mock Appointment Record
      createdAppointment = {
        id: `mock_apt_${Date.now()}`,
        appointment_code: appointmentCode,
        customer_name: body.customer_name.trim(),
        customer_phone: formattedPhone,
        customer_address: body.customer_address.trim(),
        vehicle_details: body.vehicle_details.trim(),
        service_id: body.service_id,
        vehicle_category_id: body.vehicle_category_id,
        location_zone_id: resolvedZoneId,
        selected_addons: selectedAddonsData,
        travel_fee: locationTravelFee,
        travel_time_minutes: locationTravelTimeMinutes,
        total_price: totalPrice,
        start_time: startTimeDate.toISOString(),
        end_time: endTimeDate.toISOString(),
        status: 'confirmed',
        cancellation_reason: null,
        google_event_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      MOCK_APPOINTMENTS.unshift(createdAppointment)
    }

    createdAppointment.location_zone = matchedZone
    createdAppointment.location_zone_id = resolvedZoneId
    createdAppointment.travel_fee = locationTravelFee
    createdAppointment.travel_time_minutes = locationTravelTimeMinutes

    const formattedDateTime = formatDateTimeCT(createdAppointment.start_time)
    const addonsSummary = selectedAddonsData.map(a => a.name).join(', ')
    const calendarPayload = {
      appointment: createdAppointment,
      serviceName,
      vehicleLabel,
      addonsSummary,
      zipCode: body.zip_code,
    }

    after(async () => {
      try {
        const gcalEventId = await createCalendarEvent(calendarPayload)
        if (isRealGoogleEventId(gcalEventId)) {
          createdAppointment.google_event_id = gcalEventId
          if (isLiveDb && createdAppointment.id && !createdAppointment.id.startsWith('mock_apt_')) {
            const supabase = createAdminClient()
            const { error: persistError } = await supabase
              .from('appointments')
              .update({ google_event_id: gcalEventId } as never)
              .eq('id', createdAppointment.id)
            if (persistError) {
              console.error('[Google Calendar ID persist Error]:', persistError.message)
            }
          }
        }
      } catch (calendarErr) {
        console.error('[Google Calendar Non-fatal Error]:', calendarErr)
      }

      try {
        const settings = await getBusinessSettings()
        await sendBookingConfirmedSMS({
          customerName: createdAppointment.customer_name,
          customerPhone: createdAppointment.customer_phone,
          appointmentCode: createdAppointment.appointment_code,
          serviceName,
          dateTimeFormatted: formattedDateTime,
          customerAddress: createdAppointment.customer_address,
          totalPrice: createdAppointment.total_price,
          zoneName: locationZoneName,
          travelFee: locationTravelFee,
          totalDurationMinutes: serviceDuration + selectedAddonsData.reduce((acc, a) => acc + a.duration_minutes, 0),
          discountSavings,
          businessName: settings.business_name,
          businessPhone: settings.phone,
        })
      } catch (smsErr) {
        console.error('[Twilio Non-fatal Error]:', smsErr)
      }
    })

    return NextResponse.json({
      success: true,
      appointment: createdAppointment,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error processing booking'
    console.error('[API /api/bookings Error]:', errorMsg)
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
