import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Footer } from '@/components/Footer'
import { BackgroundOrbs } from '@/components/BackgroundOrbs'
import { getBusinessSchedules, getBusinessSettings } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Ozer Auto Detailing. Booking, payment, cancellation, and service terms for mobile auto detailing in Austin, TX and surrounding areas.',
  alternates: {
    canonical: '/terms',
  },
}

export default async function TermsOfServicePage() {
  const [settings, schedules] = await Promise.all([
    getBusinessSettings(),
    getBusinessSchedules(),
  ])

  return (
    <div className="relative min-h-screen">
      <BackgroundOrbs />

      <header className="relative z-10 px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group min-w-0">
            <Sparkles className="w-5 h-5 text-brand-neon group-hover:rotate-12 transition duration-300 shrink-0" />
            <BrandMark name={settings.business_name} className="text-lg sm:text-xl truncate" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-6 py-10 sm:py-16">
        <article className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan mb-3">
            Legal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400 mb-10">
            Last updated: September 18, 2026
          </p>

          <div className="space-y-10 text-sm leading-relaxed text-slate-300">
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Agreement</h2>
              <p>
                These Terms of Service govern use of the Ozer Auto Detailing website and
                booking of our mobile detailing services. By booking an appointment or using
                this website, you agree to these terms.
              </p>
              <p>
                Ozer Auto Detailing provides mobile detailing services in Austin, TX and
                surrounding areas, including Greater Austin and Travis County — Downtown
                Austin, South Austin, East Austin, The Domain, West Lake Hills, Round Rock,
                Cedar Park, Lakeway, Georgetown, Pflugerville, Buda, Kyle, and San Marcos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Services</h2>
              <p>
                We perform mobile auto detailing at the address you provide. Service time,
                travel fees, and package pricing are calculated at booking based on the
                selected service, vehicle category, add-ons, and service ZIP or city.
              </p>
              <p>
                Quoted prices are estimates. Final pricing may change if the vehicle
                condition, size, or add-on work differs from what was booked. Any change
                will be reviewed with you on-site before extra work begins.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Booking &amp; Appointments
              </h2>
              <p>
                Submitting a booking request reserves a time block on our calendar. You are
                responsible for providing an accurate name, phone number, service address,
                and vehicle details.
              </p>
              <p>
                We must be able to safely access the vehicle at the scheduled time. If we
                cannot reach the location, park, or access the vehicle, the appointment may
                be rescheduled or cancelled.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Payment
              </h2>
              <p>
                No upfront payment is required to book. Payment is due on-site after the
                service is completed, unless we agree otherwise. We accept common on-site
                payment methods as offered at the time of service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Cancellations &amp; Rescheduling
              </h2>
              <p>
                You may request to cancel or reschedule by contacting us by phone, email, or
                SMS. Please give as much notice as possible so we can offer the slot to
                another customer.
              </p>
              <p>
                Repeated no-shows, late cancellations, or inaccessible vehicles may result
                in declined future bookings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">SMS Notifications</h2>
              <p>
                By providing your phone number when booking, you agree to receive
                transactional appointment updates and notifications via SMS from Ozer Auto
                Detailing. Message and data rates may apply. Reply STOP to cancel anytime or
                HELP for assistance. Message frequency varies based on appointment activity.
              </p>
              <p>
                Review our{' '}
                <Link href="/privacy-policy" className="text-brand-neon hover:underline">
                  Privacy Policy
                </Link>{' '}
                for how we handle mobile information and opt-in consent.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Vehicle Condition &amp; Liability
              </h2>
              <p>
                Detailing involves cleaning, washing, and surface care. We take reasonable
                care with your vehicle, but we are not responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Pre-existing paint damage, chips, scratches, rust, or clear-coat failure</li>
                <li>Loose trim, aftermarket parts, or items left in the vehicle</li>
                <li>Damage caused by poor prior repairs, wraps, or failing coatings</li>
                <li>Weather, water restrictions, or site conditions outside our control</li>
              </ul>
              <p>
                Please remove valuables and personal items before we arrive. Results can
                vary based on the vehicle&apos;s starting condition.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Website Use
              </h2>
              <p>
                You may not misuse this website, attempt unauthorized access, or submit
                false booking information. Website content, branding, and photos are owned
                by Ozer Auto Detailing and may not be copied for commercial use without
                permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Changes
              </h2>
              <p>
                We may update these Terms of Service from time to time. The updated version
                will be posted on this page with a new “Last updated” date. Continued use of
                the website or booking of services after an update means you accept the
                revised terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Contact Us</h2>
              <p>
                Questions about these Terms of Service can be sent to Ozer Auto Detailing:
              </p>
              <ul className="space-y-1.5 text-slate-200">
                <li>
                  Phone:{' '}
                  <a href={`tel:${settings.phone.replace(/\D/g, '')}`} className="text-brand-neon hover:underline">
                    {settings.phone}
                  </a>
                </li>
                <li>
                  Email:{' '}
                  <a href={`mailto:${settings.email}`} className="text-brand-neon hover:underline">
                    {settings.email}
                  </a>
                </li>
                <li>Service area: Austin, TX and surrounding areas</li>
                <li>
                  <Link href="/privacy-policy" className="text-brand-neon hover:underline">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>

      <div className="relative z-10">
        <Footer settings={settings} schedules={schedules} />
      </div>
    </div>
  )
}
