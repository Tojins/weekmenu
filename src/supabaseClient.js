import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://padeskjkdetesmfuicvm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZGVza2prZGV0ZXNtZnVpY3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTg0NTMsImV4cCI6MjA2NzQ5NDQ1M30.LaXPbA4P5G3kGyko8rX-moR-PNYcltv3S0Ltt6E9aFE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Expose supabase to window for debugging (remove in production)
if (typeof window !== 'undefined') {
  window.supabase = supabase
}