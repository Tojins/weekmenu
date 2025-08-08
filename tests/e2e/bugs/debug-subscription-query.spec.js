import { test } from '@playwright/test'
import { loginWithStorageState } from '../../helpers/auth-persistent'

test('debug subscription query', async ({ page }) => {
  await loginWithStorageState(page)
  
  // Wait for auth to complete
  await page.waitForTimeout(1000)
  
  // Test the query directly
  const result = await page.evaluate(async () => {
    const { supabase } = await import('/src/supabaseClient.js')
    
    // Query 1: What AuthProvider does
    const query1 = await supabase
      .from('users')
      .select('*, subscription:subscriptions(*)')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    // Query 2: Following the foreign key
    const query2 = await supabase
      .from('users')
      .select('*, subscription_id')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    // Query 3: Manual join
    const query3 = await supabase
      .from('users')
      .select(`
        *,
        subscriptions!inner(*)
      `)
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    return {
      query1: { data: query1.data, error: query1.error },
      query2: { data: query2.data, error: query2.error },
      query3: { data: query3.data, error: query3.error }
    }
  })
  
  console.log('Query results:')
  console.log('Query 1 (current):', JSON.stringify(result.query1, null, 2))
  console.log('Query 2 (simple):', JSON.stringify(result.query2, null, 2))
  console.log('Query 3 (manual join):', JSON.stringify(result.query3, null, 2))
})