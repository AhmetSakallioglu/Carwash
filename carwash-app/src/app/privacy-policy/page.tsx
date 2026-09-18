import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Footer } from '@/components/Footer'
import { BackgroundOrbs } from '@/components/BackgroundOrbs'
import { getBusinessSchedules, getBusinessSettings } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Ozer Auto Detailing. How we collect, use, and protect customer information, including SMS appointment notifications for our Austin, TX mobile detailing service.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

export default async function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400 mb-10">
            Last updated: September 18, 2026
          </p>

          <div className="space-y-10 text-sm leading-relaxed text-slate-300">
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Who We Are</h2>
              <p>
                Ozer Auto Detailing provides mobile detailing services in Austin, TX and
                surrounding areas. We come to your home or office throughout Greater Austin
                and Travis County, including Downtown Austin, South Austin, East Austin, The
                Domain, West Lake Hills, Round Rock, Cedar Park, Lakeway, Georgetown,
                Pflugerville, Buda, Kyle, and San Marcos.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, and protect personal
                information when you visit our website, book an appointment, or communicate
                with us by phone, email, or SMS.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Information We Collect
              </h2>
              <p>When you request a booking or contact us, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your name and phone number</li>
                <li>Service address, ZIP code, or city</li>
                <li>Vehicle make, model, and year</li>
                <li>Selected service, add-ons, date, and time</li>
                <li>Messages you send to us, including SMS replies such as STOP or HELP</li>
              </ul>
              <p>
                We use this information only to schedule, confirm, fulfill, and support your
                mobile detailing appointment.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">
                SMS Messaging &amp; Mobile Information
              </h2>
              <p>
                By providing your phone number when booking, you consent to receive
                transactional SMS messages from Ozer Auto Detailing related to your
                appointment. We do not send marketing or promotional text messages.
              </p>

              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 sm:p-5 space-y-4">
                <p className="text-white font-medium">
                  No mobile information will be shared with third parties/affiliates for
                  marketing or promotional purposes. All other categories exclude text
                  messaging originator opt-in data and consent; this information will not be
                  shared with any third parties.
                </p>
                <p className="text-white font-medium">
                  Types of SMS sent: transactional appointment booking updates, schedule
                  reminders, and on-the-way notifications.
                </p>
                <p className="text-white font-medium">
                  Opt-out / Help: Customers can reply STOP to unsubscribe at any time or
                  reply HELP for customer care assistance. Message and data rates may apply.
                  Message frequency varies based on appointment activity.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                How We Use Your Information
              </h2>
              <p>We use collected information to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Confirm, reschedule, or cancel appointments</li>
                <li>Send schedule reminders and on-the-way notifications</li>
                <li>Calculate travel fees and assign a service zone</li>
                <li>Respond to customer care requests</li>
                <li>Operate and improve our booking and scheduling systems</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Sharing of Information
              </h2>
              <p>
                We do not sell personal information. Mobile numbers and SMS opt-in consent
                are never shared with third parties or affiliates for marketing or
                promotional purposes.
              </p>
              <p>
                We may use service providers that help us operate the business, such as
                appointment scheduling, messaging delivery, and calendar tools. Those
                providers may process information only as needed to perform those services
                for us and are not permitted to use SMS opt-in data for their own marketing.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">
                Data Retention &amp; Security
              </h2>
              <p>
                We retain appointment records as needed to fulfill bookings, provide
                customer support, and meet legal or accounting requirements. We take
                reasonable administrative and technical measures to protect personal
                information from unauthorized access, use, or disclosure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or your information, contact
                Ozer Auto Detailing:
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
