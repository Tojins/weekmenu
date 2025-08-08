import { test, expect } from '@playwright/test'
import { chromium } from '@playwright/test'

test.describe('Auth Timing Debug', () => {
  test('measure auth initialization timing', async () => {
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Track console logs with timing
    const consoleLogs = []
    const startTime = Date.now()
    
    page.on('console', msg => {
      const relativeTime = Date.now() - startTime
      consoleLogs.push({
        time: relativeTime,
        type: msg.type(),
        text: msg.text()
      })
    })
    
    // Navigate and wait for auth to complete
    await page.goto('http://localhost:5176/weekmenu/')
    
    // Wait for auth to settle (either success or timeout)
    await page.waitForTimeout(6000)
    
    // Analyze the logs
    console.log('\n=== Auth Flow Timeline ===')
    consoleLogs
      .filter(log => log.text.includes('AuthProvider') || log.text.includes('timeout'))
      .forEach(log => {
        console.log(`[${log.time}ms] ${log.type.toUpperCase()}: ${log.text}`)
      })
    
    // Check for auth timeouts
    const timeouts = consoleLogs.filter(log => 
      log.type === 'error' && log.text.includes('timeout')
    )
    
    if (timeouts.length > 0) {
      console.log('\n=== Timeouts Detected ===')
      timeouts.forEach(timeout => {
        console.log(`Timeout at ${timeout.time}ms: ${timeout.text}`)
      })
    }
    
    // Get final auth state
    const authState = await page.evaluate(() => {
      const authContext = window.localStorage.getItem('sb-padeskjkdetesmfuicvm-auth-token')
      return authContext ? JSON.parse(authContext) : null
    })
    
    console.log('\n=== Final Auth State ===')
    console.log('Has auth token:', !!authState)
    if (authState) {
      console.log('Access token present:', !!authState.access_token)
      console.log('User present:', !!authState.user)
    }
    
    await browser.close()
  })
  
  test('measure supabase query performance directly', async ({ page }) => {
    // First, get authenticated
    await page.goto('http://localhost:5176/weekmenu/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL((url) => !url.pathname.includes('/login'))
    
    // Now measure profile fetch directly
    const profileFetchTime = await page.evaluate(async () => {
      const start = performance.now()
      
      // Import supabase client
      const { supabase } = await import('/src/supabaseClient.js')
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, subscription:subscriptions(*)')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single()
        
        const elapsed = performance.now() - start
        
        return {
          success: !error,
          time: elapsed,
          error: error?.message,
          hasData: !!data,
          hasSubscription: !!data?.subscription
        }
      } catch (e) {
        return {
          success: false,
          time: performance.now() - start,
          error: e.message
        }
      }
    })
    
    console.log('\n=== Direct Supabase Query Performance ===')
    console.log(`Profile fetch took: ${profileFetchTime.time}ms`)
    console.log(`Success: ${profileFetchTime.success}`)
    if (profileFetchTime.error) {
      console.log(`Error: ${profileFetchTime.error}`)
    }
    console.log(`Has data: ${profileFetchTime.hasData}`)
    console.log(`Has subscription: ${profileFetchTime.hasSubscription}`)
    
    expect(profileFetchTime.time).toBeLessThan(1000) // Should be under 1 second
  })
})