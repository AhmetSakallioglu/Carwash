/**
 * Ozer Auto Detailing - Core Utility Helpers
 * Austin, Texas, USA
 */

export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Chicago'

/**
 * Format raw string into standard US Phone Number format: (XXX) XXX-XXXX
 */
export function formatUSPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

/**
 * Clean and convert US phone number to E.164 (+1XXXXXXXXXX) for Twilio
 */
export function toE164PhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  return `+1${digits.slice(-10)}`
}

/**
 * Validate that phone number contains exactly 10 valid US digits
 */
export function isValidUSPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return true
  if (digits.length === 11 && digits.startsWith('1')) return true
  return false
}

/**
 * Format currency amount into USD format ($XX.XX)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format ISO datetime string into human readable Central Time date & time
 * e.g., "Thursday, Sep 17, 2026 at 09:00 AM (CT)"
 */
export function formatDateTimeCT(dateString: string): string {
  try {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d)
  } catch {
    return dateString
  }
}

/**
 * Format ISO datetime string to 12-hour time (e.g., "09:00 AM")
 */
export function formatTimeOnlyCT(dateString: string): string {
  try {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d)
  } catch {
    return dateString
  }
}

/**
 * Generate human-readable unique appointment reference code (e.g. OZER-8492)
 */
export function generateAppointmentCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `OZER-${num}`
}

/**
 * Format a duration in minutes into a compact human label (e.g. "2h 30m")
 */
export function formatDurationMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes || 0))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  if (hours <= 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/**
 * Dropdown / summary label for a service area zone
 */
export function formatLocationZoneOption(zone: {
  zone_name: string
  travel_fee: number
  travel_time_minutes: number
}): string {
  const feeLabel =
    zone.travel_fee > 0
      ? `+${formatCurrency(zone.travel_fee)} Travel Fee`
      : '$0 Travel Fee'
  return `${zone.zone_name} — ${feeLabel}`
}

export const OUT_OF_SERVICE_AREA_MESSAGE =
  'We do not currently service this location. Enter a Greater Austin street address with a 5-digit ZIP (e.g. 78701, 78681, 78626) or city such as Georgetown, Round Rock, or Cedar Park.'

/**
 * Extract a 5-digit US ZIP from free-text address / ZIP input.
 */
export function extractZipCode(input: string): string | null {
  const match = String(input || '').match(/\b(\d{5})(?:-\d{4})?\b/)
  return match ? match[1] : null
}

type MatchableLocationZone = {
  zone_name: string
  zip_codes?: string[] | null
  is_active?: boolean | null
  sort_order?: number | null
  travel_fee?: number | null
  travel_time_minutes?: number | null
}

const CITY_ZONE_HINTS: Array<{ pattern: RegExp; nameIncludes: string[] }> = [
  {
    pattern: /\b(san\s*marcos|georgetown|buda|kyle)\b/i,
    nameIncludes: ['georgetown', 'buda', 'san marcos'],
  },
  {
    pattern: /\b(lakeway|west\s*lake|westlake|bee\s*cave)\b/i,
    nameIncludes: ['west lake', 'lakeway'],
  },
  {
    pattern: /\b(round\s*rock|cedar\s*park|pflugerville|leander|\bdomain\b)\b/i,
    nameIncludes: ['round rock', 'cedar park', 'domain'],
  },
  {
    pattern: /\b(downtown|central austin)\b/i,
    nameIncludes: ['central austin', 'downtown'],
  },
  {
    pattern: /\baustin\b/i,
    nameIncludes: ['central austin', 'downtown'],
  },
]

function normalizedZoneZips(zone: MatchableLocationZone): string[] {
  return (zone.zip_codes || []).map(code => String(code).trim().slice(0, 5)).filter(Boolean)
}

/**
 * Match a street/ZIP/city string against location_zones.zip_codes.
 * ZIP is authoritative: an unmatched 5-digit ZIP never falls back to a cheaper city zone.
 * If multiple ZIPs are present, the highest travel-fee zone wins so clients cannot
 * pair a cheap ZIP with a far-north address.
 */
export function matchLocationZone<T extends MatchableLocationZone>(
  addressOrZip: string,
  zones: T[]
): T | null {
  const active = zones
    .filter(zone => zone.is_active !== false)
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  if (active.length === 0) return null

  const zips = Array.from(
    new Set(
      [...String(addressOrZip || '').matchAll(/\b(\d{5})(?:-\d{4})?\b/g)].map(match => match[1])
    )
  )

  if (zips.length > 0) {
    const matchedZones = zips.map(
      zip => active.find(zone => normalizedZoneZips(zone).includes(zip)) || null
    )
    if (matchedZones.some(zone => zone === null)) return null

    return matchedZones.reduce((best, zone) => {
      if (!best) return zone
      if (!zone) return best
      const bestFee = Number(best.travel_fee || 0)
      const zoneFee = Number(zone.travel_fee || 0)
      if (zoneFee !== bestFee) return zoneFee > bestFee ? zone : best
      return Number(zone.travel_time_minutes || 0) > Number(best.travel_time_minutes || 0)
        ? zone
        : best
    }, matchedZones[0])
  }

  const haystack = String(addressOrZip || '').toLowerCase()
  for (const hint of CITY_ZONE_HINTS) {
    if (!hint.pattern.test(haystack)) continue
    const hit = active.find(zone =>
      hint.nameIncludes.some(keyword => zone.zone_name.toLowerCase().includes(keyword))
    )
    if (hit) return hit
  }

  return null
}

/**
 * Combine street + ZIP/city into the stored customer_address string.
 */
export function composeServiceAddress(street: string, zipOrCity: string): string {
  const streetPart = street.trim()
  const locationPart = zipOrCity.trim()
  if (streetPart && locationPart) return `${streetPart}, ${locationPart}`
  return streetPart || locationPart
}

/**
 * True when a promotional discount should be applied to a service package
 */
export function hasActiveDiscount(
  discountPercentage = 0,
  discountActive = false
): boolean {
  return Boolean(discountActive && discountPercentage > 0)
}

/**
 * Calculate discounted base price
 */
export function calculateDiscountedBasePrice(
  basePrice: number,
  discountPercentage = 0,
  discountActive = false
): number {
  if (!hasActiveDiscount(discountPercentage, discountActive)) {
    return basePrice
  }
  const factor = Math.max(0, 1 - discountPercentage / 100)
  return Math.round(basePrice * factor * 100) / 100
}

/**
 * Calculate total price from the selected package-size rate, add-ons,
 * optional travel fee, and promotional discount. No vehicle multipliers.
 */
export function calculateBookingPrice(
  packagePrice: number,
  addonPrices: number[],
  travelFee = 0,
  discountPercentage = 0,
  discountActive = false
): number {
  const effectivePackage = calculateDiscountedBasePrice(packagePrice, discountPercentage, discountActive)
  const addonsTotal = addonPrices.reduce((acc, p) => acc + p, 0)
  return Math.round((effectivePackage + addonsTotal + travelFee) * 100) / 100
}
