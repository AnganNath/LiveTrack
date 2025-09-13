import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: In a real application, these would be in environment variables
// (e.g., process.env.REACT_APP_SUPABASE_URL)
const supabaseUrl = '(https://hthaslxgiggwoggkymua.supabase.co/)'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aGFzbHhnaWdnd29nZ2t5bXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDc4OTQsImV4cCI6MjA3MzI4Mzg5NH0.vXjmuhWqxf_QseGjZTLK3QJtKTd0ipTn9SWYH3DD_3I';


const isSupabaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isSupabaseConfigured) {
  console.warn("Supabase is not configured.");
}


export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;