'use client'

import React, { useState } from 'react'
import { Service, VehicleCategory, Addon } from '@/types'
import { Navbar } from './Navbar'
import { Hero } from './Hero'
import { ServicesSection } from './ServicesSection'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { PricingCalculator, SelectedConfiguration } from './PricingCalculator'
import { BookingModal } from './BookingModal'
import { AustinServiceArea, Footer } from './Footer'
import { BackgroundOrbs } from './BackgroundOrbs'
import { ScrollProgressBar } from './ScrollProgressBar'

interface LandingPageClientProps {
  services: Service[]
  categories: VehicleCategory[]
  addons: Addon[]
}

export function LandingPageClient({ services, categories, addons }: LandingPageClientProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.find(s => s.is_featured)?.id || services[0]?.id || ''
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  )
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [isCalculatorHighlighted, setIsCalculatorHighlighted] = useState(false)

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<SelectedConfiguration | null>(null)

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    )
  }

  const handleSelectServiceFromCard = (service: Service) => {
    setSelectedServiceId(service.id)
    setIsCalculatorHighlighted(true)
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleOpenBookingModal = (config: SelectedConfiguration) => {
    setModalConfig(config)
    setIsModalOpen(true)
  }

  const handleNavBookClick = () => {
    const activeService = services.find(s => s.id === selectedServiceId) || services[0]
    const activeCategory = categories.find(c => c.id === selectedCategoryId) || categories[0]
    const activeAddons = addons.filter(a => selectedAddonIds.includes(a.id))

    if (activeService && activeCategory) {
      const addonsPrice = activeAddons.reduce((acc, a) => acc + a.price, 0)
      const totalPrice = Math.round(activeService.base_price * activeCategory.multiplier + addonsPrice)
      const totalDuration = activeService.duration_minutes + activeAddons.reduce((acc, a) => acc + a.duration_minutes, 0)

      setModalConfig({
        selectedService: activeService,
        selectedCategory: activeCategory,
        selectedAddons: activeAddons,
        totalPrice,
        totalDurationMinutes: totalDuration,
      })
      setIsModalOpen(true)
    }
  }

  return (
    <div className="relative min-h-screen">
      <ScrollProgressBar />
      <BackgroundOrbs />

      <Navbar onOpenBooking={handleNavBookClick} />

      <main>
        <Hero />
        <ServicesSection services={services} onSelectService={handleSelectServiceFromCard} />
        <BeforeAfterSlider />
        <PricingCalculator
          services={services}
          categories={categories}
          addons={addons}
          selectedServiceId={selectedServiceId}
          selectedCategoryId={selectedCategoryId}
          selectedAddonIds={selectedAddonIds}
          onSelectServiceId={setSelectedServiceId}
          onSelectCategoryId={setSelectedCategoryId}
          onToggleAddonId={handleToggleAddon}
          onReserve={handleOpenBookingModal}
          isHighlighted={isCalculatorHighlighted}
        />
        <AustinServiceArea />
      </main>

      <Footer />

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        configuration={modalConfig}
      />
    </div>
  )
}
