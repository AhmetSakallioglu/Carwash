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
import { JsonLd } from '@/components/JsonLd'
import { buildHomeMetadata, buildLocalBusinessJsonLd } from '@/lib/seo'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings()
  return buildHomeMetadata(settings)
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
    <>
      <JsonLd data={buildLocalBusinessJsonLd(settings, schedules)} />
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
    </>
  )
}
