import { test, expect } from '@playwright/test'

test('measure profile fetch performance', async ({ page }) => {
  // Track all network requests
  const requests = []
  page.on('request', request => {
    if (request.url().includes('users') || request.url().includes('subscriptions')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now()
      })
    }
  })
  
  page.on('response', response => {
    const req = requests.find(r => r.url === response.url())
    if (req) {
      req.status = response.status()
      req.duration = Date.now() - req.startTime
    }
  })
  
  // Clear auth and login fresh
  await page.goto('http://localhost:5176/weekmenu/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  await page.goto('http://localhost:5176/weekmenu/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'testpassword123')
  
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'))
  
  // Wait for auth to complete
  await page.waitForTimeout(1000)
  
  console.log('\n=== Network Requests ===')
  requests.forEach(req => {
    console.log(`${req.method} ${req.url}`)
    console.log(`  Status: ${req.status || 'pending'}, Duration: ${req.duration || 'N/A'}ms`)
  })
  
  // Now test with persistent auth
  await page.reload()
  
  const persistentRequests = []
  page.on('request', request => {
    if (request.url().includes('users') || request.url().includes('subscriptions')) {
      persistentRequests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now()
      })
    }
  })
  
  page.on('response', response => {
    const req = persistentRequests.find(r => r.url === response.url())
    if (req) {
      req.status = response.status()
      req.duration = Date.now() - req.startTime
    }
  })
  
  await page.waitForTimeout(1000)
  
  console.log('\n=== Persistent Auth Requests ===')
  persistentRequests.forEach(req => {
    console.log(`${req.method} ${req.url}`)
    console.log(`  Status: ${req.status || 'pending'}, Duration: ${req.duration || 'N/A'}ms`)
  })
})