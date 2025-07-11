// Helper functions for menu selector tests that focus on user intent

export async function selectRecipe(page, recipeIndex = 0) {
  // User intent: Add a recipe to my menu
  const addButtons = await page.locator('button:has-text("Add to menu")').all();
  if (addButtons.length > recipeIndex) {
    await addButtons[recipeIndex].click();
    await page.waitForTimeout(200); // Brief wait for UI update
  }
}

export async function getSelectedRecipeCount(page) {
  // User intent: See how many recipes I've selected
  // Check selected recipe cards (those with checkmarks)
  const selectedCards = await page.locator('[data-testid="recipe-card"]:has(svg path[d*="M5 13l4 4L19 7"])').count();
  if (selectedCards > 0) {
    return selectedCards;
  }
  
  // If sidebar is collapsed, check the badge count
  const collapsedBadge = page.locator('[data-testid="sidebar-toggle-collapsed"]');
  if (await collapsedBadge.isVisible()) {
    const badgeText = await collapsedBadge.textContent();
    const match = badgeText.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return 0;
}

export async function waitForRecipesToLoad(page) {
  // User intent: See available recipes
  // Wait for recipe cards to appear (not images, as they might fail to load)
  await page.waitForSelector('[data-testid="recipe-card"]', { 
    timeout: 15000,
    state: 'visible' 
  });
  // Give a moment for all cards to render
  await page.waitForTimeout(500);
}

export async function isOfflineIndicatorVisible(page) {
  // User intent: Know if I'm working offline
  const offlineIndicators = await page.locator('text=/offline|no.{0,10}connection|disconnected/i').all();
  return offlineIndicators.length > 0;
}

export async function isSyncingIndicatorVisible(page) {
  // User intent: Know if my changes are being saved
  const syncIndicators = await page.locator('text=/saving|syncing|updating/i').all();
  return syncIndicators.length > 0;
}

export async function adjustServings(page, recipeIdentifier, delta) {
  // User intent: Change how many servings I need
  // Find the recipe area (could be in grid or sidebar)
  const recipeAreas = await page.locator(`[class*="recipe"]:has-text("${recipeIdentifier}"), [data-testid*="recipe"]:has-text("${recipeIdentifier}")`).all();
  
  for (const area of recipeAreas) {
    const buttons = delta > 0 
      ? await area.locator('button:has-text("+")').all()
      : await area.locator('button:has-text("-"), button:has-text("−")').all();
    
    if (buttons.length > 0) {
      for (let i = 0; i < Math.abs(delta); i++) {
        await buttons[0].click();
        await page.waitForTimeout(100);
      }
      return true;
    }
  }
  return false;
}

export async function removeRecipe(page, recipeIdentifier) {
  // User intent: Remove a recipe from my menu
  const removeButtons = await page.locator(`button:has-text("Remove"), button[aria-label*="remove"]`).all();
  
  // Try to find remove button near the recipe
  for (const button of removeButtons) {
    const parent = await button.locator('..').locator('..');
    const hasRecipe = await parent.locator(`text="${recipeIdentifier}"`).count() > 0;
    if (hasRecipe) {
      await button.click();
      return true;
    }
  }
  
  // Fallback: click any visible remove button
  if (removeButtons.length > 0) {
    await removeButtons[0].click();
    return true;
  }
  
  return false;
}

export async function getMenuData(page) {
  // User intent: Understand what's in my menu
  // This abstracts away localStorage implementation
  try {
    const data = await page.evaluate(() => {
      const stored = localStorage.getItem('weekmenu');
      return stored ? JSON.parse(stored) : null;
    });
    return data;
  } catch {
    return null;
  }
}

export async function waitForMenuToSave(page) {
  // User intent: Ensure my changes are saved
  // Wait for any save operation to complete
  await page.waitForTimeout(5500); // Account for 5s debounce
  
  // Wait for sync indicator to disappear
  await page.waitForFunction(() => {
    const syncIndicators = document.body.innerText.match(/saving|syncing|updating/i);
    return !syncIndicators;
  }, { timeout: 10000 }).catch(() => {});
}

export async function isRecipeSelected(page, recipeIdentifier) {
  // User intent: Check if I've already added this recipe
  // Look for visual indicators that a recipe is selected
  const recipeElements = await page.locator(`[class*="recipe"]:has-text("${recipeIdentifier}"), [data-testid*="recipe"]:has-text("${recipeIdentifier}")`).all();
  
  for (const element of recipeElements) {
    // Check for various selection indicators
    const hasRemoveButton = await element.locator('button:has-text("Remove")').count() > 0;
    const hasCheckmark = await element.locator('[class*="check"], [class*="selected"], svg path[d*="M5 13l4"]').count() > 0;
    const hasServingsControl = await element.locator('button:has-text("+")').count() > 0;
    
    if (hasRemoveButton || hasCheckmark || hasServingsControl) {
      return true;
    }
  }
  
  return false;
}

export async function toggleSidebar(page, shouldOpen) {
  // User intent: Show/hide my selected recipes
  if (shouldOpen) {
    // Look for collapsed indicator and click it
    const collapsedIndicator = await page.locator('button:has-text(/\\d+ recipes?/):not(:has-text("Generate"))').first();
    if (await collapsedIndicator.isVisible()) {
      await collapsedIndicator.click();
    }
  } else {
    // Look for close button in sidebar
    const closeButton = await page.locator('button:has(svg path[d*="M6 18L18"])').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}

export async function scrollToLoadMore(page) {
  // User intent: See more recipes
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000); // Wait for potential loading
}

export async function getVisibleRecipeCount(page) {
  // User intent: Count how many recipes I can see
  const recipeElements = await page.locator('[class*="recipe-card"], [class*="recipe"][class*="card"], [data-testid*="recipe-card"]').all();
  return recipeElements.length;
}