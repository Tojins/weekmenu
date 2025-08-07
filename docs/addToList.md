# Add to Shopping List UI Redesign

## Current State
The shopping list selection UI in the RecipeToShoppingListModal currently uses radio buttons and takes up significant space.

## Design Goal
Create a compact UI that assumes the default action (add to default store's list) while keeping alternatives accessible but not prominent.

## Selected Design: Smart Default with Inline Link

### Mockup
```
Adding to: Default Store list • [change]
```

### Expanded State (when "change" is clicked)
- Shows dropdown or small panel with:
  - Existing active lists
  - Option to create new list with store selection

### Implementation Notes
- Determine default based on:
  - If user has active list for default store → use that
  - If no active list for default store → create new list for default store
  - If no default store set → show modal for default store selection immediately
- The "change" link reveals alternatives without taking permanent UI space
- Keep the existing logic for stores with active lists being disabled

### Benefits
- Minimal space usage
- Clear communication of action
- Progressive disclosure
- Follows established UI patterns
- Optimizes for the common path

### Files to Modify or use
- `/src/components/RecipeToShoppingListModal.jsx` - Main implementation
- `/src/components/StoreSelector.jsx`