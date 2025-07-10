# Menu Selector Workflow Design

## Overview
The menu selector is a recipe-first interface where users browse and select recipes for their weekly menu. The focus is on discovering and choosing recipes, with selected items collected in a collapsible sidebar.

## Core Features

### 1. Recipe Browser (Primary View)
- Full-screen recipe grid taking up entire viewport
- Search and filter capabilities prominently displayed
- Visual feedback for selected recipes
- Optimized for browsing and discovery

### 2. Selected Recipes Sidebar
- Hidden by default until first recipe selected
- Slides in from right with smooth animation
- Can be toggled between expanded and collapsed states
- Collapsed state shows only a badge with recipe count
- Expanded state shows full recipe list with management options

### 3. Recipe Selection Flow
1. **Main View**: Full-screen recipe browser
   - Compact search/filter bar at top:
     - Search icon + "Search recipes..." placeholder (expands on click)
     - Filter icon with badge showing active filter count
     - Click either to expand full search/filter panel
   - Expanded search/filter panel:
     - Full search input with clear button
     - Recent searches dropdown (stored in localStorage with 30-day expiry)
     - Filter pills: cooking time, ingredients, seasonal
     - "Apply" and "Clear all" buttons
     - Smooth slide-down animation
     - Click outside or "X" to collapse
   - Recipe grid fills remaining space
   - Recipe cards: Large recipe image, title + cooking time, ingredient list, labels
   - "Add to menu" button on each card with a servings count (+/- buttons, default from subscription default)
   - Visual indicator for already-added recipes
   - Infinite scroll (auto-loads more recipes when scrolling near bottom)
   - Click protection: 40px zone around buttons/inputs prevents modal opening

2. **Added recipes panel**: (collapsible)
   - Right sidepanel (except for small or narrow viewport)
   - Initially hidden
   - Shows fixed badge on right edge when first recipe is added
   - Badge displays: "5 recipes → Continue" with arrow pointing right
   - Badge uses primary action color (same as "Generate shopping list" button)
   - Click badge to toggle panel open/closed
   - Mobile only: Can also swipe from right edge
   - First recipe added: Badge animates in with subtle bounce
   - Panel contents:
     - Header: "Selected Recipes (5)"
     - List of selected recipes with editable servings count
     - Remove button on each recipe
     - "Generate shopping list" button at bottom (primary action, stub for now)

## Data Persistence Strategy

### Hybrid Approach (Recommended)
- Immediate saves to localStorage for responsiveness
- Debounced sync to database (every 5 seconds of inactivity)
- Conflict resolution: last-write-wins with timestamps

### Implementation:
- Immediate saves to localStorage
- Debounced sync to database (every 5 seconds of inactivity)
- Conflict resolution: last-write-wins with timestamps
- Works offline with sync when connection restored

### Data Structure:
```javascript
{
  weekmenu: {
    subscriptionId: "uuid",
    seed: 12345, // Random seed for consistent recipe ordering
    version: 1, // Increments on each update for conflict detection
    recipes: [
      { recipeId: "uuid", servings: 4},
      { recipeId: "uuid", servings: 6},
      { recipeId: "uuid", servings: 4}
    ],
    updatedAt: "timestamp"
  }
}
```

## User Experience Optimizations

### 1. Smart Suggestions
- 'Seasonal' label
- Favorites

### 3. Visual Feedback
- Subtle animation when adding/removing recipes
- "Already in menu" indicator on recipe cards
- Offline mode indicator

### 4. Mobile Considerations
- Grid becomes a vertical list (3 columns on wide screens, 2 columns medium, 1 on small)
- Selected recipes panel as bottom sheet with visual pull handle
- Partial reveal showing 1 recipe when collapsed
- Swipe up to fully expand
- Tap collapsed panel to expand

## Implementation Phases

### Phase 1: MVP
- Full-screen recipe browser
- Collapsible sidebar for selected recipes
- Add/remove recipes functionality
- localStorage persistence only
- Seed-based recipe ordering for variety

### Phase 2: database
- Database sync with offline support

## Technical Considerations

### State Management
```javascript
// React Context for menu state
const WeekMenuContext = {
  weekmenu: {
    subscriptionId: "uuid",
    seed: 12345, // Random seed for consistent recipe ordering
    recipes: [
      { recipeId: "uuid", servings: 4},
      { recipeId: "uuid", servings: 6},
      { recipeId: "uuid", servings: 4}
    ],
    updatedAt: "timestamp"
  },
  isLoading: boolean,
  isSyncing: boolean,
  addRecipe: (recipeId) => void,
  removeRecipe: (recipeId) => void,
}
```

### Performance
- Lazy load recipe images
- Infinite scroll implementation:
  - Load 24 recipes initially
  - Fetch next 24 when user scrolls to 80% of content
  - Show loading spinner at bottom while fetching
  - Prevent duplicate fetches with loading state
  - Virtual scrolling for large collections (react-window)
