// Query key constants to prevent typos
export const queryKeys = {
  shoppingLists: (subscriptionId) => ['shoppingLists', subscriptionId],
  shoppingList: (id) => ['shoppingList', id],
  shoppingListItems: (listId) => ['shoppingListItems', listId],
  recipes: (filters = {}) => ['recipes', filters],
  recipePreview: (seed) => ['recipes', 'preview', seed],
  stores: () => ['stores'],
  searchHistory: () => ['searchHistory'],
  urlCandidates: () => ['urlCandidates'],
}