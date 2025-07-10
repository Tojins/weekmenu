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
   - Search bar at top
   - Filter buttons (cooking time, ingredients, seasonal)
   - Grid of recipe cards with image, title, cooking time
   - "Add to menu" button on each card
   - Visual indicator for already-selected recipes
   - Infinite scroll or pagination

2. **Right Sidebar**: Selected recipes (collapsible)
   - Initially hidden
   - Slides in from right when first recipe is selected
   - Shows badge with recipe count (e.g., "5")
   - Can be toggled open/closed
   - Contains:
     - Week dates header
     - List of selected recipes
     - Remove button on each recipe
     - "Clear all" button
     - "Generate shopping list" button at bottom

3. **Selection Actions**:
   - Click "Add to menu" → Recipe added, sidebar appears/updates
   - Recipe cards show "Added ✓" state
   - Click "Added ✓" → Removes from menu
   - Sidebar can be minimized to just show count badge

### 4. Recipe Display
- Card view: Recipe image, title, cooking time
- Hover: Show quick actions (remove, view details)
- Click title: Open recipe details in modal

## Data Persistence Strategy

### Hybrid Approach (Recommended)
```javascript
// Local-first with database sync
- Immediate saves to localStorage for responsiveness
- Debounced sync to database (every 5 seconds of inactivity)
- Conflict resolution: last-write-wins with timestamps
```

### Benefits:
- **Instant feedback** - No loading states for user actions
- **Offline capable** - Works without internet
- **Multi-device sync** - When online, syncs across devices
- **Resilient** - Database outages don't break the app

### Data Structure:
```javascript
{
  weekMenus: {
    "2025-01-06": { // Week starting date (Monday)
      userId: "uuid",
      recipes: [
        { recipeId: "uuid", addedAt: "timestamp" },
        { recipeId: "uuid", addedAt: "timestamp" },
        { recipeId: "uuid", addedAt: "timestamp" }
      ],
      updatedAt: "timestamp"
    }
  }
}
```

## User Experience Optimizations

### 1. Quick Actions
- **Copy last week**: Button to duplicate previous week's menu
- **Clear all**: Remove all recipes from current week
- **Generate shopping list**: Create list from selected recipes
- **Adjust servings**: Change serving count per recipe

### 2. Smart Suggestions
- Recently used recipes appear first
- Seasonal recipes highlighted
- "Haven't made in a while" section
- Filter by cooking time or ingredients

### 3. Visual Feedback
- Recipe count badge updates instantly
- Subtle animation when adding/removing recipes
- "Already in menu" indicator on recipe cards
- Offline mode indicator

### 4. Mobile Considerations
- Full-width recipe grid (2 columns)
- Selected recipes sidebar as bottom sheet
- Swipe up to view selected recipes
- Floating badge shows recipe count when sidebar closed
- Tap badge to open sidebar

## Implementation Phases

### Phase 1: MVP
- Full-screen recipe browser
- Collapsible sidebar for selected recipes
- Add/remove recipes functionality
- localStorage persistence only
- Current week only

### Phase 2: Enhanced
- Previous/next week navigation
- Database sync with offline support
- Copy previous week feature
- Generate shopping list

### Phase 3: Advanced
- Recipe usage history
- Smart suggestions based on seasonality
- Serving size adjustments
- Export/share weekly menu

## Technical Considerations

### State Management
```javascript
// React Context for menu state
const WeekMenuContext = {
  currentWeek: Date,
  selectedRecipes: Recipe[],
  isLoading: boolean,
  isSyncing: boolean,
  addRecipe: (recipeId) => void,
  removeRecipe: (recipeId) => void,
  copyPreviousWeek: () => void,
  clearAll: () => void
}
```

### Performance
- Lazy load recipe images
- Virtual scrolling for recipe list
- Optimistic UI updates
- Debounced database saves

### Accessibility
- Keyboard navigation through week grid
- Screen reader announcements for actions
- High contrast mode support
- Focus management in modals

## Database Schema

```sql
-- Weekly menus table
CREATE TABLE weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  recipes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Index for efficient queries
CREATE INDEX idx_weekly_menus_user_week ON weekly_menus(user_id, week_start);
```

## Success Metrics
- Time to plan a week < 5 minutes
- Less than 3 clicks to add a recipe
- Zero data loss from offline/online transitions
- Mobile usage at least 40% of total