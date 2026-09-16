'use client'

import React, { useState } from 'react'
import { BusinessSettings } from '@/types'
import { saveSettingsAction } from '@/app/actions/admin'
import { Save, Check, Loader2, Building, Phone, Mail, MapPin, Clock } from 'lucide-react'

interface BusinessSettingsManagerProps {
  initialSettings: BusinessSettings
}

export function BusinessSettingsManager({ initialSettings }: BusinessSettingsManagerProps) {
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const result = await saveSettingsAction(settings)
      if (result.success && result.data) {
        setSettings(result.data)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setErrorMessage(result.error || 'Failed to update business settings')
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="glassmorphism rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-brand-neon shrink-0" /> Austin Business Settings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure studio details, contact info, and calendar booking intervals.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95 w-full sm:w-auto shrink-0"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saveSuccess ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Studio / Business Name *
          </label>
          <input
            type="text"
            required
            value={settings.business_name}
            onChange={e => setSettings({ ...settings, business_name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-cyan" /> Austin Studio Address *
          </label>
          <input
            type="text"
            required
            value={settings.address}
            onChange={e => setSettings({ ...settings, address: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-brand-cyan" /> Phone Number (US) *
            </label>
            <input
              type="text"
              required
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-brand-cyan" /> Contact Email *
            </label>
            <input
              type="email"
              required
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-cyan" /> Operating Timezone
            </label>
            <input
              type="text"
              value={settings.timezone}
              onChange={e => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Default: America/Chicago</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Slot Granularity Interval
            </label>
            <select
              value={settings.slot_interval_minutes}
              onChange={e =>
                setSettings({ ...settings, slot_interval_minutes: Number(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan cursor-pointer"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes (Recommended)</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Interval between generated start times
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}
