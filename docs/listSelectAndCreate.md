# List Selection and Creation Design Document

## Context Analysis

### ShoppingListPanel (Home Page)
**What user sees before clicking "New List":**
- All their existing shopping lists (up to 3 shown)
- Each list shows store name, logo, and item count

**Why they click "New List":**
- They want to create a list for a store that doesn't have one yet
- They already saw all existing lists - no need to show them again

### AddToShoppingList (Recipe Page)
**What user sees in the header:**
- "Adding items to: [Store Name] list"
- Shows exactly ONE target list (existing or to-be-created)

**Why they click "Change list":**
- They want to add ingredients to a different list
- Could be an existing list OR a new list for a different store

## The Real Difference

### ShoppingListPanel Modal
- **Purpose**: Create a new list only
- **Shows**: Only stores that DON'T have lists yet
- **Action**: Create list immediately and navigate

### AddToShoppingList Modal  
- **Purpose**: Change target list (existing or new)
- **Shows**: 
  - All existing lists (to switch between them)
  - Stores without lists (to plan new ones)
- **Action**: Just changes the selection, defers actual creation

## What's Actually Shared

The shared functionality is: **"Store selector for new list creation"**

Both modals need to:
1. Show stores that don't have active lists yet
2. Allow selecting a store for a new list
3. Display store logos and names consistently

## Proposed Architecture

### 1. NewListModal (Base Component)
```jsx
// Simple modal that shows stores without lists
// Can be used standalone OR embedded in other components
NewListModal({
  availableStores,    // Stores without active lists
  onSelectStore,      // Callback with storeId
  onClose,
  embedded: false     // When true, renders without modal wrapper
})

// Implementation detail:
function NewListModal({ availableStores, onSelectStore, onClose, embedded = false }) {
  const content = (
    <>
      {/* Store selection UI */}
    </>
  )
  
  if (embedded) {
    return content  // Just the content for embedding
  }
  
  return (
    <Modal onClose={onClose}>
      {content}     // Wrapped in modal for standalone use
    </Modal>
  )
}
```

### 2. ShoppingListPanel Usage
```jsx
// Uses NewListModal directly as a standalone modal
<NewListModal
  availableStores={storesWithoutLists}
  onSelectStore={(storeId) => {
    // Create list immediately
    // Navigate to new list
  }}
  onClose={handleClose}
  embedded={false}
/>
```

### 3. ListSelectorModal (AddToShoppingList)
```jsx
// Complex modal that embeds NewListModal as one option
ListSelectorModal({
  lists,              // Existing lists to choose from
  selectedListId,     // Currently selected
  availableStores,    // For new list option
  onSelectList,       // Callback for any selection
  onClose
})

// Inside ListSelectorModal:
{showNewListView ? (
  <NewListModal
    availableStores={availableStores}
    onSelectStore={(storeId) => onSelectList(`new-${storeId}`)}
    onClose={() => setShowNewListView(false)}
    embedded={true}    // Renders content only, no modal wrapper
  />
) : (
  // Show existing lists with "Create new list" button
)}
```

## Implementation Details

### ListSelectorModal Structure
```
┌─────────────────────────────────┐
│  Select Shopping List           │
├─────────────────────────────────┤
│  Existing Lists:                │
│  ○ Store A (5 items) [selected] │
│  ○ Store B (12 items)           │
│  ○ Store C (3 items)            │
│                                 │
│  ─────── OR ───────             │
│                                 │
│  [Create new list →]            │
└─────────────────────────────────┘

When "Create new list" is clicked:
┌─────────────────────────────────┐
│  [← Back] Select store          │
├─────────────────────────────────┤
│  Available stores:              │
│  • Store D                      │
│  • Store E                      │
│  • Store F                      │
└─────────────────────────────────┘
```

### NewListModal Structure (Standalone)
```
┌─────────────────────────────────┐
│  Create New Shopping List       │
├─────────────────────────────────┤
│  Select a store:                │
│  • Store D                      │
│  • Store E                      │
│  • Store F                      │
└─────────────────────────────────┘
```

## Key Insights

1. **ShoppingListPanel doesn't need to show existing lists in modal** - User just saw them
2. **AddToShoppingList needs both options** - Switch lists OR create new
3. **The shared part is smaller than we thought** - Just store selection for new lists
4. **NewListModal can be both standalone AND embedded** - Reusable in different contexts

## Benefits of This Approach

1. **Single source of truth** - NewListModal handles all new list creation UI
2. **Flexible usage** - Works standalone or as part of a larger flow
3. **Consistent UX** - Same store selection experience everywhere
4. **Clear separation** - Each modal has a focused purpose
5. **Maintainable** - Changes to new list creation only need updates in one place