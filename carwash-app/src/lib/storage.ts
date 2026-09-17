import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'

export const GALLERY_STORAGE_BUCKET = 'gallery-images'
const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'image'
}

async function ensureGalleryBucket() {
  const supabase = createAdminClient()
  const { data } = await supabase.storage.getBucket(GALLERY_STORAGE_BUCKET)
  if (data) return

  await supabase.storage.createBucket(GALLERY_STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  })
}

export async function uploadGalleryImageFile(
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file || file.size === 0) {
    return { success: false, error: 'Please choose an image file.' }
  }

  if (file.size > MAX_FILE_BYTES) {
    return { success: false, error: 'Images must be 8 MB or smaller.' }
  }

  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return { success: false, error: 'Use a JPG, PNG, WEBP, GIF, or AVIF image.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      url: `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`,
    }
  }

  try {
    await ensureGalleryBucket()
    const supabase = createAdminClient()
    const safeName = sanitizeFileName(file.name)
    const path = `${Date.now()}-${safeName}`

    const { error } = await supabase.storage.from(GALLERY_STORAGE_BUCKET).upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const { data } = supabase.storage.from(GALLERY_STORAGE_BUCKET).getPublicUrl(path)
    if (!data?.publicUrl) {
      return { success: false, error: 'Upload succeeded but no public URL was returned.' }
    }

    return { success: true, url: data.publicUrl }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to upload image',
    }
  }
}
