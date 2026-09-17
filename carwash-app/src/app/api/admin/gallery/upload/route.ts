import { NextRequest, NextResponse } from 'next/server'
import { uploadGalleryImageFile } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 })
    }

    const result = await uploadGalleryImageFile(file)
    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 400 })
    }

    return NextResponse.json({ url: result.url })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error uploading gallery image'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
