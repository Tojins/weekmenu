import { supabase } from '../supabaseClient'

// Temporary utility to set password for existing OAuth user
// Run this in browser console while logged in
export async function setPasswordForCurrentUser(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) {
    console.error('Error setting password:', error)
    return { error }
  }
  
  console.log('Password set successfully!')
  return { data }
}

// Usage in browser console:
// 1. Log in with Google OAuth first
// 2. Open browser console
// 3. Run: await setPasswordForCurrentUser('your-new-password')