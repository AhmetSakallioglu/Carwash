'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { SelectedConfiguration } from './PricingCalculator'
import { Appointment, LocationZone, TimeSlot, SlotsApiResponse, BookingResponse } from '@/types'
import {
  formatUSPhoneNumber,
  isValidUSPhone,
  formatCurrency,
  formatDurationMinutes,
  hasActiveDiscount,
  calculateBookingPrice,
  matchLocationZone,
  composeServiceAddress,
  OUT_OF_SERVICE_AREA_MESSAGE,
} from '@/lib/utils'
import { X, Calendar, CheckCircle2, AlertCircle, Loader2, CheckCheck, MapPin, Tag } from 'lucide-react'
import { DatePickerCalendar, toISODate } from './DatePickerCalendar'
import { vehicleCategorySizeHint } from '@/lib/settings'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  configuration: SelectedConfiguration | null
  locationZones: LocationZone[]
}

export function BookingModal({ isOpen, onClose, configuration, locationZones }: BookingModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [zipOrCity, setZipOrCity] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [honeypot, setHoneypot] = useState('') // Spam trap field

  // Date selection (defaults to tomorrow if after 5pm, or today)
  const todayStr = toISODate(new Date())
  const [selectedDate, setSelectedDate] = useState(todayStr)

  // Slots state
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlotIso, setSelectedSlotIso] = useState<string>('')
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [slotsMessage, setSlotsMessage] = useState<string>('')

  // Form Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)

  const detectedZone = useMemo(() => {
    return matchLocationZone(`${street} ${zipOrCity}`, locationZones)
  }, [street, zipOrCity, locationZones])

  const liveTravelFee = detectedZone?.travel_fee || 0
  const travelMinutes = detectedZone?.travel_time_minutes || 0

  const liveTotalPrice = useMemo(() => {
    if (!configuration) return 0
    return calculateBookingPrice(
      configuration.selectedService.base_price,
      configuration.selectedCategory.multiplier,
      configuration.selectedAddons.map(addon => addon.price),
      liveTravelFee,
      configuration.selectedService.discount_percentage,
      configuration.selectedService.discount_active
    )
  }, [configuration, liveTravelFee])

  const liveOriginalTotal = useMemo(() => {
    if (!configuration) return 0
    return calculateBookingPrice(
      configuration.selectedService.base_price,
      configuration.selectedCategory.multiplier,
      configuration.selectedAddons.map(addon => addon.price),
      liveTravelFee,
      0,
      false
    )
  }, [configuration, liveTravelFee])

  const liveDiscountSavings = Math.max(0, liveOriginalTotal - liveTotalPrice)

  // Fetch available slots from backend engine with travel time buffer
  const fetchAvailableSlots = useCallback(
    async (date: string, serviceId?: string, addonIds?: string[], zip?: string) => {
      if (!date || !zip) return
      setIsLoadingSlots(true)
      setSlotsMessage('')
      setSelectedSlotIso('')

      try {
        const addonQuery = (addonIds || []).join(',')
        const res = await fetch(
          `/api/slots?date=${date}&serviceId=${serviceId || ''}&addonIds=${addonQuery}&zip=${encodeURIComponent(zip)}`
        )
        const data: SlotsApiResponse = await res.json()

        if (data.success) {
          if (!data.isOpen) {
            setSlots([])
            setSlotsMessage(data.message || "We're closed on this day.")
          } else if (data.slots.length === 0) {
            setSlots([])
            setSlotsMessage('No available time slots remaining for this date. Please select another day.')
          } else {
            setSlots(data.slots)
            setSelectedSlotIso(data.slots[0].startIso)
          }
        } else {
          setSlots([])
          setSlotsMessage(data.message || 'Error checking slot availability.')
        }
      } catch {
        setSlots([])
        setSlotsMessage('Unable to connect to scheduling server. Please try again.')
      } finally {
        setIsLoadingSlots(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!isOpen) return
    const prefill = configuration?.serviceZip?.trim()
    if (prefill) {
      setZipOrCity(prefill)
    }
  }, [isOpen, configuration])

  // Trigger slot fetch whenever selectedDate, ZIP, or configuration changes
  useEffect(() => {
    if (isOpen && configuration && selectedDate && detectedZone) {
      const addonIds = configuration.selectedAddons.map(a => a.id)
      fetchAvailableSlots(
        selectedDate,
        configuration.selectedService.id,
        addonIds,
        zipOrCity.trim()
      )
    } else if (isOpen) {
      setSlots([])
      setSelectedSlotIso('')
      setSlotsMessage(
        zipOrCity.trim()
          ? OUT_OF_SERVICE_AREA_MESSAGE
          : 'Enter your street address and ZIP (or city) to load available times.'
      )
    }
  }, [isOpen, selectedDate, configuration, fetchAvailableSlots, detectedZone, zipOrCity])

  // Handle phone typing with US Auto-Formatter: (512) 123-4567
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUSPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  // Handle Booking Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // 1. Anti-Spam Honeypot Trap
    if (honeypot.trim() !== '') {
      console.warn('[Spam Detection] Honeypot field triggered.')
      return
    }

    // 2. Client-side Rate Limiting (30-second cooldown)
    const lastBooking = localStorage.getItem('last_ozer_booking')
    const now = Date.now()
    if (lastBooking && now - parseInt(lastBooking, 10) < 30000) {
      setErrorMessage('Please wait a moment before submitting another booking request.')
      return
    }

    // 3. US Phone Validation
    if (!isValidUSPhone(phone)) {
      setErrorMessage('Please enter a valid 10-digit US phone number (e.g. (512) 555-0199).')
      return
    }

    if (!street.trim()) {
      setErrorMessage('Please enter the street address where we should arrive.')
      return
    }

    if (!zipOrCity.trim() || !detectedZone) {
      setErrorMessage(OUT_OF_SERVICE_AREA_MESSAGE)
      return
    }

    if (!selectedSlotIso) {
      setErrorMessage('Please select an available time slot for your service.')
      return
    }

    if (!configuration) {
      setErrorMessage('Please select a service package first.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        website_trap: honeypot,
        customer_name: name,
        customer_phone: phone,
        customer_address: composeServiceAddress(street, zipOrCity),
        zip_code: zipOrCity.trim(),
        vehicle_details: vehicle,
        service_id: configuration.selectedService.id,
        vehicle_category_id: configuration.selectedCategory.id,
        selected_addon_ids: configuration.selectedAddons.map(a => a.id),
        start_time: selectedSlotIso,
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      })

      let data: BookingResponse
      try {
        data = (await res.json()) as BookingResponse
      } catch {
        setErrorMessage('Could not read the booking response. Please try again.')
        setIsSubmitting(false)
        return
      }

      if (data.success) {
        localStorage.setItem('last_ozer_booking', now.toString())
        setConfirmedAppointment(data.appointment || null)
        setConfirmedBookingCode(data.appointment?.appointment_code || 'CONFIRMED')
        setIsSubmitting(false)
        return
      }

      setErrorMessage(data.error || 'Failed to confirm reservation. Please try again.')
    } catch {
      setErrorMessage('Server connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetAndClose = () => {
    setConfirmedBookingCode(null)
    setConfirmedAppointment(null)
    setErrorMessage(null)
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen || !configuration) return null

  const hasDiscount = hasActiveDiscount(
    configuration.selectedService.discount_percentage,
    configuration.selectedService.discount_active
  )
  const serviceDuration = configuration.selectedService.duration_minutes
  const addonsDuration = configuration.selectedAddons.reduce((acc, a) => acc + a.duration_minutes, 0)
  const confirmationZone = confirmedAppointment?.location_zone || detectedZone
  const confirmationTravelFee = confirmedAppointment?.travel_fee ?? liveTravelFee
  const confirmationTravelMinutes = confirmedAppointment?.travel_time_minutes ?? travelMinutes
  const confirmationTotal = confirmedAppointment?.total_price ?? liveTotalPrice
  const confirmationAddress = confirmedAppointment?.customer_address || composeServiceAddress(street, zipOrCity)
  const reservedDuration = serviceDuration + addonsDuration + confirmationTravelMinutes

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-lg glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          type="button"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedBookingCode ? (
          /* Confirmation Success View */
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-cyan-500/20 text-brand-neon rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-cyan/40">
              <CheckCheck className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-brand-cyan/30 rounded-full text-brand-neon text-xs font-mono font-bold mb-3">
              CONFIRMATION CODE: {confirmedBookingCode}
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-2">
              Reservation Confirmed!
            </h3>

            <p className="text-xs text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed">
              We received your detailing request for{' '}
              <strong className="text-white">{configuration.selectedService.name}</strong>. An
              automated SMS confirmation with full breakdown has been sent to{' '}
              <span className="text-brand-neon font-semibold">{phone}</span>.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2.5 mb-6 text-slate-300">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">Service:</span>
                <span className="font-semibold text-white text-right break-words">
                  {configuration.selectedService.name} ({configuration.selectedCategory.label} · {vehicleCategorySizeHint(configuration.selectedCategory.label)})
                </span>
              </div>

              {hasDiscount && (
                <div className="flex justify-between gap-3 text-emerald-400 font-semibold">
                  <span>Promotional Deal:</span>
                  <span>
                    SAVE {configuration.selectedService.discount_percentage}% OFF
                    {liveDiscountSavings > 0
                      ? ` (${formatCurrency(liveDiscountSavings)} saved)`
                      : ''}
                  </span>
                </div>
              )}

              {configuration.selectedAddons.length > 0 && (
                <div className="flex justify-between gap-3 text-slate-400">
                  <span>Add-Ons:</span>
                  <span className="text-right">{configuration.selectedAddons.map(a => a.name).join(', ')}</span>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">Transit Zone & Travel Fee:</span>
                <span className="text-white text-right break-words">
                  {confirmationZone?.zone_name || 'Greater Austin'}{' '}
                  <strong className="text-brand-neon">
                    ({confirmationTravelFee > 0 ? `+${formatCurrency(confirmationTravelFee)}` : '$0 Free Travel'})
                  </strong>
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">Reserved Slot Block:</span>
                <span className="text-white text-right">
                  {formatDurationMinutes(reservedDuration)}
                  <span className="text-slate-500 block">
                    {formatDurationMinutes(serviceDuration)} service
                    {addonsDuration > 0 ? ` + ${formatDurationMinutes(addonsDuration)} add-ons` : ''}
                    {confirmationTravelMinutes > 0 ? ` + ${confirmationTravelMinutes}m travel buffer` : ''}
                  </span>
                </span>
              </div>

              <div className="flex justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-bold">Estimated Total:</span>
                <span className="font-bold text-brand-neon text-base">
                  {formatCurrency(confirmationTotal)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Payment:</span>
                <span className="text-emerald-400 font-semibold text-right">Pay On-Site After Service</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">Austin Address:</span>
                <span className="text-white text-right break-words">{confirmationAddress}</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              type="button"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Done
            </button>
          </div>
        ) : (
          /* Booking Form View */
          <div>
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" /> Austin Mobile Detailing
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Confirm Appointment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                No upfront payment required. Pay after service inspection on-site.
              </p>
            </div>

            {/* Selected Summary Box */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 block text-[11px]">Configured Package:</span>
                  {hasDiscount && (
                    <span className="text-[10px] font-black text-brand-neon bg-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> SAVE {configuration.selectedService.discount_percentage}%
                    </span>
                  )}
                </div>
                <span className="font-bold text-white break-words">
                  {configuration.selectedService.name}{' '}
                  <span className="text-slate-400 font-normal">
                    ({configuration.selectedCategory.label} · {vehicleCategorySizeHint(configuration.selectedCategory.label)})
                  </span>
                </span>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-cyan" />
                  {detectedZone ? (
                    <>
                      <span>{detectedZone.zone_name}</span>
                      {detectedZone.travel_fee > 0 && (
                        <span className="text-brand-neon font-semibold">
                          (+{formatCurrency(detectedZone.travel_fee)} Travel Fee)
                        </span>
                      )}
                    </>
                  ) : (
                    <span>Enter ZIP to assign travel zone</span>
                  )}
                </div>
                {configuration.selectedAddons.length > 0 && (
                  <span className="text-[10px] text-brand-cyan block mt-0.5 break-words">
                    +{configuration.selectedAddons.map(a => a.name).join(', ')}
                  </span>
                )}
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-slate-400 block text-[11px]">Total Price:</span>
                <span className="font-bold text-brand-neon text-base">
                  {formatCurrency(liveTotalPrice)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Slot {formatDurationMinutes(serviceDuration + addonsDuration + travelMinutes)}
                </span>
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Invisible Honeypot field for bot spam trap */}
              <input
                type="text"
                name="website_trap"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                className="hp-field"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(512) 000-0000"
                    maxLength={14}
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="e.g. 11723 N FM 620"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  ZIP Code or City *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="postal-code"
                  placeholder="e.g. 78701, 78681, 78626 or Georgetown"
                  value={zipOrCity}
                  onChange={e => setZipOrCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
                />
                {detectedZone ? (
                  <p className="mt-1.5 text-[11px] text-brand-neon">
                    Auto-assigned {detectedZone.zone_name} —{' '}
                    {detectedZone.travel_fee > 0
                      ? `+${formatCurrency(detectedZone.travel_fee)} travel fee, ${detectedZone.travel_time_minutes}m transit`
                      : `$0 travel fee, ${detectedZone.travel_time_minutes}m transit`}
                  </p>
                ) : zipOrCity.trim() ? (
                  <p className="mt-1.5 text-[11px] text-amber-300/90">{OUT_OF_SERVICE_AREA_MESSAGE}</p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Travel fee is assigned from your ZIP. You cannot pick a cheaper zone.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-2">
                  Preferred Date *
                </label>
                <DatePickerCalendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={todayStr}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>
                    Available Slot
                    {detectedZone ? ` (Includes ${detectedZone.travel_time_minutes}m travel buffer)` : ''} *
                  </span>
                  {isLoadingSlots && <Loader2 className="w-3 h-3 animate-spin text-brand-cyan" />}
                </label>

                {!detectedZone ? (
                  <div className="w-full bg-slate-950/80 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-amber-300/90 text-[11px]">
                    {slotsMessage || 'Enter a Greater Austin ZIP to load available times.'}
                  </div>
                ) : isLoadingSlots ? (
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking slot availability with transit buffer...
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((s, idx) => {
                      const active = s.startIso === selectedSlotIso
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlotIso(s.startIso)}
                          className={`px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                            active
                              ? 'bg-brand-cyan text-black border-brand-cyan'
                              : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-brand-cyan/50'
                          }`}
                        >
                          {s.time}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="w-full bg-slate-950/80 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-amber-300/90 text-[11px]">
                    {slotsMessage || 'No slots available'}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Vehicle Make / Model / Year *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024 Tesla Model Y / 2021 BMW M3"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || slots.length === 0 || !detectedZone}
                className={`w-full mt-2 py-3.5 text-black font-bold text-sm rounded-xl transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2 ${
                  isSubmitting || slots.length === 0 || !detectedZone
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-brand-neon hover:bg-cyan-300 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Confirming Austin Reservation...</span>
                    <span className="sm:hidden">Confirming...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Austin Reservation</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
