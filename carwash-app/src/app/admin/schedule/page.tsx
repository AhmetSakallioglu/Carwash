'use client'

import React, { useState, useEffect } from 'react'
import { BusinessSchedule, BlackoutDate } from '@/types'
import { ScheduleManager } from '@/components/admin/ScheduleManager'
import { BlackoutManager } from '@/components/admin/BlackoutManager'
import { MOCK_SCHEDULES, MOCK_BLACKOUTS } from '@/lib/supabase/mock-data'
import { Loader2 } from 'lucide-react'

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<BusinessSchedule[]>(MOCK_SCHEDULES)
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>(MOCK_BLACKOUTS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, blackRes] = await Promise.all([
          fetch('/api/admin/schedules').then(r => r.json()),
          fetch('/api/admin/blackout-dates').then(r => r.json()),
        ])

        if (schedRes.schedules) setSchedules(schedRes.schedules)
        if (blackRes.blackout_dates) setBlackouts(blackRes.blackout_dates)
      } catch (err) {
        console.error('Error loading schedules:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Hours & Blackout Schedule
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Control when APEX Studio accepts appointments and block off holidays or maintenance days.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-neon mb-3" />
          <span className="text-xs text-slate-400">Loading schedule configuration...</span>
        </div>
      ) : (
        <div className="space-y-8">
          <ScheduleManager initialSchedules={schedules} />
          <BlackoutManager initialBlackouts={blackouts} />
        </div>
      )}
    </div>
  )
}
