'use client'

import React, { useEffect, useState } from 'react'
import { BusinessSettings, GoogleReview, GoogleReviewsResponse } from '@/types'
import { BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'

interface ReviewsSectionProps {
  settings: BusinessSettings
  google: GoogleReviewsResponse
}

function VerifiedBadges({
  settings,
  rating,
  totalReviews,
}: {
  settings: BusinessSettings
  rating: number | null
  totalReviews: number | null
}) {
  const badges = [
    rating
      ? `${rating.toFixed(1)} Google${totalReviews ? ` · ${totalReviews}+ reviews` : ''}`
      : 'Verified Google reviews',
    'Pay on-site',
    settings.hero_stat_3_label || 'Mobile service',
    settings.hero_stat_4_value || 'Austin, TX',
  ]

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
        {badges.map(badge => (
          <span
            key={badge}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glassmorphism border border-slate-800 text-[11px] font-semibold text-slate-200"
          >
            <BadgeCheck className="w-3.5 h-3.5 text-brand-neon" />
            {badge}
          </span>
        ))}
      </div>
    </section>
  )
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const initials = review.author_name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="h-full glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {review.profile_photo_url ? (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-11 h-11 rounded-full object-cover border border-slate-700"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-cyan-500/15 text-brand-neon flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{review.author_name}</p>
          <p className="text-[11px] text-slate-400">{review.relative_time_description}</p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="w-3.5 h-3.5 fill-current" />
        ))}
      </div>

      <p className="text-sm text-slate-300 leading-relaxed line-clamp-6 flex-1">
        {review.text}
      </p>
    </article>
  )
}

export function ReviewsSection({ settings, google }: ReviewsSectionProps) {
  const reviews = google.reviews || []
  const showReviews = google.enabled && reviews.length > 0
  const [index, setIndex] = useState(0)
  const [perView, setPerView] = useState(1)

  useEffect(() => {
    const updatePerView = () => {
      if (window.innerWidth >= 1024) setPerView(3)
      else if (window.innerWidth >= 640) setPerView(2)
      else setPerView(1)
    }

    updatePerView()
    window.addEventListener('resize', updatePerView)
    return () => window.removeEventListener('resize', updatePerView)
  }, [])

  const maxIndex = Math.max(0, reviews.length - perView)

  useEffect(() => {
    setIndex(current => Math.min(current, maxIndex))
  }, [maxIndex])

  useEffect(() => {
    if (!showReviews || reviews.length <= perView) return undefined
    const timer = window.setInterval(() => {
      setIndex(current => (current >= maxIndex ? 0 : current + 1))
    }, 7000)
    return () => window.clearInterval(timer)
  }, [showReviews, reviews.length, perView, maxIndex])

  if (!showReviews) {
    return (
      <VerifiedBadges
        settings={settings}
        rating={google.rating}
        totalReviews={google.total_reviews}
      />
    )
  }

  const ratingLabel = google.rating ? google.rating.toFixed(1) : '5.0'

  return (
    <section id="reviews" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-brand-cyan/30 text-brand-neon text-xs font-semibold mb-3">
              <Quote className="w-3.5 h-3.5" /> Google Reviews
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              5-Star Mobile Detailing in Austin
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {ratingLabel} average
              {google.total_reviews ? ` from ${google.total_reviews} Google reviews` : ''}. Showing verified 5-star customer feedback.
            </p>
          </div>

          {reviews.length > perView && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIndex(current => Math.max(0, current - 1))}
                className="p-2 rounded-full border border-slate-700 bg-slate-900 text-white hover:border-brand-cyan cursor-pointer"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndex(current => Math.min(maxIndex, current + 1))}
                className="p-2 rounded-full border border-slate-700 bg-slate-900 text-white hover:border-brand-cyan cursor-pointer"
                aria-label="Next reviews"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
          >
            {reviews.map((review, reviewIndex) => (
              <div
                key={`${review.author_name}-${reviewIndex}`}
                className="px-1.5 shrink-0"
                style={{ width: `${100 / perView}%` }}
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
