import twilio from 'twilio'
import { toE164PhoneNumber, formatCurrency, formatDurationMinutes } from './utils'

export interface BookingSMSContext {
  customerName: string
  customerPhone: string
  appointmentCode: string
  serviceName: string
  dateTimeFormatted: string
  customerAddress: string
  totalPrice: number | string
  zoneName?: string
  travelFee?: number
  travelTimeMinutes?: number
  totalDurationMinutes?: number
  discountSavings?: number
  cancellationReason?: string
  businessName?: string
  businessPhone?: string
}

function brandLabel(context: BookingSMSContext): string {
  return context.businessName?.trim() || 'Ozer Auto Detailing'
}

function contactPhone(context: BookingSMSContext): string {
  return context.businessPhone?.trim() || '(512) 890-2839'
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()

  if (!accountSid || !authToken || !fromNumber || accountSid.startsWith('ACXXXXX')) {
    return null
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber: toE164PhoneNumber(fromNumber),
  }
}

/**
 * Send a single SMS via Twilio. `to` is normalized to E.164 with a +1 US prefix.
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const twilioConfig = getTwilioClient()
  const e164To = toE164PhoneNumber(to)

  if (!twilioConfig) {
    console.warn(
      '[Twilio] Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER — SMS not sent.'
    )
    console.log(`[Twilio DEV MOCK] SMS to ${e164To}:\n${message}`)
    return { success: true, messageId: 'mock-twilio-msg-id' }
  }

  try {
    const result = await twilioConfig.client.messages.create({
      body: message,
      from: twilioConfig.fromNumber,
      to: e164To,
    })
    console.log(`[Twilio] SMS sent to ${e164To}, SID: ${result.sid}`)
    return { success: true, messageId: result.sid }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send SMS'
    console.error(`[Twilio Error] Failed to send SMS to ${e164To}:`, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Dispatches Booking Confirmation SMS
 */
export async function sendBookingConfirmedSMS(
  context: BookingSMSContext
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const travelFeeAmount = Number(context.travelFee || 0)
  const travelFeeLabel =
    travelFeeAmount > 0
      ? ` (includes ${formatCurrency(travelFeeAmount)} travel fee)`
      : ' (no travel fee)'
  const durationInfo = context.totalDurationMinutes
    ? ` Duration: ${formatDurationMinutes(context.totalDurationMinutes)}.`
    : ''
  const savingsInfo =
    context.discountSavings && context.discountSavings > 0
      ? ` Promo savings: ${formatCurrency(context.discountSavings)}.`
      : ''

  const messageBody = [
    `${brandLabel(context)}: Hi ${context.customerName}, your booking is CONFIRMED.`,
    `Code: ${context.appointmentCode}.`,
    `Service: ${context.serviceName}.`,
    `Start: ${context.dateTimeFormatted}.`,
    `Total: ${formatCurrency(Number(context.totalPrice))}${travelFeeLabel}.`,
    durationInfo.trim(),
    savingsInfo.trim(),
    `Location: ${context.customerAddress}. Pay on-site. Questions? Call/text ${contactPhone(context)}.`,
  ]
    .filter(Boolean)
    .join(' ')

  return sendSMS(context.customerPhone, messageBody)
}

/**
 * Dispatches Booking Rescheduled SMS
 */
export async function sendBookingRescheduledSMS(
  context: BookingSMSContext
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const messageBody = `${brandLabel(context)}: Hi ${context.customerName}, your appointment [${context.appointmentCode}] has been RESCHEDULED to ${context.dateTimeFormatted}. Location: ${context.customerAddress}. Estimated Total: ${formatCurrency(Number(context.totalPrice))}. Questions? Call ${contactPhone(context)}.`
  return sendSMS(context.customerPhone, messageBody)
}

/**
 * Dispatches Booking Cancelled SMS
 */
export async function sendBookingCancelledSMS(
  context: BookingSMSContext
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const reasonText = context.cancellationReason ? ` Reason: ${context.cancellationReason}.` : ''
  const messageBody = `${brandLabel(context)}: Hi ${context.customerName}, your appointment [${context.appointmentCode}] scheduled for ${context.dateTimeFormatted} has been CANCELLED.${reasonText} To rebook, visit our website or call ${contactPhone(context)}.`
  return sendSMS(context.customerPhone, messageBody)
}
