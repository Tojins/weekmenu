import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' // Standard local service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  console.log('Creating admin test user...')

  // Create the admin user in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'testadmin@example.com',
    password: 'testpassword123',
    email_confirm: true,
    user_metadata: {
      email_verified: true
    }
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    process.exit(1)
  }

  console.log('Auth user created:', authData.user.id)

  // Update the user profile to set is_admin = true
  const { data: userData, error: userError } = await supabase
    .from('users')
    .update({ is_admin: true })
    .eq('id', authData.user.id)
    .select()
    .single()

  if (userError) {
    console.error('Error updating user profile:', userError)
    process.exit(1)
  }

  console.log('User profile updated with admin status:', userData)

  // Get the full user data
  const { data: fullUser, error: fullUserError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (fullUserError) {
    console.error('Error fetching user:', fullUserError)
    process.exit(1)
  }

  console.log('\nAdmin user created successfully!')
  console.log('Email:', fullUser.email)
  console.log('User ID:', fullUser.id)
  console.log('Subscription ID:', fullUser.subscription_id)
  console.log('Is Admin:', fullUser.is_admin)
}

createAdminUser().catch(console.error)