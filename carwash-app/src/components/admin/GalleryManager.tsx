'use client'

import React, { useMemo, useState } from 'react'
import { GalleryItem } from '@/types'
import {
  saveGalleryItemAction,
  deleteGalleryItemAction,
  reorderGalleryItemAction,
} from '@/app/actions/admin'
import { ImageDropzone } from './ImageDropzone'
import {
  Plus,
  Edit2,
  Trash2,
  Camera,
  X,
  Loader2,
  ChevronsLeftRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface GalleryManagerProps {
  initialItems: GalleryItem[]
}

const SUGGESTED_CATEGORIES = [
  'Mobile Wash',
  'Interior Detail',
  'Exterior Detail',
  'Paint Correction',
  'Headlight Restoration',
  'Engine Bay',
]

export function GalleryManager({ initialItems }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [isEditing, setIsEditing] = useState(false)
  const [currentItem, setCurrentItem] = useState<Partial<GalleryItem> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const categoryOptions = useMemo(() => {
    const existing = items.map(item => item.category.trim()).filter(Boolean)
    return Array.from(new Set([...existing, ...SUGGESTED_CATEGORIES]))
  }, [items])

  const handleOpenNew = () => {
    setCurrentItem({
      title: '',
      category: 'Mobile Wash',
      image_url: '',
      before_image_url: null,
      sort_order: items.length + 1,
      is_active: true,
    })
    setErrorMessage(null)
    setIsEditing(true)
  }

  const handleOpenEdit = (item: GalleryItem) => {
    setCurrentItem(item)
    setErrorMessage(null)
    setIsEditing(true)
  }

  const handleQuickToggleActive = async (item: GalleryItem) => {
    try {
      const updatedActive = !item.is_active
      const result = await saveGalleryItemAction({
        ...item,
        is_active: updatedActive,
      })

      if (result.success && result.data) {
        setItems(items.map(i => (i.id === result.data!.id ? result.data! : i)))
      } else {
        alert(result.error || 'Failed to update gallery item')
      }
    } catch {
      alert('Error updating gallery item')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentItem || !currentItem.title || !currentItem.image_url || !currentItem.category) {
      setErrorMessage('Title, category, and an after image are required.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const isNew = !currentItem.id
      const result = await saveGalleryItemAction({
        ...currentItem,
        title: currentItem.title.trim(),
        category: currentItem.category.trim(),
        image_url: currentItem.image_url.trim(),
        before_image_url: currentItem.before_image_url ? currentItem.before_image_url.trim() : null,
      })

      if (result.success && result.data) {
        if (isNew) {
          setItems([...items, result.data])
        } else {
          setItems(items.map(i => (i.id === result.data!.id ? result.data! : i)))
        }
        setIsEditing(false)
      } else {
        setErrorMessage(result.error || 'Failed to save gallery item')
      }
    } catch {
      setErrorMessage('Connection error saving gallery item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery photo?')) return

    try {
      const result = await deleteGalleryItemAction(id)
      if (result.success) {
        setItems(items.filter(i => i.id !== id))
      } else {
        alert(result.error || 'Failed to delete gallery item')
      }
    } catch {
      alert('Error deleting gallery item')
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const result = await reorderGalleryItemAction(id, direction)
      if (result.success && result.data) {
        setItems(result.data)
      } else if (result.error) {
        alert(result.error)
      }
    } catch {
      alert('Error reordering gallery item')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-white">Austin Detailing Gallery</h3>
          <p className="text-xs text-slate-400">
            Showcase finished mobile detailing work and before/after comparisons on the homepage.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>

      {items.length === 0 && (
        <div className="glassmorphism rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          No gallery photos yet. Upload the first project image to publish it on the homepage.
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...items].sort((a, b) => a.sort_order - b.sort_order).map((item, index) => (
          <div
            key={item.id}
            className={`glassmorphism rounded-2xl border overflow-hidden transition flex flex-col justify-between ${
              item.is_active ? 'border-slate-800 hover:border-brand-cyan/50' : 'border-slate-800/40 opacity-60'
            }`}
          >
            <div>
              {/* Photo View */}
              <div className="relative aspect-16/10 bg-slate-950 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur text-brand-neon text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-500/30">
                  {item.category}
                </span>
                {item.before_image_url && (
                  <span className="absolute top-2.5 right-2.5 bg-brand-neon/90 text-black text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                    <ChevronsLeftRight className="w-3 h-3" /> B/A
                  </span>
                )}
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-2">
                <h4 className="font-display text-sm font-bold text-white line-clamp-2">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Order: #{item.sort_order}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.is_active ? 'Published' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleQuickToggleActive(item)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  item.is_active
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                {item.is_active ? 'Hide from Site' : 'Publish to Site'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleReorder(item.id, 'up')}
                  type="button"
                  disabled={index === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReorder(item.id, 'down')}
                  type="button"
                  disabled={index === items.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenEdit(item)}
                  type="button"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Edit Photo"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  type="button"
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isEditing && currentItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-lg glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-brand-neon flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  {currentItem.id ? 'Edit Gallery Photo' : 'Add New Gallery Photo'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                type="button"
                className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024 Tesla Model Y Mobile Detail"
                  value={currentItem.title || ''}
                  onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <input
                    list="gallery-categories"
                    required
                    value={currentItem.category || ''}
                    onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                    placeholder="e.g. Mobile Wash"
                  />
                  <datalist id="gallery-categories">
                    {categoryOptions.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={currentItem.sort_order ?? 1}
                    onChange={e =>
                      setCurrentItem({ ...currentItem, sort_order: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <ImageDropzone
                label="Main (After) Image"
                required
                value={currentItem.image_url}
                onChange={url => setCurrentItem({ ...currentItem, image_url: url })}
              />

              <ImageDropzone
                label="Before Image (optional)"
                value={currentItem.before_image_url}
                onChange={url => setCurrentItem({ ...currentItem, before_image_url: url })}
              />

              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentItem.is_active ?? true)}
                    onChange={e =>
                      setCurrentItem({ ...currentItem, is_active: e.target.checked })
                    }
                    className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                  />
                  <span>Active & Published on Website</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
