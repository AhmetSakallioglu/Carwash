import { GoogleReview, GoogleReviewsResponse } from '@/types'
import { getBusinessSettings } from '@/lib/supabase/queries'

interface PlacesReview {
  author_name?: string
  profile_photo_url?: string
  rating?: number
  relative_time_description?: string
  text?: string
}

interface PlacesDetailsResult {
  rating?: number
  user_ratings_total?: number
  url?: string
  reviews?: PlacesReview[]
}

interface PlacesDetailsResponse {
  status?: string
  error_message?: string
  result?: PlacesDetailsResult
}

const CACHE_TTL_MS = 60 * 60 * 1000

let cachedPayload: { key: string; expiresAt: number; data: GoogleReviewsResponse } | null = null

function emptyReviewsResponse(
  partial: Partial<GoogleReviewsResponse> = {}
): GoogleReviewsResponse {
  return {
    success: true,
    enabled: true,
    rating: null,
    total_reviews: null,
    reviews: [],
    place_url: null,
    ...partial,
  }
}

function applyOverrides(
  payload: GoogleReviewsResponse,
  ratingOverride: number | null,
  reviewCountOverride: number | null
): GoogleReviewsResponse {
  return {
    ...payload,
    rating: ratingOverride ?? payload.rating,
    total_reviews: reviewCountOverride ?? payload.total_reviews,
  }
}

export async function fetchGoogleReviews(
  placeIdOverride?: string
): Promise<GoogleReviewsResponse> {
  const settings = await getBusinessSettings()

  if (!settings.show_google_reviews) {
    return emptyReviewsResponse({
      enabled: false,
      rating: settings.hero_rating_override,
      total_reviews: settings.hero_review_count_override,
    })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim()
  const placeId =
    placeIdOverride?.trim() ||
    settings.google_place_id?.trim() ||
    process.env.GOOGLE_PLACE_ID?.trim() ||
    ''

  const cacheKey = `${placeId}|${apiKey ? 'live' : 'offline'}`
  if (cachedPayload && cachedPayload.key === cacheKey && cachedPayload.expiresAt > Date.now()) {
    return applyOverrides(
      cachedPayload.data,
      settings.hero_rating_override,
      settings.hero_review_count_override
    )
  }

  if (!apiKey || !placeId || apiKey.includes('your-') || placeId.includes('your-')) {
    const fallback = emptyReviewsResponse({
      rating: settings.hero_rating_override,
      total_reviews: settings.hero_review_count_override,
      error: !apiKey || apiKey.includes('your-')
        ? 'Google Places API key is not configured.'
        : 'Google Place ID is not configured.',
    })
    return fallback
  }

  const endpoint = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  endpoint.searchParams.set('place_id', placeId)
  endpoint.searchParams.set('fields', 'name,rating,user_ratings_total,reviews,url')
  endpoint.searchParams.set('reviews_sort', 'newest')
  endpoint.searchParams.set('language', 'en')
  endpoint.searchParams.set('key', apiKey)

  try {
    const response = await fetch(endpoint.toString(), { cache: 'no-store' })
    const data = (await response.json()) as PlacesDetailsResponse

    if (!response.ok || data.status !== 'OK' || !data.result) {
      return emptyReviewsResponse({
        rating: settings.hero_rating_override,
        total_reviews: settings.hero_review_count_override,
        error: data.error_message || data.status || 'Google Places lookup failed.',
      })
    }

    const reviews: GoogleReview[] = (data.result.reviews || [])
      .filter(review => Number(review.rating) === 5)
      .map(review => ({
        author_name: review.author_name?.trim() || 'Google Customer',
        profile_photo_url: review.profile_photo_url || null,
        rating: 5,
        relative_time_description: review.relative_time_description || '',
        text: (review.text || '').trim(),
      }))
      .filter(review => Boolean(review.text))

    const payload: GoogleReviewsResponse = {
      success: true,
      enabled: true,
      rating: data.result.rating ?? settings.hero_rating_override,
      total_reviews: data.result.user_ratings_total ?? settings.hero_review_count_override,
      reviews,
      place_url: data.result.url || null,
    }

    cachedPayload = {
      key: cacheKey,
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: payload,
    }

    return applyOverrides(
      payload,
      settings.hero_rating_override,
      settings.hero_review_count_override
    )
  } catch (err) {
    return emptyReviewsResponse({
      rating: settings.hero_rating_override,
      total_reviews: settings.hero_review_count_override,
      error: err instanceof Error ? err.message : 'Unable to load Google reviews.',
    })
  }
}
