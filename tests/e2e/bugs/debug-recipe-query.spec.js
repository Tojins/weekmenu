import { test } from '@playwright/test'
import { loginWithStorageState } from '../../helpers/auth-persistent'

test('debug recipe preview query timing', async ({ page }) => {
  const logs = []
  const startTime = Date.now()
  
  page.on('console', msg => {
    const time = Date.now() - startTime
    if (msg.text().includes('WeekMenuContext') || msg.text().includes('AuthProvider')) {
      logs.push({ time, text: msg.text() })
    }
  })
  
  await loginWithStorageState(page)
  
  // Wait for recipes to potentially load
  await page.waitForTimeout(6000)
  
  console.log('=== WeekMenu/Auth Timeline ===')
  logs.forEach(log => {
    console.log(`[${log.time}ms] ${log.text}`)
  })
  
  // Check if recipe preview query ever ran
  const recipeQueryState = await page.evaluate(async () => {
    // Wait a bit for any pending queries
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check if fetchRecipePreview was called
    const weekmenu = JSON.parse(localStorage.getItem('weekmenu') || '{}')
    
    // Try to manually trigger the query to see if it works
    if (weekmenu.seed) {
      try {
        const { supabase } = await import('/src/supabaseClient.js')
        const start = performance.now()
        
        const { data, error } = await supabase
          .from('recipes')
          .select('id, title, image_url')
          .order(`random_order_${((weekmenu.seed - 1) % 20) + 1}`)
          .limit(4)
        
        const elapsed = performance.now() - start
        
        return {
          weekmenuSeed: weekmenu.seed,
          queryTime: elapsed,
          error: error?.message,
          recipeCount: data?.length || 0,
          recipes: data?.map(r => ({ id: r.id, title: r.title }))
        }
      } catch (e) {
        return { error: e.message }
      }
    }
    
    return { weekmenuSeed: weekmenu.seed, error: 'No seed available' }
  })
  
  console.log('\n=== Recipe Query Test ===')
  console.log('Result:', recipeQueryState)
})