- Seed-based recipe ordering:
  - Generate random seed (1-999999) when creating new week menu
  - Store seed with weekly menu
  - Recipe query implementation:
    
    ```sql
    -- Add 20 random order columns to recipes table
    ALTER TABLE recipes 
      ADD COLUMN random_order_1 INTEGER,
      ADD COLUMN random_order_2 INTEGER,
      -- ... through random_order_20
    
    -- Query for fetching recipes:
    WITH recipe_count AS (
      SELECT COUNT(*) as total FROM recipes
    )
    SELECT * FROM recipes, recipe_count
    ORDER BY 
      CASE ($seed % 20)
        WHEN 0 THEN random_order_1
        WHEN 1 THEN random_order_2
        -- ... through 19
      END
    LIMIT 24 
    OFFSET (($seed * 7 + $page * 24) % total);
    ```
- Optimistic UI updates
- Debounced database saves when adding recipes

## Database Schema

```sql
-- Weekmenus table
CREATE TABLE weekmenus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  seed INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  recipes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_weekmenus_subscription ON weekmenus(subscription_id);

-- Recipe random ordering columns
ALTER TABLE recipes ADD COLUMN random_order_1 INTEGER;
ALTER TABLE recipes ADD COLUMN random_order_2 INTEGER;
-- ... through random_order_20
CREATE INDEX idx_recipes_random_order_1 ON recipes(random_order_1);
CREATE INDEX idx_recipes_random_order_2 ON recipes(random_order_2);
-- ... through random_order_20

-- Default servings per subscription
ALTER TABLE subscriptions ADD COLUMN default_servings INTEGER DEFAULT 4;
```

## Visual Design Details

### Recipe Cards
```
┌─────────────────────┬──────────┐
│                     │ • Onions │ Right column
│ [Recipe Image]      │ • Garlic │ ingredients
│                     │ • Tom... │ (truncated)
│                     │          │
├─────────────────────┼──────────┤
│ Recipe Title • 30m  │          │
│ 🍂 ⚡              │[Add to   │
│                     │ menu]    │
│                     │          │
└─────────────────────┴──────────┘
```

Selected state:
```
┌─────────────────────┬──────────┐
│                     │ • Onions │
│ [Recipe Image] ✓    │ • Garlic │ Green checkmark
│                     │ • Tom... │ overlay on image
│                     │          │
├─────────────────────┼──────────┤
│ Recipe Title • 30m  │ Servings │
│ 🍂 ⚡              │ [−] 4 [+]│
│                     │[Remove]  │
│                     │          │
└─────────────────────┴──────────┘
```

### Sidebar Badge (Collapsed State)
```
┌──────────────┐
│  5 recipes   │ Primary action color
│  Selected →  │ Fixed position, right edge
│              │ Subtle pulse on recipe add
└──────────────┘
```

### Expanded Sidebar
```
┌────────────────────────────────────┐
│                               [X] │
├────────────────────────────────────┤
│ Default servings: [−] 4 [+]        │
│ (Updates show undo toast)          │
├────────────────────────────────────┤
│ [img] Pasta Carbonara              │
│       [−] 4 [+]              [×]  │
│                                    │
│ [img] Greek Salad                  │
│       [−] 6 [+]              [×]  │
│                                    │
│ [img] Chicken Tikka                │
│       [−] 4 [+]              [×]  │
│                                    │
│ [img] Vegetable Soup               │
│       [−] 8 [+]              [×]  │
│                                    │
│ [img] Apple Pie                    │
│       [−] 4 [+]              [×]  │
├────────────────────────────────────┤
│ [Generate shopping list]           │
└────────────────────────────────────┘
```

Mobile (no thumbnails):
```
┌────────────────────────────────────┐
│                               [X] │
├────────────────────────────────────┤
│ Default servings: [−] 4 [+]        │
├────────────────────────────────────┤
│ Pasta Carbonara [−] 4 [+]    [×]  │
│ Greek Salad     [−] 6 [+]    [×]  │
│ Chicken Tikka   [−] 4 [+]    [×]  │
│ Vegetable Soup  [−] 8 [+]    [×]  │
│ Apple Pie       [−] 4 [+]    [×]  │
├────────────────────────────────────┤
│ [Generate shopping list]           │
└────────────────────────────────────┘
```

## Edge Cases & Error Handling

### 1. Network Issues
- Show offline indicator when database sync fails
- Retry sync when connection restored
- Display "Working offline" badge in UI

### 2. Recipe Limits
- Soft limit: Warning at 7 recipes ("That's a lot of cooking!")
- Hard limit: 28 recipes per week
- Clear messaging when limit reached

### 3. Empty States
- No recipes selected: Sidebar remains hidden
- No search results: "No recipes found. Try different filters."
- Loading state: Skeleton cards while fetching

### 4. Conflict Resolution
- If same subscription is working on multiple devices
- Last-write-wins with visual notification
- "Menu updated from another device" toast
- Uses Supabase Realtime for instant notifications
