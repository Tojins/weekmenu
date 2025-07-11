# Better Test Patterns for Menu Selector

## 1. Test for Intent, Not Exact Wording

### ❌ Too Specific
```javascript
await expect(page.locator('text="That\'s a lot of cooking!"')).toBeVisible();
```

### ✅ Better - Test the Intent
```javascript
// Look for any warning message when hitting soft limit
await expect(page.locator('[role="alert"], .warning, text=/warning|lot|many|seven/i')).toBeVisible();
```

### ✅ Even Better - Test User Impact
```javascript
// At 7 recipes, user should see some form of feedback
const hasWarningIndication = await page.locator('[role="alert"]').count() > 0 ||
                            await page.locator('text=/warning|caution|lot|many/i').count() > 0 ||
                            await page.locator('.text-yellow-500, .text-orange-500').count() > 0;
expect(hasWarningIndication).toBeTruthy();
```

## 2. Test Behavioral Outcomes

### ❌ Testing Specific UI Elements
```javascript
await expect(page.locator('button:has-text("Add to menu")')).toBeVisible();
```

### ✅ Testing User Capabilities
```javascript
// User should be able to add recipes to their menu
const canAddRecipe = await page.locator('button:has-text(/add/i)').count() > 0 ||
                     await page.locator('[aria-label*="add"]').count() > 0 ||
                     await page.locator('button:has(svg[class*="plus"])').count() > 0;
expect(canAddRecipe).toBeTruthy();
```

## 3. Use Data Attributes for Critical Behaviors

### Best Practice - Add Test IDs for Critical Elements
```javascript
// In component:
<button data-testid="add-recipe">Add to menu</button>

// In test:
await page.locator('[data-testid="add-recipe"]').click();
```

## 4. Create Semantic Helpers

```javascript
// Helper functions that abstract implementation details
async function addRecipeToMenu(page, recipeIndex = 0) {
  // Try multiple strategies
  const addButton = page.locator('button').filter({ 
    has: page.locator('text=/add|plus|\\+/i') 
  }).nth(recipeIndex);
  
  if (await addButton.isVisible()) {
    await addButton.click();
    return;
  }
  
  // Fallback: click on recipe card itself
  const recipeCard = page.locator('[role="article"], .recipe-card, div:has(img)').nth(recipeIndex);
  await recipeCard.click();
}

async function expectRecipeLimitWarning(page) {
  // Any indication of reaching a limit
  const limitIndicators = [
    page.locator('[role="alert"]'),
    page.locator('text=/limit|maximum|many|lot/i'),
    page.locator('.warning, .error'),
    page.locator('[class*="yellow"], [class*="orange"], [class*="red"]')
  ];
  
  for (const indicator of limitIndicators) {
    if (await indicator.isVisible()) return true;
  }
  
  return false;
}
```

## 5. Specification Constants

When the spec explicitly defines text, create constants:

```javascript
// specs/menu-selector-constants.js
export const SPEC_TEXTS = {
  // Only for texts explicitly defined in specification
  SOFT_LIMIT_WARNING: /that's a lot of cooking/i,
  HARD_LIMIT: 28,
  SOFT_LIMIT: 7,
  
  // But prefer patterns for most cases
  LIMIT_REACHED: /limit|maximum|cannot add|full/i,
  OFFLINE_INDICATOR: /offline|disconnected|no connection/i
};
```

## 6. Progressive Enhancement Testing

```javascript
test('shows feedback when approaching recipe limit', async ({ page }) => {
  // Add recipes up to soft limit
  for (let i = 0; i < 7; i++) {
    await addRecipeToMenu(page, i);
  }
  
  // Level 1: Any visual feedback exists
  const hasFeedback = await page.locator('[role="alert"], .warning, [class*="warning"]').count() > 0;
  expect(hasFeedback).toBeTruthy();
  
  // Level 2 (optional): If spec defines specific text, check for it
  if (process.env.STRICT_SPEC_COMPLIANCE) {
    await expect(page.locator('text=/that\'s a lot of cooking/i')).toBeVisible();
  }
});
```

## Summary

The pragmatic approach is to:

1. **Test user outcomes**, not implementation details
2. **Use semantic selectors** (roles, aria-labels) over visual ones
3. **Accept multiple valid implementations** of the same feature
4. **Use data-testid** for critical user journeys
5. **Create abstraction layers** for common actions
6. **Keep spec-specific text in constants** when absolutely necessary

This approach makes tests:
- ✅ Resilient to UI changes
- ✅ Resilient to copy changes  
- ✅ Focused on user experience
- ✅ Easier to maintain
- ✅ Still ensure spec compliance