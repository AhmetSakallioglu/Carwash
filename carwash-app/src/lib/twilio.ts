import twilio from 'twilio'
import { toE164PhoneNumber } from './utils'

export interface BookingSMSContext {
  customerName: string
  customerPhone: string
  appointmentCode: string
  serviceName: string
  dateTimeFormatted: string
  customerAddress: string
  totalPrice: number | string
  cancellationReason?: string
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber || accountSid.startsWith('ACXXXXX')) {
    return null
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber,
  }
}

/**
 * Dispatches Booking Confirmation SMS
 */
export async function sendBookingConfirmedSMS(context: BookingSMSContext): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const twilioConfig = getTwilioClient()
  const to = toE164PhoneNumber(context.customerPhone)
  const messageBody = `OZER Detail Studio: Hi ${context.customerName}, your detailing appointment [${context.appointmentCode}] for ${context.serviceName} on ${context.dateTimeFormatted} is CONFIRMED! Location: ${context.customerAddress}. Total: $${context.totalPrice} (Pay on-site after service). Need to adjust? Call/text (512) 890-2839.`

  if (!twilioConfig) {
    console.log(`[Twilio DEV MOCK] SMS to ${to}:\n${messageBody}`)
    return { success: true, messageId: 'mock-twilio-confirmed-msg-id' }
  }

  try {
    const message = await twilioConfig.client.messages.create({
      body: messageBody,
      from: twilioConfig.fromNumber,
      to,
    })
    console.log(`[Twilio] Confirmation SMS sent to ${to}, SID: ${message.sid}`)
    return { success: true, messageId: message.sid }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send SMS'
    console.error(`[Twilio Error] Failed to send confirmation SMS to ${to}:`, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Dispatches Booking Rescheduled SMS
 */
export async function sendBookingRescheduledSMS(context: BookingSMSContext): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const twilioConfig = getTwilioClient()
  const to = toE164PhoneNumber(context.customerPhone)
  const messageBody = `OZER Detail Studio: Hi ${context.customerName}, your appointment [${context.appointmentCode}] has been RESCHEDULED to ${context.dateTimeFormatted}. Location: ${context.customerAddress}. Estimated Total: $${context.totalPrice}. Questions? Call (512) 890-2839.`

  if (!twilioConfig) {
    console.log(`[Twilio DEV MOCK] Reschedule SMS to ${to}:\n${messageBody}`)
    return { success: true, messageId: 'mock-twilio-rescheduled-msg-id' }
  }

  try {
    const message = await twilioConfig.client.messages.create({
      body: messageBody,
      from: twilioConfig.fromNumber,
      to,
    })
    console.log(`[Twilio] Reschedule SMS sent to ${to}, SID: ${message.sid}`)
    return { success: true, messageId: message.sid }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send SMS'
    console.error(`[Twilio Error] Failed to send reschedule SMS to ${to}:`, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Dispatches Booking Cancelled SMS
 */
export async function sendBookingCancelledSMS(context: BookingSMSContext): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const twilioConfig = getTwilioClient()
  const to = toE164PhoneNumber(context.customerPhone)
  const reasonText = context.cancellationReason ? `Reason: ${context.cancellationReason}.` : ''
  const messageBody = `OZER Detail Studio: Hi ${context.customerName}, your appointment [${context.appointmentCode}] scheduled for ${context.dateTimeFormatted} has been CANCELLED. ${reasonText} To rebook, visit our website or call (512) 890-2839.`

  if (!twilioConfig) {
    console.log(`[Twilio DEV MOCK] Cancellation SMS to ${to}:\n${messageBody}`)
    return { success: true, messageId: 'mock-twilio-cancelled-msg-id' }
  }

  try {
    const message = await twilioConfig.client.messages.create({
      body: messageBody,
      from: twilioConfig.fromNumber,
      to,
    })
    console.log(`[Twilio] Cancellation SMS sent to ${to}, SID: ${message.sid}`)
    return { success: true, messageId: message.sid }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send SMS'
    console.error(`[Twilio Error] Failed to send cancellation SMS to ${to}:`, errorMsg)
    return { success: false, error: errorMsg }
  }
}
