'use client'

import React, { useState, useEffect } from 'react'
import { BusinessSettings } from '@/types'
import { BusinessSettingsManager } from '@/components/admin/BusinessSettingsManager'
import { MOCK_BUSINESS_SETTINGS } from '@/lib/supabase/mock-data'
import { Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>(MOCK_BUSINESS_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.settings) setSettings(data.settings)
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Business Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Update studio address, contact info, and time slot intervals.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-neon mb-3" />
          <span className="text-xs text-slate-400">Loading settings...</span>
        </div>
      ) : (
        <BusinessSettingsManager initialSettings={settings} />
      )}
    </div>
  )
}
