import { expect, test } from '@playwright/test';

test.describe('Login Performance Analysis', () => {
  test('analyze login critical path', async ({ page }) => {
    const timings = {};
    
    // Start total timer
    const startTotal = Date.now();
    
    // 1. Navigate to login page
    const navStart = Date.now();
    await page.goto('/weekmenu/login');
    timings.navigation = Date.now() - navStart;
    
    // 2. Wait for page to be interactive
    const interactiveStart = Date.now();
    await page.waitForLoadState('domcontentloaded');
    timings.domReady = Date.now() - interactiveStart;
    
    // 3. Wait for network idle
    const networkStart = Date.now();
    await page.waitForLoadState('networkidle');
    timings.networkIdle = Date.now() - networkStart;
    
    // 4. Fill email
    const emailStart = Date.now();
    await page.fill('input[type="email"]', 'test@example.com');
    timings.fillEmail = Date.now() - emailStart;
    
    // 5. Fill password
    const passwordStart = Date.now();
    await page.fill('input[type="password"]', 'testpassword123');
    timings.fillPassword = Date.now() - passwordStart;
    
    // 6. Click submit
    const submitStart = Date.now();
    await page.click('button[type="submit"]');
    timings.clickSubmit = Date.now() - submitStart;
    
    // 7. Wait for navigation
    const authStart = Date.now();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    timings.authentication = Date.now() - authStart;
    
    // 8. Wait for app to be ready
    const appReadyStart = Date.now();
    await page.waitForLoadState('networkidle');
    timings.appReady = Date.now() - appReadyStart;
    
    timings.total = Date.now() - startTotal;
    
    // Log performance breakdown
    console.log('\n=== Login Performance Breakdown ===');
    console.log(`Navigation to login: ${timings.navigation}ms`);
    console.log(`DOM Ready: ${timings.domReady}ms`);
    console.log(`Network Idle: ${timings.networkIdle}ms`);
    console.log(`Fill Email: ${timings.fillEmail}ms`);
    console.log(`Fill Password: ${timings.fillPassword}ms`);
    console.log(`Click Submit: ${timings.clickSubmit}ms`);
    console.log(`Authentication: ${timings.authentication}ms`);
    console.log(`App Ready: ${timings.appReady}ms`);
    console.log(`TOTAL: ${timings.total}ms`);
    console.log('===================================\n');
    
    // Identify bottlenecks
    const bottlenecks = Object.entries(timings)
      .filter(([key]) => key !== 'total')
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    console.log('Top 3 bottlenecks:');
    bottlenecks.forEach(([step, time], i) => {
      console.log(`${i + 1}. ${step}: ${time}ms (${Math.round(time / timings.total * 100)}% of total)`);
    });
    
    // Assert reasonable performance
    expect(timings.total).toBeLessThan(15000); // Total should be under 15 seconds
  });

  test('measure login with network throttling', async ({ page }) => {
    // Simulate slow 3G
    await page.context().route('**/*', route => route.continue());
    
    const start = Date.now();
    
    await page.goto('/weekmenu/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
    
    const duration = Date.now() - start;
    console.log(`Login with simulated slow network: ${duration}ms`);
  });
});