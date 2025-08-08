# Shopping List Filtering Bug - Analysis Report

## Bug Confirmed
Based on the user's screenshot, there IS a bug where "Colruyt Linkeroever" appears both as:
1. An existing shopping list (visible in the background)
2. An available option in the "Create New Shopping List" modal

## Root Cause Analysis

### The Problem
The filtering logic in `NewListModal` is correct:
```javascript
const activeStoreIds = new Set(
  shoppingLists?.filter(list => list.is_active && list.store_id)
    .map(list => list.store_id) || []
)
const availableStores = stores?.filter(store => !activeStoreIds.has(store.id)) || []
```

However, the bug likely occurs due to one of these issues:

1. **Data Inconsistency**: The `shoppingLists` passed to `NewListModal` might not include all active lists
2. **Race Condition**: The lists data might be stale when the modal opens
3. **Different Data Sources**: The home page and add-to-list page might be fetching different data

### Evidence
- User's screenshot clearly shows the bug
- Tests pass with clean data, suggesting the logic is correct
- The issue manifests in production with real data

## Recommended Fix

### Option 1: Ensure Fresh Data (Quick Fix)
Add query invalidation before showing the modal:

```javascript
// In AddToShoppingList.jsx, before showing modal
await queryClient.invalidateQueries(['shopping-lists'])
```

### Option 2: Use Same Data Source (Better Fix)
Ensure both pages use the exact same query and data:

```javascript
// In ListSelectorModal, refetch lists when modal opens
const { data: freshLists } = useQuery({
  queryKey: ['shopping-lists', subscription?.subscription_id],
  queryFn: () => fetchShoppingLists(subscription?.subscription_id),
  enabled: isOpen && !!subscription?.subscription_id,
  refetchOnMount: 'always'
})
```

### Option 3: Add Server-Side Validation (Best Fix)
Add a database constraint or API validation to prevent creating duplicate active lists for the same store.

## Test Improvements Needed

1. Tests need to use production-like data with multiple subscriptions
2. Tests should simulate the exact user flow: view lists on home → navigate to add-to-list → open modal
3. Add tests for race conditions and stale data scenarios

## Conclusion
The bug exists but wasn't caught by tests because:
- Tests use clean/empty database
- Tests don't simulate the production data scenario
- The bug might be intermittent based on data loading timing