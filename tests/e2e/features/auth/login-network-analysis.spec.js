import { test } from '@playwright/test';

test.describe('Login Network Analysis', () => {
  test('analyze network requests during login', async ({ page }) => {
    const requests = [];
    
    // Capture all network requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
    });
    
    // Capture responses to see timing
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      });
    });
    
    const startTime = Date.now();
    
    // Perform login
    await page.goto('/weekmenu/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
    
    // Wait a bit more to capture all requests
    await page.waitForTimeout(2000);
    
    // Analyze API/data requests
    const apiRequests = requests.filter(r => 
      r.url.includes('/auth/') || 
      r.url.includes('/rest/') ||
      r.url.includes('supabase') ||
      r.resourceType === 'fetch' ||
      r.resourceType === 'xhr'
    );
    
    console.log('\n=== API/Data Requests During Login ===');
    const baseTime = startTime;
    
    apiRequests.forEach(req => {
      const relativeTime = req.timestamp - baseTime;
      const urlPath = new URL(req.url).pathname;
      console.log(`${relativeTime}ms: ${req.method} ${urlPath}`);
    });
    
    // Look for duplicate requests
    const urlCounts = {};
    apiRequests.forEach(req => {
      const key = `${req.method} ${new URL(req.url).pathname}`;
      urlCounts[key] = (urlCounts[key] || 0) + 1;
    });
    
    console.log('\n=== Duplicate Requests ===');
    Object.entries(urlCounts)
      .filter(([_, count]) => count > 1)
      .forEach(([url, count]) => {
        console.log(`${url}: ${count} times`);
      });
    
    // Analyze sequential vs parallel loading
    console.log('\n=== Request Timeline ===');
    const authRequests = apiRequests.filter(r => r.url.includes('/auth/'));
    const userRequests = apiRequests.filter(r => r.url.includes('/users'));
    const subscriptionRequests = apiRequests.filter(r => r.url.includes('/subscription'));
    
    if (authRequests.length) {
      console.log(`Auth requests: ${authRequests[0].timestamp - baseTime}ms - ${authRequests[authRequests.length-1].timestamp - baseTime}ms`);
    }
    if (userRequests.length) {
      console.log(`User requests: ${userRequests[0].timestamp - baseTime}ms - ${userRequests[userRequests.length-1].timestamp - baseTime}ms`);
    }
    if (subscriptionRequests.length) {
      console.log(`Subscription requests: ${subscriptionRequests[0].timestamp - baseTime}ms - ${subscriptionRequests[subscriptionRequests.length-1].timestamp - baseTime}ms`);
    }
    
    console.log('\nTotal API requests:', apiRequests.length);
    console.log('=======================================\n');
  });
});