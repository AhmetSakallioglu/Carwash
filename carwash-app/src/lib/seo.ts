import type { Metadata } from 'next'
import type { BusinessSchedule, BusinessSettings } from '@/types'
import { MOCK_BUSINESS_SETTINGS } from '@/lib/supabase/mock-data'

export const AUSTIN_SERVICE_AREAS = [
  'Austin, TX',
  'Downtown Austin',
  'South Austin',
  'North Austin',
  'East Austin',
  'West Austin',
  'West Lake Hills',
  'The Domain',
  'Round Rock',
  'Cedar Park',
  'Lakeway',
  'Georgetown',
  'Pflugerville',
  'Buda',
  'Kyle',
  'San Marcos',
  'Travis County',
] as const

export const AUSTIN_SEO_KEYWORDS = [
  'mobile car detailing Austin',
  'mobile auto detailing Austin TX',
  'car wash Austin TX',
  'mobile car wash Austin',
  'interior car detailing Austin',
  'exterior hand wash Austin',
  'ceramic coating Austin TX',
  'paint correction Austin',
  'mobile detailing Downtown Austin',
  'mobile detailing Round Rock',
  'mobile detailing Cedar Park',
  'mobile detailing West Lake Hills',
  'car detailing near me Austin',
  'Ozer Auto Detailing',
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ozerautodetailing.com'
  return raw.replace(/\/$/, '')
}

export function parseAustinAddress(address: string): {
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
} {
  const fallback = {
    streetAddress: '11723 N FM 620',
    addressLocality: 'Austin',
    addressRegion: 'TX',
    postalCode: '78726',
  }

  const match = address.trim().match(/^(.*?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/i)
  if (!match) return fallback

  return {
    streetAddress: match[1].trim(),
    addressLocality: match[2].trim(),
    addressRegion: match[3].trim().toUpperCase(),
    postalCode: match[4].trim(),
  }
}

export function buildSeoDescription(settings: BusinessSettings): string {
  return `${settings.business_name} is a mobile auto detailing and car wash service in Austin, TX. We come to your home or office in Greater Austin — Downtown, South Austin, The Domain, West Lake Hills, Round Rock, Cedar Park, Lakeway, and Georgetown. Book online and pay on-site. ${settings.phone}`
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const settings = MOCK_BUSINESS_SETTINGS
  const title = `${settings.business_name} | Mobile Auto Detailing & Car Wash in Austin, TX`
  const description = buildSeoDescription(settings)

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${settings.business_name}`,
    },
    description,
    keywords: [...AUSTIN_SEO_KEYWORDS],
    applicationName: settings.business_name,
    authors: [{ name: settings.business_name, url: siteUrl }],
    creator: settings.business_name,
    publisher: settings.business_name,
    category: 'Auto Detailing',
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: settings.business_name,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    icons: {
      icon: '/globe.svg',
    },
    other: {
      'geo.region': 'US-TX',
      'geo.placename': 'Austin',
    },
  }
}

export function buildHomeMetadata(settings: BusinessSettings): Metadata {
  const siteUrl = getSiteUrl()
  const title = `${settings.business_name} | Mobile Auto Detailing & Car Wash in Austin, TX`
  const description = buildSeoDescription(settings)

  return {
    title,
    description,
    keywords: [...AUSTIN_SEO_KEYWORDS, settings.business_name, settings.tagline],
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: settings.business_name,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

function toOpeningHours(schedules: BusinessSchedule[]) {
  return schedules
    .filter(item => item.is_open)
    .map(item => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAMES[item.day_of_week] || DAY_NAMES[0],
      opens: item.open_time?.slice(0, 5),
      closes: item.close_time?.slice(0, 5),
    }))
}

export function buildLocalBusinessJsonLd(
  settings: BusinessSettings,
  schedules: BusinessSchedule[] = []
): Record<string, unknown> {
  const siteUrl = getSiteUrl()
  const address = parseAustinAddress(settings.address)
  const openingHoursSpecification = toOpeningHours(schedules)

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    additionalType: 'https://schema.org/AutomotiveBusiness',
    name: settings.business_name,
    alternateName: ['Ozer Mobile Car Detailing', 'Ozer Auto Detailing Austin'],
    description: buildSeoDescription(settings),
    url: siteUrl,
    telephone: settings.phone,
    email: settings.email,
    image: settings.before_after_after_image_url || undefined,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      postalCode: address.postalCode,
      addressCountry: 'US',
    },
    areaServed: AUSTIN_SERVICE_AREAS.map(name => ({
      '@type': 'City',
      name,
    })),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.455,
      longitude: -97.834,
    },
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
    hasMap: settings.google_place_id
      ? `https://www.google.com/maps/place/?q=place_id:${settings.google_place_id}`
      : 'https://maps.app.goo.gl/mm7AJHJZQE2HZ31W7',
    sameAs: settings.google_place_id
      ? [`https://www.google.com/maps/place/?q=place_id:${settings.google_place_id}`]
      : undefined,
  }
}
