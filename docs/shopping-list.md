# Shopping List Feature Specification

## Overview

The shopping list feature provides users with a comprehensive digital shopping experience. Users can create, manage, and use shopping lists for grocery shopping, with smart organization, and efficient shopping workflows.

## CORE FUNCTIONALITY (MVP)

- **Create/Delete Lists**: Simple list creation
- **Product Search**: Basic search from product database
- **Quantity & Units**: Specify amounts for items. Unit selection (g/st) only for products with isweightarticle=true, otherwise just quantity input
- **Duplicate Prevention**: Product search results show quantity & unit inputs if a product is already in the list (they do not show add)
- **Check Off Items**: unchecked items at the top and checked items at the bottom and a little bit greyed
- **Basic Organization**: Sort items by store categories
- **Custom Items**: Add items not in database (stored with product_id=null and custom_name)
- **Mobile-Optimized**: Large touch targets for in-store use
- **Category Grouping**: Items organized by store layout (display_order captured at time of adding)
- **Persistence**: Lists saved to database

## 3. Import from Weekmenu
- **Recipe Import**: Add ingredients from selected recipes
- **Import validation**: Validation screen to allow correction of product matching
- **Source Attribution**: Track which items came from recipes



## OPTIONAL FEATURES (Phase 2)

### 1. Enhanced Search & Suggestions
- **Auto-complete**: Type-ahead search with fuzzy matching
- **Recent Items**: Quick access to recently purchased items

### 2. Advanced Organization
- **Store Selection**: Choose different store after list creation


### 4. Better UX Features
- **Swipe Actions**: Quick delete with swipe gestures
- **Archive Lists**: Keep completed lists for reference
- **Templates**: Save common lists as templates

## NICE-TO-HAVE FEATURES (Phase 3+)

### 1. Collaboration & Sharing
- **Shared Lists**: Multiple users edit same list
- **Real-time Sync**: Live updates when shopping together

### 3. Personalization
- **Favorites System**: Star frequently purchased items
- **Brand Preferences**: Remember if A brands or store brands are prefered

### 4. Advanced Data Features
- **Alternative Products**: Suggest substitutions
- **Recipe Reverse Lookup**: Find recipes using list items

## Technical Notes

### Core Implementation Focus
- Normalized database structure (separate shopping_list_items table)
- Mobile-first responsive design
- Offline capability with sync
- Optimistic UI updates
- Category organization using store_ordering table

### Product Quantity & Unit Handling
- Products with `isweightarticle = true`: Show unit selector (g/kg or st)
- Products with `isweightarticle = false`: Only show quantity input (unit is fixed from product record)
- Example: Carrots (isweightarticle=true) → user can choose 500g or 3st
- Example: Cheese packet 150g (isweightarticle=false) → user can only specify quantity (e.g., 2 packets)

### Key User Flows (MVP)
1. **Create List**: Name → Select store → Add items → Save
2. **Add Items**: Search → Select → Add → Specify quantity (and unit if isweightarticle)
3. **Shopping**: View list → Check items → Complete
4. **Manage**: Edit quantities → Remove items → Delete list

