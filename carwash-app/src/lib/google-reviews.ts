import { GoogleReview, GoogleReviewsResponse, BusinessSettings } from '@/types'
import { getBusinessSettings } from '@/lib/supabase/queries'

interface PlacesNewReview {
  rating?: number
  relativePublishTimeDescription?: string
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: {
    displayName?: string
    photoUri?: string
  }
}

interface PlacesNewPlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: PlacesNewReview[]
  error?: {
    message?: string
    status?: string
  }
}

interface PlacesTextSearchResponse {
  places?: PlacesNewPlace[]
  error?: {
    message?: string
    status?: string
  }
}

const CACHE_TTL_MS = 60 * 60 * 1000
const PLACE_FIELDS = 'id,displayName,formattedAddress,rating,userRatingCount,reviews,googleMapsUri'

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

function mapFiveStarReviews(rawReviews: PlacesNewReview[] = []): GoogleReview[] {
  return rawReviews
    .filter(review => Number(review.rating) === 5)
    .map(review => ({
      author_name: review.authorAttribution?.displayName?.trim() || 'Google Customer',
      profile_photo_url: review.authorAttribution?.photoUri || null,
      rating: 5,
      relative_time_description: review.relativePublishTimeDescription || '',
      text: (review.text?.text || review.originalText?.text || '').trim(),
    }))
    .filter(review => Boolean(review.text))
}

function distinctiveNameTokens(name: string): string[] {
  const stopWords = new Set(['auto', 'detail', 'detailing', 'mobile', 'wash', 'studio', 'the', 'and'])
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 4 && !stopWords.has(token))
}

function placeMatchesBusiness(placeName: string | undefined, businessName: string): boolean {
  const place = placeName?.trim().toLowerCase() || ''
  const business = businessName.trim().toLowerCase()
  if (!place || !business) return false
  if (place.includes(business) || business.includes(place)) return true
  const tokens = distinctiveNameTokens(businessName)
  return tokens.length > 0 && tokens.every(token => place.includes(token))
}

function payloadFromPlace(place: PlacesNewPlace): GoogleReviewsResponse {
  const reviews = mapFiveStarReviews(place.reviews)
  return {
    success: true,
    enabled: true,
    rating: place.rating ?? null,
    total_reviews: place.userRatingCount ?? 0,
    reviews,
    place_url: place.googleMapsUri || null,
  }
}

async function fetchPlaceDetails(apiKey: string, placeId: string): Promise<PlacesNewPlace> {
  const endpoint = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`)
  endpoint.searchParams.set('languageCode', 'en')

  const response = await fetch(endpoint.toString(), {
    cache: 'no-store',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACE_FIELDS,
    },
  })

  return (await response.json()) as PlacesNewPlace
}

async function searchPlaceByBusiness(
  apiKey: string,
  settings: BusinessSettings
): Promise<PlacesNewPlace | null> {
  const queries = [
    'cid:14480174940935142624',
    'https://maps.app.goo.gl/mm7AJHJZQE2HZ31W7',
    'Ozer Mobile Car Detailing',
    'Ozer Mobile Car Detailing Austin TX',
    settings.phone,
    settings.business_name,
    [settings.business_name, settings.address].filter(Boolean).join(' '),
  ].filter((query, index, all) => query.trim() && all.indexOf(query) === index)

  for (const textQuery of queries) {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': `places.${PLACE_FIELDS.split(',').join(',places.')}`,
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'en',
        maxResultCount: 5,
      }),
    })

    const data = (await response.json()) as PlacesTextSearchResponse
    const candidates = (data.places || []).map(place => ({
      id: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
    }))
    console.info('[Google Reviews] search', { textQuery, error: data.error?.message || null, candidates })

    const match = data.places?.find(place =>
      placeMatchesBusiness(place.displayName?.text, settings.business_name) ||
      placeMatchesBusiness(place.displayName?.text, 'Ozer Mobile Car Detailing')
    )
    if (match) return match
  }

  return null
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
  const configuredPlaceId =
    placeIdOverride?.trim() ||
    settings.google_place_id?.trim() ||
    process.env.GOOGLE_PLACE_ID?.trim() ||
    ''

  const cacheKey = `places-v1-maps-link|${configuredPlaceId}|${apiKey ? 'live' : 'offline'}`
  if (
    cachedPayload &&
    cachedPayload.key === cacheKey &&
    cachedPayload.expiresAt > Date.now() &&
    !cachedPayload.data.error
  ) {
    return applyOverrides(
      cachedPayload.data,
      settings.hero_rating_override,
      settings.hero_review_count_override
    )
  }

  if (!apiKey || apiKey.includes('your-')) {
    return emptyReviewsResponse({
      rating: settings.hero_rating_override,
      total_reviews: settings.hero_review_count_override,
      error: 'Google Places API key is not configured.',
    })
  }

  try {
    let place: PlacesNewPlace | null = null

    if (configuredPlaceId && !configuredPlaceId.includes('your-')) {
      place = await fetchPlaceDetails(apiKey, configuredPlaceId)
      if (place.error) {
        console.warn('[Google Reviews] configured Place ID failed:', place.error.message)
        place = null
      }
    }

    if (!place) {
      const mapsLinkIds = [
        '0x89f285df59fc4155:0xc8f3ea63b7f3bce0',
        'g:11zystl4m9',
        '11zystl4m9',
      ]
      for (const candidateId of mapsLinkIds) {
        const candidate = await fetchPlaceDetails(apiKey, candidateId)
        console.info('[Google Reviews] maps-link id probe', {
          candidateId,
          name: candidate.displayName?.text || null,
          error: candidate.error?.message || null,
          id: candidate.id || null,
        })
        if (!candidate.error && candidate.id) {
          place = candidate
          break
        }
      }
    }

    if (!place) {
      place = await searchPlaceByBusiness(apiKey, settings)
    }

    if (
      !place?.id ||
      !(
        placeMatchesBusiness(place.displayName?.text, settings.business_name) ||
        placeMatchesBusiness(place.displayName?.text, 'Ozer Mobile Car Detailing')
      )
    ) {
      return emptyReviewsResponse({
        rating: settings.hero_rating_override,
        total_reviews: settings.hero_review_count_override,
        error: `The saved Google Place ID is no longer valid, and Google Maps has no listing that matches ${settings.business_name} yet. Create or claim the Google Business Profile, then paste the new Place ID in Admin → Settings.`,
      })
    }

    const payload = payloadFromPlace(place)
    console.info('[Google Reviews]', {
      configuredPlaceId,
      resolvedPlaceId: place.id,
      placeName: place.displayName?.text || null,
      address: place.formattedAddress || null,
      mapsUrl: place.googleMapsUri || null,
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? 0,
      rawReviewCount: place.reviews?.length ?? 0,
      fiveStarWithText: payload.reviews.length,
    })

    cachedPayload = {
      key: cacheKey,
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: payload,
    }

    return applyOverrides(payload, settings.hero_rating_override, settings.hero_review_count_override)
  } catch (err) {
    return emptyReviewsResponse({
      rating: settings.hero_rating_override,
      total_reviews: settings.hero_review_count_override,
      error: err instanceof Error ? err.message : 'Unable to load Google reviews.',
    })
  }
}
