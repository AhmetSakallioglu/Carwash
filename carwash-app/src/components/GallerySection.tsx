'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { GalleryItem } from '@/types'
import { Sparkles, Eye, X, ChevronsLeftRight, Camera, ShieldCheck } from 'lucide-react'

interface GallerySectionProps {
  items: GalleryItem[]
  businessName?: string
}

export function GallerySection({ items, businessName = 'Ozer Auto Detailing' }: GallerySectionProps) {
  const activeItems = useMemo(() => items.filter(i => i.is_active), [items])

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(activeItems.map(item => item.category.trim()).filter(Boolean))
    )
    return ['All', ...unique]
  }, [activeItems])

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedItemForModal, setSelectedItemForModal] = useState<GalleryItem | null>(null)
  const [showBeforeToggle, setShowBeforeToggle] = useState(false)

  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [categories, selectedCategory])

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return activeItems
    return activeItems.filter(i => i.category.toLowerCase() === selectedCategory.toLowerCase())
  }, [activeItems, selectedCategory])

  const handleOpenModal = (item: GalleryItem) => {
    setSelectedItemForModal(item)
    setShowBeforeToggle(false)
  }

  const handleCloseModal = () => {
    setSelectedItemForModal(null)
    setShowBeforeToggle(false)
  }

  if (activeItems.length === 0) return null

  return (
    <section id="gallery" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950/70 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-brand-cyan/30 text-brand-neon text-xs font-semibold mb-3">
            <Camera className="w-3.5 h-3.5" /> Austin Detailing Portfolio
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Real Transformations, Unrivaled Gloss
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Browse recent mobile detailing work completed across Greater Austin.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 -mx-2 px-2 snap-x snap-mandatory">
          {categories.map(cat => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap snap-start shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-brand-cyan text-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="glassmorphism rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
            No published projects in this category yet. Check back after the next Austin detail.
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const hasBefore = Boolean(item.before_image_url)
            return (
              <div
                key={item.id}
                onClick={() => handleOpenModal(item)}
                className="group relative glassmorphism rounded-2xl overflow-hidden border border-slate-800/80 hover:border-brand-cyan/60 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-xl flex flex-col"
              >
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Category Pill on Image */}
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur text-brand-neon text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-cyan-500/30">
                    {item.category}
                  </span>

                  {hasBefore && (
                    <span className="absolute top-3 right-3 bg-brand-neon/90 text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <ChevronsLeftRight className="w-3 h-3" />
                      Before / After
                    </span>
                  )}

                  {/* Hover Overlay Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-10 h-10 rounded-full bg-brand-cyan text-black flex items-center justify-center shadow-lg">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="font-display font-bold text-white text-sm group-hover:text-brand-neon transition line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-brand-cyan font-medium">
                      <ShieldCheck className="w-3 h-3" /> {businessName}
                    </span>
                    <span className="text-slate-500 group-hover:text-slate-300 transition">
                      View Project →
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Modal Preview */}
      {selectedItemForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-3xl glassmorphism bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 inline-block mb-1">
                  {selectedItemForModal.category}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {selectedItemForModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before / After Toggle Buttons if applicable */}
            {selectedItemForModal.before_image_url && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowBeforeToggle(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !showBeforeToggle
                      ? 'bg-brand-cyan text-black shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Finished (After)
                </button>
                <button
                  type="button"
                  onClick={() => setShowBeforeToggle(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    showBeforeToggle
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Condition (Before)
                </button>
              </div>
            )}

            {/* Modal Image View */}
            <div className="relative aspect-16/10 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={
                  showBeforeToggle && selectedItemForModal.before_image_url
                    ? selectedItemForModal.before_image_url
                    : selectedItemForModal.image_url
                }
                alt={selectedItemForModal.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-md border border-white/10">
                  {showBeforeToggle && selectedItemForModal.before_image_url
                    ? 'BEFORE DETAILING'
                    : 'AFTER DETAIL FINISH'}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-brand-neon">
                <Sparkles className="w-3.5 h-3.5" /> {businessName} · Austin, Texas
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
