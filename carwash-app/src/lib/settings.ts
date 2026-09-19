import { BusinessSchedule, BusinessSettings } from '@/types'
import { MOCK_BUSINESS_SETTINGS } from '@/lib/supabase/mock-data'

export const HOMEPAGE_BEFORE_AFTER_CATEGORY = '__homepage_before_after__'

function remapLegacyBrandName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return MOCK_BUSINESS_SETTINGS.business_name
  if (/apex|\bapx\b/i.test(trimmed) || trimmed === 'OZER Detail Studio') {
    return 'Ozer Auto Detailing'
  }
  return trimmed
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeBusinessSettings(
  raw?: Partial<BusinessSettings> | null
): BusinessSettings {
  const source = raw || {}
  return {
    ...MOCK_BUSINESS_SETTINGS,
    ...source,
    business_name: remapLegacyBrandName(source.business_name || MOCK_BUSINESS_SETTINGS.business_name),
    tagline: source.tagline?.trim() || MOCK_BUSINESS_SETTINGS.tagline,
    phone: source.phone?.trim() || MOCK_BUSINESS_SETTINGS.phone,
    email: source.email?.trim() || MOCK_BUSINESS_SETTINGS.email,
    address: source.address?.trim() || MOCK_BUSINESS_SETTINGS.address,
    show_google_reviews:
      source.show_google_reviews === undefined
        ? MOCK_BUSINESS_SETTINGS.show_google_reviews
        : Boolean(source.show_google_reviews),
    google_place_id: source.google_place_id?.trim() || '',
    hero_vehicles_count: Math.max(
      0,
      Math.round(toNumber(source.hero_vehicles_count, MOCK_BUSINESS_SETTINGS.hero_vehicles_count))
    ),
    hero_rating_override: toNullableNumber(source.hero_rating_override),
    hero_review_count_override: toNullableNumber(source.hero_review_count_override),
    hero_stat_3_value: source.hero_stat_3_value?.trim() || MOCK_BUSINESS_SETTINGS.hero_stat_3_value,
    hero_stat_3_label: source.hero_stat_3_label?.trim() || MOCK_BUSINESS_SETTINGS.hero_stat_3_label,
    hero_stat_4_value: source.hero_stat_4_value?.trim() || MOCK_BUSINESS_SETTINGS.hero_stat_4_value,
    hero_stat_4_label: source.hero_stat_4_label?.trim() || MOCK_BUSINESS_SETTINGS.hero_stat_4_label,
    show_before_after:
      source.show_before_after === undefined
        ? MOCK_BUSINESS_SETTINGS.show_before_after
        : Boolean(source.show_before_after),
    before_after_before_image_url:
      source.before_after_before_image_url?.trim() ||
      MOCK_BUSINESS_SETTINGS.before_after_before_image_url,
    before_after_after_image_url:
      source.before_after_after_image_url?.trim() ||
      MOCK_BUSINESS_SETTINGS.before_after_after_image_url,
    slot_interval_minutes: toNumber(
      source.slot_interval_minutes,
      MOCK_BUSINESS_SETTINGS.slot_interval_minutes
    ),
  }
}

export function businessSettingsHasBeforeAfterColumns(
  raw?: Record<string, unknown> | null
): boolean {
  return typeof raw?.show_before_after === 'boolean'
}

export function overlayBeforeAfterSettings(
  settings: BusinessSettings,
  source?: {
    is_active?: boolean
    image_url?: string | null
    before_image_url?: string | null
  } | null
): BusinessSettings {
  if (!source) return settings
  return {
    ...settings,
    show_before_after: Boolean(source.is_active),
    before_after_before_image_url:
      source.before_image_url?.trim() || settings.before_after_before_image_url,
    before_after_after_image_url: source.image_url?.trim() || settings.before_after_after_image_url,
  }
}

export function phoneTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:${digits}` : 'tel:'
}

export function formatClockTime(time: string): string {
  const [rawHours, rawMinutes] = time.split(':')
  const hours = Number(rawHours)
  const minutes = Number(rawMinutes)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  const mins = minutes.toString().padStart(2, '0')
  return `${hours12}:${mins} ${period}`
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function groupScheduleHours(
  schedules: BusinessSchedule[]
): Array<{ label: string; hours: string; closed?: boolean }> {
  const byDay = new Map(schedules.map(item => [item.day_of_week, item]))
  const rows: Array<{ start: number; end: number; hours: string; closed: boolean }> = []

  const orderedDays = [1, 2, 3, 4, 5, 6, 0]
  for (const day of orderedDays) {
    const schedule = byDay.get(day)
    const closed = !schedule?.is_open
    const hours = closed
      ? 'Closed'
      : `${formatClockTime(schedule.open_time)} - ${formatClockTime(schedule.close_time)}`

    const previous = rows[rows.length - 1]
    const isConsecutive =
      previous &&
      previous.hours === hours &&
      ((previous.end === day - 1 && day !== 0) || (previous.end === 6 && day === 0 && previous.start !== 0))
    if (isConsecutive) {
      previous.end = day
      continue
    }

    rows.push({ start: day, end: day, hours, closed })
  }

  return rows.map(row => ({
    label: row.start === row.end ? DAY_LABELS[row.start] : `${DAY_LABELS[row.start]} - ${DAY_LABELS[row.end]}`,
    hours: row.hours,
    closed: row.closed,
  }))
}

export function vehicleCategorySizeHint(label: string, sizeKey?: string | null): string {
  if (sizeKey === 'sedan') return 'Cars & 2-door'
  if (sizeKey === 'suv') return 'Crossovers & mid-size SUVs'
  if (sizeKey === 'truck') return 'Trucks, 3-row SUVs & vans'

  const normalized = label.toLowerCase()
  if (normalized.includes('sedan') || normalized.includes('coupe')) return 'Cars & 2-door'
  if (normalized.includes('crossover') || normalized.includes('suv')) {
    return 'Crossovers & mid-size SUVs'
  }
  if (normalized.includes('truck') || normalized.includes('van') || normalized.includes('3-row')) {
    return 'Trucks, 3-row SUVs & vans'
  }
  return 'Vehicle class'
}
