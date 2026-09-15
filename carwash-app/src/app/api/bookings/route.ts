import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import {
  MOCK_SERVICES,
  MOCK_VEHICLE_CATEGORIES,
  MOCK_ADDONS,
  MOCK_APPOINTMENTS,
} from '@/lib/supabase/mock-data'
import {
  isValidUSPhone,
  formatUSPhoneNumber,
  formatDateTimeCT,
  generateAppointmentCode,
  calculateBookingPrice,
} from '@/lib/utils'
import { sendBookingConfirmedSMS } from '@/lib/twilio'
import { createCalendarEvent } from '@/lib/google-calendar'
import { BookingSubmissionPayload, SelectedAddon, Appointment } from '@/types'

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
          appointment_code: 'APX-SPAM',
          customer_name: body.customer_name,
        },
      })
    }

    // 2. Input Validations
    if (!body.customer_name || !body.customer_phone || !body.customer_address || !body.vehicle_details || !body.service_id || !body.vehicle_category_id || !body.start_time) {
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
    let serviceName = 'Full Auto Detail'
    let serviceBasePrice = 199
    let serviceDuration = 60
    let vehicleMultiplier = 1.0
    let vehicleLabel = 'Sedan / Coupe'
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
        serviceName = service.name
        serviceBasePrice = Number(service.base_price)
        serviceDuration = service.duration_minutes
        totalDuration = serviceDuration
      }

      // Fetch Vehicle Category
      const { data: category } = await supabase
        .from('vehicle_categories')
        .select('*')
        .eq('id', body.vehicle_category_id)
        .single()

      if (category) {
        vehicleMultiplier = Number(category.multiplier)
        vehicleLabel = category.label
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
      const service = MOCK_SERVICES.find(s => s.id === body.service_id) || MOCK_SERVICES[0]
      serviceName = service.name
      serviceBasePrice = service.base_price
      serviceDuration = service.duration_minutes
      totalDuration = serviceDuration

      const category = MOCK_VEHICLE_CATEGORIES.find(c => c.id === body.vehicle_category_id) || MOCK_VEHICLE_CATEGORIES[0]
      vehicleMultiplier = category.multiplier
      vehicleLabel = category.label

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

    // 3. Price & End Time Calculations
    const addonPrices = selectedAddonsData.map(a => a.price)
    const totalPrice = calculateBookingPrice(serviceBasePrice, vehicleMultiplier, addonPrices)
    const endTimeDate = new Date(startTimeDate.getTime() + totalDuration * 60000)
    const appointmentCode = generateAppointmentCode()

    let createdAppointment: Appointment

    if (isLiveDb) {
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
          selected_addons: selectedAddonsData,
          total_price: totalPrice,
          start_time: startTimeDate.toISOString(),
          end_time: endTimeDate.toISOString(),
          status: 'confirmed',
        })
        .select()
        .single()

      if (insertError || !inserted) {
        console.error('[Supabase Insert Error]:', insertError)
        return NextResponse.json(
          { success: false, error: 'Database error saving reservation. Please try again.' },
          { status: 500 }
        )
      }

      createdAppointment = inserted as unknown as Appointment
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
        selected_addons: selectedAddonsData,
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

    const formattedDateTime = formatDateTimeCT(createdAppointment.start_time)
    const addonsSummary = selectedAddonsData.map(a => a.name).join(', ')

    // 4. Sync with Google Calendar (Background / Async)
    try {
      const gcalEventId = await createCalendarEvent({
        appointment: createdAppointment,
        serviceName,
        vehicleLabel,
        addonsSummary,
      })

      if (gcalEventId && isLiveDb) {
        const supabase = createAdminClient()
        await supabase
          .from('appointments')
          .update({ google_event_id: gcalEventId })
          .eq('id', createdAppointment.id)
        createdAppointment.google_event_id = gcalEventId
      }
    } catch (gcalErr) {
      console.error('[Google Calendar Non-fatal Error]:', gcalErr)
    }

    // 5. Dispatch Twilio Confirmation SMS
    try {
      await sendBookingConfirmedSMS({
        customerName: createdAppointment.customer_name,
        customerPhone: createdAppointment.customer_phone,
        appointmentCode: createdAppointment.appointment_code,
        serviceName,
        dateTimeFormatted: formattedDateTime,
        customerAddress: createdAppointment.customer_address,
        totalPrice: createdAppointment.total_price,
      })
    } catch (smsErr) {
      console.error('[Twilio Non-fatal Error]:', smsErr)
    }

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
