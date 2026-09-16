import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { nodeIpv4Fetch } from './node-fetch'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim()
  return Boolean(url && key && !url.includes('placeholder') && !url.includes('your-project'))
}

export function createAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim()
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-service-key'
  ).trim()

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: nodeIpv4Fetch,
    },
  })
}

/** Alias expected by Server Components / Server Actions */
export const supabaseAdmin = createAdminClient
