import { test } from '@playwright/test';

test.describe('Detailed Login Network Analysis', () => {
  test('trace request origins and timing', async ({ page }) => {
    const requests = [];
    
    // Enhanced request capture with stack traces
    await page.route('**/*', async route => {
      const request = route.request();
      const url = request.url();
      
      // Capture initiator info
      if (url.includes('/rest/') || url.includes('/auth/')) {
        requests.push({
          url: url,
          method: request.method(),
          pathname: new URL(url).pathname,
          search: new URL(url).search,
          timestamp: Date.now(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      
      await route.continue();
    });
    
    // Also capture console logs to understand component lifecycle
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        consoleLogs.push({
          text: msg.text(),
          timestamp: Date.now()
        });
      }
    });
    
    const startTime = Date.now();
    
    // Perform login
    await page.goto('/weekmenu/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    const loginClickTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
    
    // Wait for app to stabilize
    await page.waitForTimeout(3000);
    
    // Analyze requests
    const apiRequests = requests.filter(r => 
      r.url.includes('/rest/') || r.url.includes('/auth/')
    );
    
    console.log('\n=== Detailed Request Timeline ===');
    
    // Group requests by endpoint
    const requestGroups = {};
    apiRequests.forEach(req => {
      const endpoint = req.pathname.split('?')[0];
      if (!requestGroups[endpoint]) {
        requestGroups[endpoint] = [];
      }
      requestGroups[endpoint].push(req);
    });
    
    // Analyze each endpoint
    Object.entries(requestGroups).forEach(([endpoint, reqs]) => {
      console.log(`\n${endpoint}:`);
      reqs.forEach((req, idx) => {
        const relTime = req.timestamp - loginClickTime;
        const params = req.search ? ` ${req.search}` : '';
        const select = req.search?.includes('select=') ? 
          req.search.match(/select=([^&]*)/)?.[1] : '';
        
        console.log(`  ${idx + 1}. ${relTime}ms after login${params}`);
        if (select) {
          console.log(`     Fields: ${decodeURIComponent(select)}`);
        }
      });
    });
    
    // Analyze request patterns
    console.log('\n=== Request Pattern Analysis ===');
    
    // Check for requests that could be combined
    const userRequests = requestGroups['/rest/v1/users'] || [];
    if (userRequests.length > 1) {
      console.log('\nMultiple user requests:');
      userRequests.forEach((req, idx) => {
        const select = req.search?.match(/select=([^&]*)/)?.[1];
        console.log(`  ${idx + 1}. Selecting: ${select ? decodeURIComponent(select) : 'all fields'}`);
      });
    }
    
    const shoppingListRequests = requestGroups['/rest/v1/shopping_lists'] || [];
    if (shoppingListRequests.length > 1) {
      console.log('\nMultiple shopping list requests:');
      shoppingListRequests.forEach((req, idx) => {
        const filter = req.search?.match(/[?&]([^=]+)=eq\.([^&]*)/);
        console.log(`  ${idx + 1}. Filter: ${filter ? `${filter[1]}=${filter[2]}` : 'none'}`);
      });
    }
    
    // Calculate potential savings
    console.log('\n=== Optimization Opportunities ===');
    
    const duplicateEndpoints = Object.entries(requestGroups)
      .filter(([_, reqs]) => reqs.length > 1);
    
    let potentialSavings = 0;
    duplicateEndpoints.forEach(([endpoint, reqs]) => {
      const firstReqTime = reqs[0].timestamp - loginClickTime;
      const lastReqTime = reqs[reqs.length - 1].timestamp - loginClickTime;
      const savedTime = lastReqTime - firstReqTime;
      potentialSavings += savedTime;
      
      console.log(`${endpoint}: ${reqs.length} requests, potential ${savedTime}ms saved`);
    });
    
    console.log(`\nTotal potential savings from deduplication: ${potentialSavings}ms`);
    
    // Check for sequential vs parallel opportunities
    const sortedRequests = apiRequests.sort((a, b) => a.timestamp - b.timestamp);
    const authTime = sortedRequests.find(r => r.url.includes('/auth/'))?.timestamp || loginClickTime;
    const firstDataRequest = sortedRequests.find(r => r.url.includes('/rest/'))?.timestamp || authTime;
    
    console.log(`\nSequential delay: ${firstDataRequest - authTime}ms between auth and first data request`);
    
    console.log('\n========================================\n');
  });
});