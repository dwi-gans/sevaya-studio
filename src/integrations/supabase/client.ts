import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/config/env';

/**
 * Browser-safe Supabase client for client-side Auth and queries.
 */
export const supabase = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
