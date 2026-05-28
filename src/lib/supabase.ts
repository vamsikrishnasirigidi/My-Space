import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const allowMockAuth = import.meta.env.VITE_ALLOW_MOCK_AUTH === 'true';

// Detect if Supabase is properly configured or if we should run in local sandbox mode
export const isMock = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('YOUR_SUPABASE') || 
  supabaseAnonKey.includes('YOUR_SUPABASE');

if (isMock) {
  if (allowMockAuth) {
    console.warn(
      'My Space: running in Mock Sandbox Mode. To sync with a real cloud database, please set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or .env.local file.'
    );
  } else {
    console.error(
      'Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. ' +
      'Set VITE_ALLOW_MOCK_AUTH=true only if you explicitly want mock auth mode.'
    );
  }
}

// Safely initialize Supabase only if valid configuration exists, avoiding boot failures
export const supabase: SupabaseClient | null = !isMock
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
