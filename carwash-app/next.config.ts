import { setDefaultResultOrder } from 'node:dns'
import type { NextConfig } from 'next'

try {
  setDefaultResultOrder('ipv4first')
} catch {
  // ignore
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
}

export default nextConfig
