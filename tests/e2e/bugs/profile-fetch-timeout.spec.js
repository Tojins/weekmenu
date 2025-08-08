import { test, expect } from '@playwright/test'

test('profile fetch timeout behavior', async ({ page }) => {
  // Clear all auth data to start fresh
  await page.goto('http://localhost:5176/weekmenu/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  // Login fresh
  await page.goto('http://localhost:5176/weekmenu/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'testpassword123')
  
  // Track console logs
  const logs = []
  const startTime = Date.now()
  page.on('console', msg => {
    const time = Date.now() - startTime
    logs.push({ time, type: msg.type(), text: msg.text() })
  })
  
  // Submit login
  await page.click('button[type="submit"]')
  
  // Wait for navigation
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
  
  // Wait a bit more to capture all logs
  await page.waitForTimeout(2000)
  
  // Analyze timeline
  console.log('\n=== Auth Timeline ===')
  const authLogs = logs.filter(log => 
    log.text.includes('AuthProvider') || 
    log.text.includes('Profile') ||
    log.text.includes('timeout')
  )
  
  authLogs.forEach(log => {
    console.log(`[${log.time}ms] ${log.type}: ${log.text}`)
  })
  
  // Check if profile fetch had issues
  const timeoutLogs = logs.filter(log => log.text.includes('timeout'))
  if (timeoutLogs.length > 0) {
    console.log('\n=== Timeouts Detected ===')
    timeoutLogs.forEach(log => {
      console.log(`[${log.time}ms] ${log.text}`)
    })
  }
  
  // Check final state
  const authState = await page.evaluate(() => {
    const authDiv = document.querySelector('[data-testid="auth-state"]')
    if (!authDiv) {
      // Try to get from React DevTools or window
      return { user: !!window.user, subscription: !!window.subscription }
    }
    return null
  })
  
  console.log('\n=== Final State ===')
  console.log('Auth state:', authState)
})