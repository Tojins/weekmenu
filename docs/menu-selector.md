# Menu Selector Workflow Design

## Overview
The menu selector allows users to build a collection of recipes for their weekly menu. Users simply select recipes they want to make during the week, without worrying about specific days or meal times.

## Core Features

### 1. Weekly Menu View
- List of selected recipes for the current week
- Recipe count indicator (e.g., "5 recipes selected")
- Navigation: Previous/Next week, "This Week" button
- Week dates clearly visible (e.g., "Jan 6-12, 2025")

### 2. Recipe Selection Flow

#### Two-Panel Layout (Recommended)
1. **Left Panel**: Current week's selected recipes
   - List view with recipe cards
   - Remove button on each recipe
   - "Clear all" button at top
   - Empty state: "No recipes selected. Browse recipes to add to your menu."

2. **Right Panel**: Recipe browser
   - Search bar at top
   - Grid of available recipes with image, title, cooking time
   - "Add to menu" button on hover/tap
   - Visual indicator for already-selected recipes
   - Infinite scroll or pagination

3. **Selection Actions**:
   - Click "Add to menu" → Recipe appears in left panel
   - Click "Remove" → Recipe removed from week
   - Recipes can be added multiple times if desired

### 3. Recipe Display
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
- Single column layout on mobile
- Recipe browser as full-screen overlay
- Swipe to remove recipes
- Bottom tab navigation between menu and browser

## Implementation Phases

### Phase 1: MVP
- Two-panel layout (selected recipes + browser)
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