# Convert Products to Shopping List - Full Screen Flow

## Design Goals
- Reduce vertical space usage by 70%
- Add product thumbnails for visual recognition
- Remove redundant information (prices, duplicate weights)
- Replace modal-in-modal with full-screen flow
- Share product search functionality (DRY principle)

## Flow Design

### Route Structure
- `/weekmenu/add-to-list` - Full screen ingredient review
- Back button returns to `/weekmenu/menu-selector`
- Direct navigation to shopping list after completion

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back   Adding recipes to Beveren shopping list • Change       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 360g broccoli          │ [🥦] Broccoli 1st 500g      [🔄]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 150g champignons       │ [🍄] EVERYDAY champignons  [🔄]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1 st ui                │ No product selected        [+]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ basilicum              │ Custom: basilicum          [✗]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                                            [ Add to List (4) ] │
└─────────────────────────────────────────────────────────────────┘
```

### Product Search Modal

When user clicks [🔄] or [+], a modal opens over the full-screen page:

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back   Adding recipes to Beveren shopping list • Change       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 360g broccoli          │ [🥦] Broccoli 1st 500g      [🔄]   │ │
│ └───────────────────────────────────────────────────[DIMMED]───┘ │
│                                                                  │
│     ┌───────────────────────────────────────────────────┐       │
│     │ Search for: 1 st ui                          [X] │       │
│     ├───────────────────────────────────────────────────┤       │
│     │ 🔍 [ui_____________________] [Custom]            │       │
│     │                                                   │       │
│     │ [🧅] Rode uien                              [+]  │       │
│     │      1 kg                                        │       │
│     │                                                   │       │
│     │ [🧅] Witte uien                             [+]  │       │
│     │      1 kg                                        │       │
│     │                                                   │       │
│     │ [🧅] Sjalotten                              [+]  │       │
│     │      250g                                        │       │
│     │                                                   │       │
│     │ View more results...                             │       │
│     └───────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Structure

### IngredientRow Component
- Displays ingredient quantity and Dutch description on the left
- Shows selected product with thumbnail on the right
- Compact single-row layout (~60px height)
- Left column fixed width based on max content (~300px for up to 45 characters)
- Right column takes remaining space

### ProductSelector Component
States:
- **Product selected**: Shows thumbnail, product name, and replace button (🔄)
- **Custom item**: Shows "Custom: [name]" with replace button (🔄)

All ingredients start with either an AI-suggested product or custom item. The replace button (🔄) opens ProductSearchModal. Closing the modal without selection keeps the current product unchanged.

### ProductSearchModal Component
Shared component extracted from ShoppingListDetail that handles product search and selection.

## Implementation Notes

1. **State Management**
   - Pass to new route when "Generate shopping list" clicked
   - Clear state after successful addition

2. **Product Display**
   - Show thumbnail (40x40px) when available
   - Product name (no price, single weight display)

3. **Actions**
   - Replace (🔄): Opens product search modal

4. **Navigation**
   - Back button (top-left): Return to recipe selector
   - Add to List: Process and navigate to shopping list

5. **Modal Behavior**
   - Opens centered over the full-screen page
   - Background dimmed/blurred
   - Closes on selection or X button
   - Pre-fills search with ingredient name

6. **Responsive Design**
   - Mobile: Stack ingredient and product vertically
   - Desktop: Keep horizontal layout

## Benefits
- 70% less vertical space per ingredient
- No modal-in-modal confusion
- Visual product recognition
- Cleaner, more focused interface
- Better mobile experience
- Shared code for product search