import 'server-only'
import { createPrivateKey } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { google } from 'googleapis'
import { Appointment } from '@/types'
import { BUSINESS_TIMEZONE, extractZipCode, formatCurrency } from './utils'
import { getBusinessSettings } from '@/lib/supabase/queries'

const CALENDAR_TIMEZONE = BUSINESS_TIMEZONE || 'America/Chicago'
const ESCAPED_NEWLINE = String.raw`\n`
const ESCAPED_CRLF = String.raw`\r\n`
const ESCAPED_CR = String.raw`\r`

function unwrapQuotes(value: string): string {
  let key = value.trim().replace(/^\uFEFF/, '')
  for (let i = 0; i < 3; i += 1) {
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1).trim()
    } else {
      break
    }
  }
  return key
}

function unescapeNewlines(value: string): string {
  return value
    .split(ESCAPED_CRLF).join('\n')
    .split(ESCAPED_NEWLINE).join('\n')
    .split(ESCAPED_CR).join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

function extractServiceAccountPrivateKey(raw: string): string {
  const trimmed = unwrapQuotes(raw)
  if (!trimmed.startsWith('{')) return trimmed

  try {
    const parsed = JSON.parse(unescapeNewlines(trimmed)) as { private_key?: string }
    if (parsed.private_key) return unwrapQuotes(parsed.private_key)
  } catch {
    const match = trimmed.match(/"private_key"\s*:\s*"((?:\\.|[^"\\])*)"/)
    if (match?.[1]) return match[1]
  }

  return trimmed
}

function parseQuotedEnvValue(text: string, key: string): string | undefined {
  const match = new RegExp(`^${key}\\s*=\\s*`, 'm').exec(text)
  if (!match || match.index === undefined) return undefined

  const rest = text.slice(match.index + match[0].length)
  const quote = rest[0]
  if (quote === '"' || quote === "'") {
    let value = ''
    for (let i = 1; i < rest.length; i += 1) {
      const char = rest[i]
      if (char === '\\' && i + 1 < rest.length) {
        value += char + rest[i + 1]
        i += 1
        continue
      }
      if (char === quote) return value
      value += char
    }
    return value
  }

  const end = rest.search(/\r?\n/)
  return (end === -1 ? rest : rest.slice(0, end)).trim()
}

function readEnvFilesForPrivateKey(): string | undefined {
  const files = [
    path.join(/* turbopackIgnore: true */ process.cwd(), '.env.local'),
    path.join(/* turbopackIgnore: true */ process.cwd(), '.env'),
  ]

  for (const filePath of files) {
    try {
      if (!existsSync(/* turbopackIgnore: true */ filePath)) continue
      const text = readFileSync(/* turbopackIgnore: true */ filePath, 'utf8').replace(/^\uFEFF/, '')
      const value = parseQuotedEnvValue(text, 'GOOGLE_PRIVATE_KEY')
      if (value) return value
    } catch {
      // keep looking
    }
  }

  return undefined
}

function readPrivateKeyFromBase64Env(): string | undefined {
  const encoded = process.env.GOOGLE_PRIVATE_KEY_B64?.trim()
  if (!encoded) return undefined
  try {
    return Buffer.from(unwrapQuotes(encoded), 'base64').toString('utf8')
  } catch {
    return undefined
  }
}

function readPrivateKeyFromCredentialsFile(): string | undefined {
  const configured = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  const files = [
    configured,
    path.join(/* turbopackIgnore: true */ process.cwd(), 'secrets', 'google-service-account.json'),
  ].filter((value): value is string => Boolean(value))

  for (const filePath of files) {
    try {
      const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.join(/* turbopackIgnore: true */ process.cwd(), filePath)
      if (!existsSync(/* turbopackIgnore: true */ resolved)) continue
      const parsed = JSON.parse(readFileSync(/* turbopackIgnore: true */ resolved, 'utf8')) as {
        private_key?: string
      }
      if (parsed.private_key) return parsed.private_key
    } catch {
      // keep looking
    }
  }

  return undefined
}

