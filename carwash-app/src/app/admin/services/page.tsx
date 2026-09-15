'use client'

import React, { useState, useEffect } from 'react'
import { Service, VehicleCategory, Addon } from '@/types'
import { ServicesManager } from '@/components/admin/ServicesManager'
import { VehiclesManager } from '@/components/admin/VehiclesManager'
import { AddonsManager } from '@/components/admin/AddonsManager'
import {
  MOCK_SERVICES,
  MOCK_VEHICLE_CATEGORIES,
  MOCK_ADDONS,
} from '@/lib/supabase/mock-data'
import { Layers, Car, Sparkles, Loader2 } from 'lucide-react'

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'vehicles' | 'addons'>('services')
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES)
  const [categories, setCategories] = useState<VehicleCategory[]>(MOCK_VEHICLE_CATEGORIES)
  const [addons, setAddons] = useState<Addon[]>(MOCK_ADDONS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, catRes, addRes] = await Promise.all([
          fetch('/api/admin/services').then(r => r.json()),
          fetch('/api/admin/vehicle-categories').then(r => r.json()),
          fetch('/api/admin/addons').then(r => r.json()),
        ])

        if (servicesRes.services) setServices(servicesRes.services)
        if (catRes.vehicle_categories) setCategories(catRes.vehicle_categories)
        if (addRes.addons) setAddons(addRes.addons)
      } catch (err) {
        console.error('Error loading service catalog:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Services & Pricing Engine</h1>
        <p className="text-xs text-slate-400 mt-1">
          Dynamically manage packages, vehicle category multipliers, and add-on pricing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('services')}
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'services'
              ? 'bg-brand-cyan text-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Core Packages ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'vehicles'
              ? 'bg-brand-cyan text-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Vehicle Multipliers ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addons')}
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'addons'
              ? 'bg-brand-cyan text-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Add-On Services ({addons.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-neon mb-3" />
          <span className="text-xs text-slate-400">Loading catalog...</span>
        </div>
      ) : activeTab === 'services' ? (
        <ServicesManager initialServices={services} />
      ) : activeTab === 'vehicles' ? (
        <VehiclesManager initialCategories={categories} />
      ) : (
        <AddonsManager initialAddons={addons} />
      )}
    </div>
  )
}
