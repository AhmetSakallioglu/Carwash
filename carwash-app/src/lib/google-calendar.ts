import { google } from 'googleapis'
import { Appointment } from '@/types'
import { formatCurrency } from './utils'

function getGoogleCalendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = process.env.GOOGLE_PRIVATE_KEY
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!email || !privateKey || !calendarId || email.includes('your-gcp-project')) {
    return null
  }

  // Handle newlines in env private key (whether escaped or literal)
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '')

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    })

    const calendar = google.calendar({ version: 'v3', auth })
    return { calendar, calendarId }
  } catch (err) {
    console.error('[Google Calendar Auth Error]:', err)
    return null
  }
}

export interface CalendarEventPayload {
  appointment: Partial<Appointment> & {
    appointment_code: string
    customer_name: string
    customer_phone: string
    customer_address: string
    vehicle_details: string
    total_price: number
    start_time: string
    end_time: string
  }
  serviceName: string
  vehicleLabel?: string
  addonsSummary?: string
}

/**
 * Creates an event on the shop's Google Calendar
 */
export async function createCalendarEvent(payload: CalendarEventPayload): Promise<string | null> {
  const gcal = getGoogleCalendarClient()
  const { appointment, serviceName, vehicleLabel, addonsSummary } = payload

  const summary = `🚗 [${appointment.appointment_code}] ${serviceName} - ${appointment.customer_name}`
  const description = [
    `APEX Detail Studio Booking`,
    `----------------------------------------`,
    `Confirmation Code: ${appointment.appointment_code}`,
    `Customer: ${appointment.customer_name}`,
    `Phone: ${appointment.customer_phone}`,
    `Service: ${serviceName}`,
    `Vehicle Category: ${vehicleLabel || 'Standard'}`,
    `Vehicle Info: ${appointment.vehicle_details}`,
    `Addons: ${addonsSummary || 'None'}`,
    `Total Price: ${formatCurrency(appointment.total_price)} (Pay on-site)`,
    `Location / Service Address: ${appointment.customer_address}`,
    `----------------------------------------`,
  ].join('\n')

  if (!gcal) {
    console.log(`[Google Calendar DEV MOCK] Event created: "${summary}" (${appointment.start_time} - ${appointment.end_time})`)
    return `mock_event_${Date.now()}`
  }

  try {
    const res = await gcal.calendar.events.insert({
      calendarId: gcal.calendarId,
      requestBody: {
        summary,
        location: appointment.customer_address,
        description,
        start: {
          dateTime: new Date(appointment.start_time).toISOString(),
          timeZone: 'America/Chicago',
        },
        end: {
          dateTime: new Date(appointment.end_time).toISOString(),
          timeZone: 'America/Chicago',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    })

    console.log(`[Google Calendar] Event successfully created with ID: ${res.data.id}`)
    return res.data.id || null
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Google Calendar insert error'
    console.error('[Google Calendar Error] Failed to create event:', errorMsg)
    return null
  }
}

/**
 * Updates an existing event on Google Calendar (e.g., when rescheduled)
 */
export async function updateCalendarEvent(
  eventId: string,
  payload: CalendarEventPayload
): Promise<boolean> {
  const gcal = getGoogleCalendarClient()
  const { appointment, serviceName, vehicleLabel, addonsSummary } = payload

  const summary = `🚗 [${appointment.appointment_code}] ${serviceName} - ${appointment.customer_name}`
  const description = [
    `APEX Detail Studio Booking (UPDATED)`,
    `----------------------------------------`,
    `Confirmation Code: ${appointment.appointment_code}`,
    `Customer: ${appointment.customer_name}`,
    `Phone: ${appointment.customer_phone}`,
    `Service: ${serviceName}`,
    `Vehicle Category: ${vehicleLabel || 'Standard'}`,
    `Vehicle Info: ${appointment.vehicle_details}`,
    `Addons: ${addonsSummary || 'None'}`,
    `Total Price: ${formatCurrency(appointment.total_price)} (Pay on-site)`,
    `Location / Service Address: ${appointment.customer_address}`,
    `Status: ${appointment.status || 'confirmed'}`,
    `----------------------------------------`,
  ].join('\n')

  if (!gcal || eventId.startsWith('mock_event_')) {
    console.log(`[Google Calendar DEV MOCK] Event updated ID ${eventId}: "${summary}" (${appointment.start_time} - ${appointment.end_time})`)
    return true
  }

  try {
    await gcal.calendar.events.patch({
      calendarId: gcal.calendarId,
      eventId,
      requestBody: {
        summary,
        location: appointment.customer_address,
        description,
        start: {
          dateTime: new Date(appointment.start_time).toISOString(),
          timeZone: 'America/Chicago',
        },
        end: {
          dateTime: new Date(appointment.end_time).toISOString(),
          timeZone: 'America/Chicago',
        },
      },
    })

    console.log(`[Google Calendar] Event successfully updated for ID: ${eventId}`)
    return true
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Google Calendar update error'
    console.error(`[Google Calendar Error] Failed to update event ID ${eventId}:`, errorMsg)
    return false
  }
}

/**
 * Deletes or cancels an event on Google Calendar
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const gcal = getGoogleCalendarClient()

  if (!gcal || eventId.startsWith('mock_event_')) {
    console.log(`[Google Calendar DEV MOCK] Event deleted ID ${eventId}`)
    return true
  }

  try {
    await gcal.calendar.events.delete({
      calendarId: gcal.calendarId,
      eventId,
    })
    console.log(`[Google Calendar] Event successfully deleted for ID: ${eventId}`)
    return true
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Google Calendar delete error'
    console.error(`[Google Calendar Error] Failed to delete event ID ${eventId}:`, errorMsg)
    return false
  }
}
