import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) {
    // If env vars are not set, return null gracefully (or dummy client)
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export async function signInWithGoogleOAuth() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Fallback: direct to API or handle gracefully
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/auth/google`;
    window.location.href = redirectUrl;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}
