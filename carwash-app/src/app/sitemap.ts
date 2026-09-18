import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'
import { getBusinessSettings } from '@/lib/supabase/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  let lastModified = new Date()

  try {
    const settings = await getBusinessSettings()
    if (settings.updated_at) lastModified = new Date(settings.updated_at)
  } catch {
    // Keep the current timestamp if settings cannot be loaded
  }

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
