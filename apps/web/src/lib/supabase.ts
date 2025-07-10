import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables in development
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found' : 'Missing')
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check that .env.dev is loaded correctly.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'implicit', // Temporary switch from PKCE to implicit flow
    debug: import.meta.env.DEV // Enable debug mode in development
  }
})