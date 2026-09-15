'use client'

import React from 'react'
import { Service } from '@/types'
import { Droplets, ShieldCheck, Gem, Sparkles, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ServicesSectionProps {
  services: Service[]
  onSelectService: (service: Service) => void
}

export function ServicesSection({ services, onSelectService }: ServicesSectionProps) {
  const getIconForService = (index: number) => {
    switch (index % 4) {
      case 0:
        return <Droplets className="w-6 h-6" />
      case 1:
        return <Sparkles className="w-6 h-6" />
      case 2:
        return <ShieldCheck className="w-6 h-6" />
      case 3:
      default:
        return <Gem className="w-6 h-6" />
    }
  }

  const activeServices = services.filter(s => s.is_active)

  return (
    <section id="services" className="py-24 px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-cyan mb-2">
            Our Capabilities
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Engineered for Automotive Perfection
          </p>
          <p className="text-slate-400 text-sm">
            Choose a package below to customize options in our Austin price builder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeServices.map((service, index) => {
            const isFeatured = service.is_featured
            return (
              <div
                key={service.id}
                className={`glassmorphism p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-2 relative ${
                  isFeatured
                    ? 'border-2 border-brand-cyan/80 glow-effect'
                    : 'border border-slate-800 hover:border-brand-cyan/40'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 right-6 bg-brand-cyan text-black text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                      isFeatured
                        ? 'bg-cyan-500/25 text-brand-neon'
                        : 'bg-cyan-500/10 text-brand-neon'
                    }`}
                  >
                    {getIconForService(index)}
                  </div>

                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    {service.name}
                  </h3>

                  <p className="text-slate-400 text-xs mb-5 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>

                  <ul className="space-y-2 text-xs text-slate-300 mb-6">
                    {(service.features || []).map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-base font-bold text-white font-display block">
                      {formatCurrency(service.base_price)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ~{service.duration_minutes} mins
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectService(service)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer active:scale-95 ${
                      isFeatured
                        ? 'bg-brand-neon text-black hover:bg-cyan-300 font-bold'
                        : 'bg-slate-800 hover:bg-brand-cyan hover:text-black text-white'
                    }`}
                  >
                    Select Package
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
