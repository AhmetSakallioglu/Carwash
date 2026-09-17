import { google } from 'googleapis'
import { Appointment } from '@/types'
import { BUSINESS_TIMEZONE, extractZipCode, formatCurrency } from './utils'
import { getBusinessSettings } from '@/lib/supabase/queries'

const CALENDAR_TIMEZONE = BUSINESS_TIMEZONE || 'America/Chicago'

/**
 * Normalize a PEM private key from .env.local.
 * Handles wrapping quotes and escaped `\n` sequences so OpenSSL does not fail.
 */
function normalizeGooglePrivateKey(raw: string | undefined): string | null {
  if (!raw) return null

  let key = raw.trim()
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1)
  }

  key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim()

  if (!key.includes('BEGIN PRIVATE KEY') || !key.includes('END PRIVATE KEY')) {
    return null
  }

  return key
}

function getGoogleCalendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim()
  const privateKey = normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY)

  if (
    !email ||
    !privateKey ||
    !calendarId ||
    email.includes('your-gcp-project') ||
    calendarId.includes('your_shop_calendar')
  ) {
    return null
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    return {
      calendar: google.calendar({ version: 'v3', auth }),
      calendarId,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Google Calendar JWT auth failed'
    console.error('[Google Calendar Auth Error]:', errorMsg)
    return null
  }
}

function formatEventLocation(address: string, zipCode?: string): string {
  const trimmedAddress = address.trim()
  const zip = (zipCode || extractZipCode(trimmedAddress) || '').trim()
  if (zip && !trimmedAddress.includes(zip)) {
    return `${trimmedAddress}, ${zip}`
  }
  return trimmedAddress
}

function buildEventSummary(customerName: string, vehicleLabel?: string, businessName?: string): string {
  const category = vehicleLabel?.trim() || 'Vehicle'
  const brand = businessName?.trim() || 'Ozer Auto Detailing'
  return `${brand} - ${customerName.trim()} - ${category}`
}

function buildEventDescription(payload: CalendarEventPayload, location: string): string {
  const { appointment, serviceName, addonsSummary, zipCode } = payload
  const zip = zipCode || extractZipCode(appointment.customer_address) || '—'

  return [
    `Packages: ${serviceName}`,
    `Add-ons: ${addonsSummary || 'None'}`,
    `ZIP/Address: ${location}`,
    `ZIP: ${zip}`,
    `Appointment Code: ${appointment.appointment_code}`,
    '',
    `Customer: ${appointment.customer_name}`,
    `Phone: ${appointment.customer_phone}`,
    `Vehicle: ${appointment.vehicle_details}`,
    `Travel fee: ${formatCurrency(appointment.travel_fee || 0)} (${appointment.travel_time_minutes || 0}m buffer)`,
    `Total: ${formatCurrency(appointment.total_price)} (pay on-site)`,
  ].join('\n')
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
  zipCode?: string
}

/**
 * Creates an event on the shop's Google Calendar
 */
export async function createCalendarEvent(payload: CalendarEventPayload): Promise<string | null> {
  const gcal = getGoogleCalendarClient()
  const { appointment, vehicleLabel } = payload
  const location = formatEventLocation(appointment.customer_address, payload.zipCode)
  const settings = await getBusinessSettings()
  const summary = buildEventSummary(appointment.customer_name, vehicleLabel, settings.business_name)
  const description = buildEventDescription(payload, location)

  if (!gcal) {
    console.warn(
      '[Google Calendar] Missing GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_PRIVATE_KEY — event not created.'
    )
    console.log(
      `[Google Calendar DEV MOCK] Event created: "${summary}" (${appointment.start_time} - ${appointment.end_time}) @ ${location}`
    )
    return `mock_event_${Date.now()}`
  }

  try {
    const res = await gcal.calendar.events.insert({
      calendarId: gcal.calendarId,
      requestBody: {
        summary,
        location,
        description,
        start: {
          dateTime: new Date(appointment.start_time).toISOString(),
          timeZone: CALENDAR_TIMEZONE,
        },
        end: {
          dateTime: new Date(appointment.end_time).toISOString(),
          timeZone: CALENDAR_TIMEZONE,
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
  const { appointment, vehicleLabel } = payload
  const location = formatEventLocation(appointment.customer_address, payload.zipCode)
  const settings = await getBusinessSettings()
  const summary = buildEventSummary(appointment.customer_name, vehicleLabel, settings.business_name)
  const description = buildEventDescription(payload, location)

  if (!gcal || eventId.startsWith('mock_event_')) {
    console.log(
      `[Google Calendar DEV MOCK] Event updated ID ${eventId}: "${summary}" (${appointment.start_time} - ${appointment.end_time})`
    )
    return true
  }

  try {
    await gcal.calendar.events.patch({
      calendarId: gcal.calendarId,
      eventId,
      requestBody: {
        summary,
        location,
        description,
        start: {
          dateTime: new Date(appointment.start_time).toISOString(),
          timeZone: CALENDAR_TIMEZONE,
        },
        end: {
          dateTime: new Date(appointment.end_time).toISOString(),
          timeZone: CALENDAR_TIMEZONE,
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
