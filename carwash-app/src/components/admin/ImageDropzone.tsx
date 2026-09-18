'use client'

import React, { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'

interface ImageDropzoneProps {
  label: string
  value?: string | null
  onChange: (url: string) => void
  required?: boolean
}

export function ImageDropzone({ label, value, onChange, required = false }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const uploadFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/gallery/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Upload failed')
        return
      }
      onChange(data.url)
    } catch {
      setError('Could not upload the image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block font-semibold text-slate-300 mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      <div
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          void uploadFile(e.dataTransfer.files?.[0])
        }}
        className={`rounded-xl border border-dashed px-3 py-4 text-center transition ${
          isDragging ? 'border-brand-cyan bg-cyan-500/10' : 'border-slate-700 bg-slate-950'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={e => {
            void uploadFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {value ? (
          <div className="space-y-2">
            <div className="aspect-16/10 rounded-lg overflow-hidden border border-slate-800 bg-black">
              <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-[11px] font-bold text-brand-cyan hover:underline cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Replace image'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center gap-2 text-slate-400 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-cyan" />
            ) : (
              <Upload className="w-5 h-5 text-brand-cyan" />
            )}
            <span className="text-xs font-semibold text-slate-200">
              {uploading ? 'Uploading to gallery storage...' : 'Drop an image here or click to browse'}
            </span>
            <span className="text-[10px] text-slate-500">JPG, PNG, WEBP, GIF, AVIF · up to 8 MB</span>
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