function exportPkcs8Pem(pem: string): string | null {
  try {
    return createPrivateKey(pem)
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
      .replace(/\r\n/g, '\n')
  } catch {
    return null
  }
}

function toUsablePem(raw: string | undefined): string | null {
  if (!raw) return null
  const key = unescapeNewlines(unwrapQuotes(extractServiceAccountPrivateKey(raw))).trim()
  if (!key.includes('BEGIN ') || !key.includes('END ')) return null
  return exportPkcs8Pem(key.endsWith('\n') ? key : `${key}\n`)
}

function normalizeGooglePrivateKey(raw: string | undefined): string | null {
  const sources = [
    readPrivateKeyFromCredentialsFile(),
    readPrivateKeyFromBase64Env(),
    readEnvFilesForPrivateKey(),
    raw,
  ]

  for (const source of sources) {
    const pem = toUsablePem(source)
    if (pem) return pem
  }

  console.error('[Google Calendar] Private key parse failed', {
    envLength: (raw || '').length,
    hasBegin: Boolean(raw?.includes('BEGIN PRIVATE KEY')),
    hasEnd: Boolean(raw?.includes('END PRIVATE KEY')),
    hasEscapedNewline: Boolean(raw?.includes(ESCAPED_NEWLINE)),
    hasRealNewline: Boolean(raw?.includes('\n')),
  })
  return null
}

function formatGoogleCalendarError(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err)

  const raw = err as {
    message?: string
    code?: number | string
    status?: number
    response?: {
      status?: number
      data?: {
        error?: {
          message?: string
          status?: string
          errors?: Array<{ reason?: string; message?: string }>
        }
      }
    }
  }

  const status = raw.response?.status ?? raw.status ?? raw.code
  const googleError = raw.response?.data?.error
  const reason = googleError?.errors?.[0]?.reason || googleError?.status
  const message = googleError?.message || raw.message || 'Unknown Google Calendar error'
  return `[${status || 'error'}] ${reason ? `${reason}: ` : ''}${message}`
}

function sharingHint(calendarId: string, serviceAccountEmail: string): string {
  return `Share calendar "${calendarId}" with ${serviceAccountEmail} as "Make changes to events", and enable the Google Calendar API on the GCP project.`
}

type CalendarClient =
  | { ok: true; calendar: ReturnType<typeof google.calendar>; calendarId: string; email: string }
  | { ok: false; reason: string }

let loggedGoogleKeyMeta = false

function getGoogleCalendarClient(): CalendarClient {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim()
  const privateKey = normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY)

  if (!loggedGoogleKeyMeta) {
    loggedGoogleKeyMeta = true
    const envValue = process.env.GOOGLE_PRIVATE_KEY || ''
    console.log('[Google Calendar] Key source check', {
      envLength: envValue.length,
      hasBegin: envValue.includes('BEGIN PRIVATE KEY'),
      hasEnd: envValue.includes('END PRIVATE KEY'),
      hasEscapedNewline: envValue.includes(ESCAPED_NEWLINE),
      hasRealNewline: envValue.includes('\n'),
      pemHasRealNewline: Boolean(privateKey?.includes('\n')),
      openssl: Boolean(privateKey),
    })
  }

  if (!email || email.includes('your-gcp-project')) {
    return { ok: false, reason: 'GOOGLE_SERVICE_ACCOUNT_EMAIL is missing or still a placeholder.' }
  }
  if (!calendarId || calendarId.includes('your_shop_calendar')) {
    return { ok: false, reason: 'GOOGLE_CALENDAR_ID is missing or still a placeholder.' }
  }
  if (!privateKey) {
    return {
      ok: false,
      reason:
        'GOOGLE_PRIVATE_KEY could not be decoded. Use the PEM from the service-account JSON, keep \\n escapes, and wrap the value in double quotes.',
    }
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    auth.fromJSON({
      client_email: email,
      private_key: privateKey,
    })

    return {
      ok: true,
      calendar: google.calendar({ version: 'v3', auth }),
      calendarId,
      email,
    }
  } catch (err) {
    console.error('[Google Calendar Auth Error]:', formatGoogleCalendarError(err))
    return { ok: false, reason: formatGoogleCalendarError(err) }
  }
}

