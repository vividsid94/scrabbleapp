import { createClient } from '@supabase/supabase-js';

// Supabase configuration - these should be set as environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if real credentials are provided
const hasRealCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && 
                          supabaseAnonKey !== 'placeholder-key' &&
                          supabaseUrl && 
                          supabaseAnonKey;

if (!hasRealCredentials) {
  console.warn('Supabase environment variables are not set. Auth features will not work.');
  console.warn('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

