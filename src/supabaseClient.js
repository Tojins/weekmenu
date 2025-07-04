import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ekqbstkvcphcmweazldg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcWJzdGt2Y3BoY213ZWF6bGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjE0ODksImV4cCI6MjA2NzIzNzQ4OX0.LAk8MAUYy3_dtt2aWBb1Gq86RvsQWX5QzjrhCWCmI_I'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey.length)
console.log('First 20 chars of key:', supabaseAnonKey.substring(0, 20))

export const supabase = createClient(supabaseUrl, supabaseAnonKey)