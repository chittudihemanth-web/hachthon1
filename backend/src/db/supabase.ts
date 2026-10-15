// backend/src/db/supabase.ts — Backend Supabase Database Client
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

export const isSupabaseConfigured = (): boolean => {
  const url = ENV.SUPABASE_URL;
  const key = ENV.SUPABASE_SERVICE_ROLE_KEY;
  return (
    !!url &&
    !!key &&
    !url.includes('your-project-id') &&
    !key.includes('your-supabase-service-role-key')
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const supabase = getSupabaseClient();
