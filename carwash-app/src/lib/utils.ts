/**
 * APEX Detail Studio - Core Utility Helpers
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
 * Generate human-readable unique appointment reference code (e.g. APX-8492)
 */
export function generateAppointmentCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `APX-${num}`
}

/**
 * Calculate total price given service base price, multiplier, and selected addons
 */
export function calculateBookingPrice(
  basePrice: number,
  vehicleMultiplier: number,
  addonPrices: number[]
): number {
  const addonsTotal = addonPrices.reduce((acc, p) => acc + p, 0)
  return Math.round((basePrice * vehicleMultiplier + addonsTotal) * 100) / 100
}
