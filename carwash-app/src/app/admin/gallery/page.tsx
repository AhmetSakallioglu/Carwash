import { getGalleryItems } from '@/lib/supabase/queries'
import { GalleryManager } from '@/components/admin/GalleryManager'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const items = await getGalleryItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Dynamic Gallery</h1>
        <p className="text-xs text-slate-400 mt-1">
          Publish Austin project photos, reorder the homepage grid, and toggle before/after comparisons.
        </p>
      </div>

      <GalleryManager initialItems={items} />
    </div>
  )
}
