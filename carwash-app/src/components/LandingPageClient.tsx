'use client'

import React, { useState } from 'react'
import {
  Service,
  VehicleCategory,
  Addon,
  GalleryItem,
  LocationZone,
  BusinessSettings,
  BusinessSchedule,
  GoogleReviewsResponse,
} from '@/types'
import { Navbar } from './Navbar'
import { Hero } from './Hero'
import { ServicesSection } from './ServicesSection'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { GallerySection } from './GallerySection'
import { ReviewsSection } from './ReviewsSection'
import { PricingCalculator, SelectedConfiguration } from './PricingCalculator'
import { BookingModal } from './BookingModal'
import { AustinServiceArea, Footer } from './Footer'
import { BackgroundOrbs } from './BackgroundOrbs'
import { ScrollProgressBar } from './ScrollProgressBar'
import { calculateBookingPrice } from '@/lib/utils'

interface LandingPageClientProps {
  services: Service[]
  categories: VehicleCategory[]
  addons: Addon[]
  galleryItems: GalleryItem[]
  locationZones: LocationZone[]
  settings: BusinessSettings
  schedules: BusinessSchedule[]
  googleReviews: GoogleReviewsResponse
}

export function LandingPageClient({
  services,
  categories,
  addons,
  galleryItems,
  locationZones,
  settings,
  schedules,
  googleReviews,
}: LandingPageClientProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.find(s => s.is_featured)?.id || services[0]?.id || ''
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  )
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [isCalculatorHighlighted, setIsCalculatorHighlighted] = useState(false)

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
      const addonPrices = activeAddons.map(a => a.price)

      const totalPrice = calculateBookingPrice(
        activeService.base_price,
        activeCategory.multiplier,
        addonPrices,
        0,
        activeService.discount_percentage,
        activeService.discount_active
      )

      const originalTotal = calculateBookingPrice(
        activeService.base_price,
        activeCategory.multiplier,
        addonPrices,
        0,
        0,
        false
      )

      const totalDuration =
        activeService.duration_minutes +
        activeAddons.reduce((acc, a) => acc + a.duration_minutes, 0)

      setModalConfig({
        selectedService: activeService,
        selectedCategory: activeCategory,
        selectedAddons: activeAddons,
        selectedZone: null,
        serviceZip: '',
        totalPrice,
        totalDurationMinutes: totalDuration,
        discountSavings: Math.max(0, originalTotal - totalPrice),
      })
      setIsModalOpen(true)
    }
  }

  return (
    <div className="relative min-h-screen">
      <ScrollProgressBar />
      <BackgroundOrbs />

      <Navbar onOpenBooking={handleNavBookClick} settings={settings} />

      <main>
        <Hero settings={settings} googleRating={googleReviews.rating} />
        <ServicesSection services={services} onSelectService={handleSelectServiceFromCard} />
        <BeforeAfterSlider />
        <GallerySection items={galleryItems} businessName={settings.business_name} />
        <ReviewsSection settings={settings} google={googleReviews} />
        <PricingCalculator
          services={services}
          categories={categories}
          addons={addons}
          locationZones={locationZones}
          selectedServiceId={selectedServiceId}
          selectedCategoryId={selectedCategoryId}
          selectedAddonIds={selectedAddonIds}
          onSelectServiceId={setSelectedServiceId}
          onSelectCategoryId={setSelectedCategoryId}
          onToggleAddonId={handleToggleAddon}
          onReserve={handleOpenBookingModal}
          isHighlighted={isCalculatorHighlighted}
        />
        <AustinServiceArea zones={locationZones} />
      </main>

      <Footer settings={settings} schedules={schedules} />

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        configuration={modalConfig}
        locationZones={locationZones}
      />
    </div>
  )
}
