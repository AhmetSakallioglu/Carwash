'use client'

import React, { useState } from 'react'
import { Service, VehicleCategory, Addon } from '@/types'
import { ServicesManager } from '@/components/admin/ServicesManager'
import { VehiclesManager } from '@/components/admin/VehiclesManager'
import { AddonsManager } from '@/components/admin/AddonsManager'
import { Layers, Car, Sparkles } from 'lucide-react'

interface AdminServicesClientProps {
  services: Service[]
  categories: VehicleCategory[]
  addons: Addon[]
}

export function AdminServicesClient({ services, categories, addons }: AdminServicesClientProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'vehicles' | 'addons'>('services')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Services & Pricing Engine</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage packages, independent size pricing, and add-on rates.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-3 -mx-1 px-1">
        <button
          onClick={() => setActiveTab('services')}
          type="button"
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-brand-cyan text-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="sm:hidden">Packages</span>
          <span className="hidden sm:inline">Core Packages ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          type="button"
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'vehicles'
              ? 'bg-brand-cyan text-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span className="sm:hidden">Vehicles</span>
          <span className="hidden sm:inline">Vehicle Sizes ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addons')}
          type="button"
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'addons'
              ? 'bg-brand-cyan text-black shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="sm:hidden">Add-ons</span>
          <span className="hidden sm:inline">Add-On Services ({addons.length})</span>
        </button>
      </div>

      {activeTab === 'services' ? (
        <ServicesManager initialServices={services} />
      ) : activeTab === 'vehicles' ? (
        <VehiclesManager initialCategories={categories} />
      ) : (
        <AddonsManager initialAddons={addons} />
      )}
    </div>
  )
}
