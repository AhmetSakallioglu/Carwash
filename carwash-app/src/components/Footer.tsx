import React from 'react'
import Link from 'next/link'
import { Navigation, MapPin, Phone, Mail, Sparkles, ShieldCheck } from 'lucide-react'

export function AustinServiceArea() {
  return (
    <section id="locations" className="py-12 sm:py-16 px-4 sm:px-6 scroll-mt-24">
      <div className="max-w-5xl mx-auto glassmorphism p-5 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 shadow-xl">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-brand-cyan flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Navigation className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              Serving Greater Austin & Travis County
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Downtown, West Lake Hills, The Domain, Round Rock, Cedar Park, Lakeway & Bee Cave.
            </p>
          </div>
        </div>
        <div className="text-xs font-bold text-brand-neon px-4 sm:px-5 py-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 w-full md:w-auto text-center">
          ✓ $0 Travel Fee within 25 Miles
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="pt-12 sm:pt-16 pb-10 sm:pb-12 px-4 sm:px-6 border-t border-slate-900 bg-slate-950/60">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Col 1: Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-neon" />
            <span className="font-display font-bold text-xl tracking-wider text-white">
              OZER<span className="text-brand-cyan">.ATX</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
            Austin&apos;s premier mobile and studio auto spa. Specializing in swirl-free multi-stage paint
            correction, certified ceramic coatings, and deep interior steam extraction.
          </p>
          <div className="text-xs text-brand-neon font-medium">
            Pay On-Site — No Upfront Booking Fees
          </div>
        </div>

        {/* Col 2: Contact Info */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
            Austin Studio
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
              <span>11723 N FM 620, Austin, TX 78726</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-cyan shrink-0" />
              <a href="tel:5128902839" className="hover:text-white transition">
                (512) 890-2839
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-cyan shrink-0" />
              <a href="mailto:concierge@ozerdetailaustin.com" className="hover:text-white transition">
                concierge@ozerdetailaustin.com
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Hours & Quick Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
            Operating Hours
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-400 mb-5">
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
          </ul>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-neon transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-neon" />
            Admin Operations Portal
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 OZER Detail Studio Austin. All rights reserved.</p>
        <p>Austin, Texas • Professional Detailing & Ceramic Coatings</p>
      </div>
    </footer>
  )
}
