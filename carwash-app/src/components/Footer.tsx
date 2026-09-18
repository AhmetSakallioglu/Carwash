import React from 'react'
import Link from 'next/link'
import { Navigation, MapPin, Phone, Mail, Sparkles } from 'lucide-react'
import { BusinessSchedule, BusinessSettings, LocationZone } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { BrandMark } from './BrandMark'
import { groupScheduleHours, phoneTelHref } from '@/lib/settings'

export function AustinServiceArea({ zones = [] }: { zones?: LocationZone[] }) {
  const activeZones = zones.filter(z => z.is_active).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section id="locations" className="py-12 sm:py-16 px-4 sm:px-6 scroll-mt-24">
      <div className="max-w-5xl mx-auto glassmorphism p-5 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-brand-cyan flex items-center justify-center shrink-0 border border-cyan-500/20">
              <Navigation className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">
                Serving Greater Austin & Travis County
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Mobile car detailing across Austin, TX — Downtown, South Austin, East Austin, The Domain,
                West Lake Hills, Round Rock, Cedar Park, Lakeway, Georgetown, Pflugerville, Buda, Kyle & San Marcos.
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-brand-neon px-4 sm:px-5 py-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 w-full md:w-auto text-center">
            Travel fees calculated by zone at checkout
          </div>
        </div>

        {activeZones.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {activeZones.map(zone => (
              <div
                key={zone.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/50 border border-slate-800 px-3.5 py-2.5 text-xs"
              >
                <span className="text-slate-200 font-medium min-w-0 truncate">{zone.zone_name}</span>
                <span className="text-brand-neon font-bold shrink-0">
                  {zone.travel_fee > 0 ? `+${formatCurrency(zone.travel_fee)}` : '$0'} · {zone.travel_time_minutes}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface FooterProps {
  settings: BusinessSettings
  schedules?: BusinessSchedule[]
}

export function Footer({ settings, schedules = [] }: FooterProps) {
  const hourRows = groupScheduleHours(schedules)
  const year = new Date().getFullYear()

  return (
    <footer className="pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 border-t border-slate-900 bg-slate-950/60">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-neon" />
            <BrandMark name={settings.business_name} className="text-xl" />
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
            {settings.tagline} across Austin, TX. We come to your home or office with a full mobile
            detailing setup — interior restoration, exterior wash, and paint care throughout Greater
            Austin and Travis County, without a shop visit.
          </p>
          <div className="text-xs text-brand-neon font-medium">
            Pay On-Site — No Upfront Booking Fees
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
            Contact
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-cyan shrink-0" />
              <a href={phoneTelHref(settings.phone)} className="hover:text-white transition">
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-cyan shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-white transition">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
            Operating Hours
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-400 mb-5">
            {hourRows.length > 0 ? (
              hourRows.map(row => (
                <li key={row.label} className="flex justify-between gap-3">
                  <span>{row.label}:</span>
                  <span className={row.closed ? 'text-rose-400' : 'text-white'}>{row.hours}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span className="text-white">8:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="text-white">8:30 AM - 5:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="text-rose-400">Closed</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>
          © {year} {settings.business_name}. All rights reserved.
        </p>
        <nav aria-label="Legal">
          <Link href="/privacy-policy" className="hover:text-white transition">
            Privacy Policy
          </Link>
        </nav>
        <p>Austin, Texas • {settings.tagline}</p>
      </div>
    </footer>
  )
}
