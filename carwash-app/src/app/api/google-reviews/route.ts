import { NextResponse } from 'next/server'
import { fetchGoogleReviews } from '@/lib/google-reviews'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const placeId = new URL(request.url).searchParams.get('placeId') || undefined
    const data = await fetchGoogleReviews(placeId)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching Google reviews'
    return NextResponse.json(
      {
        success: false,
        enabled: false,
        rating: null,
        total_reviews: null,
        reviews: [],
        place_url: null,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
