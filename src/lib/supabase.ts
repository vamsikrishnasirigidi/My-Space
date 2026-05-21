import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if Supabase is properly configured or if we should run in local sandbox mode
export const isMock = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('YOUR_SUPABASE') || 
  supabaseAnonKey.includes('YOUR_SUPABASE');

if (isMock) {
  console.warn(
    'My Space: running in Mock Sandbox Mode. To sync with a real cloud database, please set ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or .env.local file.'
  );
}

// Safely initialize Supabase only if valid configuration exists, avoiding boot failures
export const supabase = !isMock
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
