// Query key constants to prevent typos
export const queryKeys = {
  shoppingLists: (subscriptionId) => ['shoppingLists', subscriptionId],
  shoppingList: (id) => ['shoppingList', id],
  shoppingListItems: (listId) => ['shoppingListItems', listId],
  recipes: (filters = {}) => ['recipes', filters],
  recipePreview: (seed) => ['recipes', 'preview', seed],
  recipesBySeed: (seed, page) => ['recipes', 'bySeed', seed, page],
  recipesByIds: (ids) => ['recipes', 'byIds', ids?.sort().join(',')],
  recipeIngredients: (recipeIds) => ['recipeIngredients', recipeIds?.sort().join(',')],
  product: (id) => ['product', id],
  stores: () => ['stores'],
  searchHistory: () => ['searchHistory'],
  urlCandidates: () => ['urlCandidates'],
}