export function isRealGoogleEventId(eventId?: string | null): boolean {
  return Boolean(eventId && !eventId.startsWith('mock_event_') && !eventId.startsWith('mock_cal_event_'))
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

  if (!gcal.ok) {
    console.error(`[Google Calendar] Event not created: ${gcal.reason}`)
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Google Calendar DEV MOCK] "${summary}" (${appointment.start_time} - ${appointment.end_time}) @ ${location}`
      )
    }
    return null
  }

  try {
    const res = await Promise.race([
      gcal.calendar.events.insert({
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
    }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Google Calendar request timed out')), 12000)
      }),
    ])

    console.log(`[Google Calendar] Event successfully created with ID: ${res.data.id}`)
    return res.data.id || null
  } catch (err: unknown) {
    const errorMsg = formatGoogleCalendarError(err)
    console.error('[Google Calendar Error] Failed to create event:', errorMsg)
    if (/404|403|notFound|forbidden|accessNotConfigured/i.test(errorMsg)) {
      console.error(`[Google Calendar] ${sharingHint(gcal.calendarId, gcal.email)}`)
    }
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

  if (!gcal.ok || !isRealGoogleEventId(eventId)) {
    console.log(
      `[Google Calendar] Event not updated (${!gcal.ok ? gcal.reason : `mock id ${eventId}`}): "${summary}"`
    )
    return false
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
    console.error(
      `[Google Calendar Error] Failed to update event ID ${eventId}:`,
      formatGoogleCalendarError(err)
    )
    return false
  }
}

export async function syncAppointmentToCalendar(
  payload: CalendarEventPayload,
  existingEventId?: string | null
): Promise<string | null> {
  if (isRealGoogleEventId(existingEventId)) {
    const updated = await updateCalendarEvent(existingEventId!, payload)
    if (updated) return existingEventId!
  }
  return createCalendarEvent(payload)
}

/**
 * Deletes or cancels an event on Google Calendar
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const gcal = getGoogleCalendarClient()

  if (!gcal.ok || !isRealGoogleEventId(eventId)) {
    console.log(`[Google Calendar] Event not deleted (${!gcal.ok ? gcal.reason : `mock id ${eventId}`})`)
    return false
  }

  try {
    await gcal.calendar.events.delete({
      calendarId: gcal.calendarId,
      eventId,
    })
    console.log(`[Google Calendar] Event successfully deleted for ID: ${eventId}`)
    return true
  } catch (err: unknown) {
    const errorMsg = formatGoogleCalendarError(err)
    if (/404|410|notFound/i.test(errorMsg)) {
      console.log(`[Google Calendar] Event ${eventId} was already removed`)
      return true
    }
    console.error(`[Google Calendar Error] Failed to delete event ID ${eventId}:`, errorMsg)
    return false
  }
}

export async function deleteCalendarEventForAppointment(
  eventId?: string | null,
  appointmentCode?: string
): Promise<boolean> {
  if (isRealGoogleEventId(eventId)) {
    const deleted = await deleteCalendarEvent(eventId!)
    if (deleted) return true
  }

  const code = appointmentCode?.trim()
  if (!code) return false

  const gcal = getGoogleCalendarClient()
  if (!gcal.ok) return false

  try {
    const res = await gcal.calendar.events.list({
      calendarId: gcal.calendarId,
      q: code,
      singleEvents: true,
      maxResults: 10,
    })

    const matches = (res.data.items || []).filter(
      event =>
        Boolean(event.id) &&
        (event.description?.includes(code) || event.summary?.includes(code))
    )

    if (matches.length === 0) {
      console.log(`[Google Calendar] No event found to delete for ${code}`)
      return false
    }

    const results = await Promise.all(
      matches.map(event => deleteCalendarEvent(event.id as string))
    )
    return results.some(Boolean)
  } catch (err: unknown) {
    console.error(
      `[Google Calendar Error] Failed to find event for ${code}:`,
      formatGoogleCalendarError(err)
    )
    return false
  }
}
