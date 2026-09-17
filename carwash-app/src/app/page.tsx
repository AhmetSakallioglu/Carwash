import {
  getServices,
  getVehicleCategories,
  getAddons,
  getGalleryItems,
  getLocationZones,
  getBusinessSettings,
  getBusinessSchedules,
} from '@/lib/supabase/queries'
import { fetchGoogleReviews } from '@/lib/google-reviews'
import { LandingPageClient } from '@/components/LandingPageClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings()
  return {
    title: `${settings.business_name} | ${settings.tagline} in Austin, TX`,
    description: `${settings.business_name} provides ${settings.tagline.toLowerCase()} across Austin, TX. Book mobile detailing at your home or office and pay on-site. ${settings.phone}`,
    keywords: [
      'Auto Detailing Austin',
      'Mobile Car Wash Austin',
      'Mobile Detailing Austin TX',
      settings.business_name,
    ],
  }
}

export default async function HomePage() {
  const [services, categories, addons, galleryItems, locationZones, settings, schedules, googleReviews] =
    await Promise.all([
      getServices(),
      getVehicleCategories(),
      getAddons(),
      getGalleryItems(),
      getLocationZones(),
      getBusinessSettings(),
      getBusinessSchedules(),
      fetchGoogleReviews(),
    ])

  return (
    <LandingPageClient
      services={services}
      categories={categories}
      addons={addons}
      galleryItems={galleryItems}
      locationZones={locationZones}
      settings={settings}
      schedules={schedules}
      googleReviews={googleReviews}
    />
  )
}
