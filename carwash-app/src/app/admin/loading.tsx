import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-brand-neon mb-3" />
      <span className="text-xs text-slate-400">Loading admin data...</span>
    </div>
  )
}
