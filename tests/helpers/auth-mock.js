export async function mockAuth(page) {
  // Mock auth session in localStorage - must be done BEFORE clearing localStorage in tests
  await page.addInitScript(() => {
    const mockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        role: 'authenticated'
      }
    };
    // Don't clear localStorage here - let tests handle that
    localStorage.setItem('sb-padeskjkdetesmfuicvm-auth-token', JSON.stringify(mockSession));
  });

  // Mock all Supabase auth endpoints
  await page.route('**/auth/v1/user**', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'mock-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        role: 'authenticated'
      })
    });
  });

  // Mock auth session endpoint
  await page.route('**/auth/v1/session', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }
      })
    });
  });

  // Mock user profile endpoint with subscription
  await page.route('**/rest/v1/users**', route => {
    const url = new URL(route.request().url());
    const selectParam = url.searchParams.get('select');
    
    if (selectParam && selectParam.includes('subscription')) {
      // Return user with subscription data
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'mock-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          subscription: {
            id: 'sub-123',
            user_id: 'mock-user-id',
            default_servings: 4
          }
        })
      });
    } else {
      route.fulfill({
        status: 200,
        body: JSON.stringify([{
          id: 'mock-user-id',
          email: 'test@example.com',
          full_name: 'Test User'
        }])
      });
    }
  });

  // Mock subscription endpoint
  await page.route('**/rest/v1/subscriptions**', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([{
        id: 'sub-123',
        user_id: 'mock-user-id',
        default_servings: 4
      }])
    });
  });

  // Mock weekmenus endpoint
  await page.route('**/rest/v1/weekmenus**', route => {
    if (route.request().method() === 'GET') {
      // Return empty for initial load
      route.fulfill({
        status: 404,
        body: JSON.stringify({
          code: 'PGRST116',
          message: 'No rows found'
        })
      });
    } else if (route.request().method() === 'POST') {
      // Return created weekmenu
      const requestBody = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        body: JSON.stringify([{
          id: 'weekmenu-123',
          ...requestBody,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      });
    } else if (route.request().method() === 'PATCH') {
      // Return updated weekmenu
      route.fulfill({
        status: 200,
        body: JSON.stringify([])
      });
    }
  });

  // Mock recipes endpoint with current database structure
  await page.route('**/rest/v1/recipes**', route => {
    const url = new URL(route.request().url());
    const isCount = url.searchParams.has('count');
    
    if (isCount) {
      route.fulfill({
        status: 200,
        headers: { 'content-range': '0-0/100' },
        body: '[]'
      });
    } else {
      // Generate recipes without ingredients
      const recipes = [];
      const seasonalIngredients = ['pompoen', 'spruitjes', 'witloof', 'pastinaak'];
      
      for (let i = 0; i < 24; i++) {
        const isSeasonalRecipe = i % 5 === 0;
        
        recipes.push({
          id: `recipe-${i + 1}`,
          title: isSeasonalRecipe ? `${seasonalIngredients[i % 4]} Recipe ${i + 1}` : `Recipe ${i + 1}`,
          time_estimation: 30 + (i % 4) * 15,
          image_url: `https://via.placeholder.com/300x200?text=Recipe+${i + 1}`,
          random_order_1: Math.floor(Math.random() * 1000000),
          random_order_2: Math.floor(Math.random() * 1000000),
          random_order_3: Math.floor(Math.random() * 1000000),
          random_order_4: Math.floor(Math.random() * 1000000),
          random_order_5: Math.floor(Math.random() * 1000000),
          random_order_6: Math.floor(Math.random() * 1000000),
          random_order_7: Math.floor(Math.random() * 1000000),
          random_order_8: Math.floor(Math.random() * 1000000),
          random_order_9: Math.floor(Math.random() * 1000000),
          random_order_10: Math.floor(Math.random() * 1000000),
          random_order_11: Math.floor(Math.random() * 1000000),
          random_order_12: Math.floor(Math.random() * 1000000),
          random_order_13: Math.floor(Math.random() * 1000000),
          random_order_14: Math.floor(Math.random() * 1000000),
          random_order_15: Math.floor(Math.random() * 1000000),
          random_order_16: Math.floor(Math.random() * 1000000),
          random_order_17: Math.floor(Math.random() * 1000000),
          random_order_18: Math.floor(Math.random() * 1000000),
          random_order_19: Math.floor(Math.random() * 1000000),
          random_order_20: Math.floor(Math.random() * 1000000)
        });
      }
      
      route.fulfill({
        status: 200,
        body: JSON.stringify(recipes)
      });
    }
  });
}