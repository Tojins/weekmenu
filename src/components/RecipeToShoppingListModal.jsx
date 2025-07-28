import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthProvider'
import { useNavigate } from 'react-router-dom'
import { StoreSelector } from './StoreSelector'

export function RecipeToShoppingListModal({ recipes, onClose }) {
  const navigate = useNavigate()
  const { userProfile, subscription } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ingredients, setIngredients] = useState([])
  const [shoppingLists, setShoppingLists] = useState([])
  const [selectedListId, setSelectedListId] = useState('')
  const [createNewList, setCreateNewList] = useState(true)
  const [selectedStore, setSelectedStore] = useState('')
  const [stores, setStores] = useState([])

  useEffect(() => {
    fetchInitialData()
  }, [recipes])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // Fetch all recipe ingredients
      const recipeIds = recipes.map(r => r.recipeId)
      console.log('Fetching ingredients for recipes:', recipeIds)
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          *,
          recipe:recipes(title),
          product:products(
            *,
            store_category:store_categories(category_name)
          )
        `)
        .in('recipe_id', recipeIds)
        .order('ingredient_order')

      if (ingredientsError) throw ingredientsError
      

      // Group and process ingredients
      const processedIngredients = ingredientsData.map(ing => {
        const recipe = recipes.find(r => r.recipeId === ing.recipe_id)
        const servingRatio = recipe ? recipe.servings / 4 : 1  // Default to 4 servings
        
        return {
          id: ing.id,
          recipeId: ing.recipe_id,
          recipeTitle: ing.recipe?.title,
          description: ing.description,
          dutchDescription: ing.dutch_description,
          quantity: ing.quantity ? ing.quantity * servingRatio : null,
          unit: ing.unit,
          productId: ing.product_id,
          product: ing.product,
          searchQuery: '',
          searchResults: [],
          customName: ''
        }
      })

      setIngredients(processedIngredients)

      // Fetch shopping lists with store information
      const { data: listsData, error: listsError } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          store:stores(name)
        `)
        .eq('subscription_id', userProfile.subscription_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (listsError) throw listsError
      setShoppingLists(listsData || [])
      
      // Default to existing list if available
      if (listsData && listsData.length > 0) {
        setCreateNewList(false)
        setSelectedListId(listsData[0].id)
      } else {
        // No existing lists, must create new
        setCreateNewList(true)
        // Set default store if available
        if (subscription?.default_store_id) {
          setSelectedStore(subscription.default_store_id)
        }
      }

      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .order('name')

      if (storesError) throw storesError
      
      // Get active shopping lists to mark stores that already have lists
      const { data: activeListsData, error: activeListsError } = await supabase
        .from('shopping_lists')
        .select('store_id')
        .eq('subscription_id', userProfile.subscription_id)
        .eq('is_active', true)

      if (activeListsError) throw activeListsError

      // Mark stores that have active lists
      const activeStoreIds = new Set(activeListsData?.map(list => list.store_id) || [])
      const storesWithStatus = storesData?.map(store => ({
        ...store,
        hasActiveList: activeStoreIds.has(store.id)
      })) || []

      setStores(storesWithStatus)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async (ingredientId, query) => {
    if (!query.trim()) return

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, store_category:store_categories(category_name)')
        .ilike('name', `%${query}%`)
        .limit(5)

      if (error) throw error

      setIngredients(ingredients.map(ing => 
        ing.id === ingredientId 
          ? { ...ing, searchResults: data || [], searchQuery: query }
          : ing
      ))
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }

  const selectProduct = (ingredientId, product) => {
    setIngredients(ingredients.map(ing => 
      ing.id === ingredientId 
        ? { ...ing, productId: product.id, product, searchResults: [], searchQuery: '' }
        : ing
    ))
  }

  const removeProduct = (ingredientId) => {
    setIngredients(ingredients.map(ing => 
      ing.id === ingredientId 
        ? { ...ing, productId: null, product: null, customName: '' }
        : ing
    ))
  }

  const setCustomItem = (ingredientId, customName) => {
    setIngredients(ingredients.map(ing => 
      ing.id === ingredientId 
        ? { ...ing, customName, productId: null, product: null }
        : ing
    ))
  }

  const mergeDuplicateItems = (items) => {
    const mergedMap = new Map()
    
    items.forEach(item => {
      // Create a key that includes unit to match the database constraint
      // This allows same product with different units (e.g., "2 lemons" vs "100g lemon juice")
      const unit = item.unit || ''
      const key = item.product_id 
        ? `product_${item.product_id}_${unit}`
        : `custom_${item.custom_name}_${unit}`
      
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key)
        
        // Only merge if units are exactly the same
        // This respects the unique constraint and avoids inaccurate conversions
        if (existing.unit === item.unit) {
          existing.quantity += item.quantity
          // Remove recipe_id when merging - we don't need to track which recipe it came from
          delete existing.recipe_id
        }
      } else {
        // First occurrence - clone the item without product_name
        const { product_name, ...itemWithoutName } = item
        mergedMap.set(key, { ...itemWithoutName })
      }
    })
    
    return Array.from(mergedMap.values())
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let listId = selectedListId

      // Create new list if needed
      if (createNewList) {
        // If no default store is set and a store is selected, set it as default
        if (!subscription?.default_store_id && selectedStore) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ default_store_id: selectedStore })
            .eq('id', subscription.id)
          
          if (updateError) {
            console.error('Error setting default store:', updateError)
          }
        }

        const { data: newList, error: listError } = await supabase
          .from('shopping_lists')
          .insert({
            subscription_id: userProfile.subscription_id,
            store_id: selectedStore || null
          })
          .select()
          .single()

        if (listError) throw listError
        listId = newList.id
      }

      // Prepare items to add
      const itemsToAdd = ingredients
        .filter(ing => ing.productId || ing.customName)
        .map(ing => {
          const baseItem = {
            shopping_list_id: listId,
            quantity: ing.quantity || 1,
            unit: ing.unit,
            recipe_id: ing.recipeId
          }

          if (ing.productId) {
            return {
              ...baseItem,
              product_id: ing.productId,
              product_name: ing.product?.name || '', // Store product name for merging
              display_order: 999 // Default order - store_categories doesn't have display_order
            }
          } else {
            return {
              ...baseItem,
              custom_name: ing.customName,
              display_order: 999
            }
          }
        })

      // Merge duplicates before adding
      const mergedItems = mergeDuplicateItems(itemsToAdd)

      // Check if we're adding to an existing list
      if (!createNewList && selectedListId) {
        // Fetch existing items from the list
        const { data: existingItems, error: fetchError } = await supabase
          .from('shopping_list_items')
          .select('*')
          .eq('shopping_list_id', selectedListId)

        if (fetchError) throw fetchError

        // Merge new items with existing items
        const allItems = [...(existingItems || []), ...mergedItems]
        const finalMergedItems = mergeDuplicateItems(allItems)

        // Delete all existing items
        if (existingItems && existingItems.length > 0) {
          const { error: deleteError } = await supabase
            .from('shopping_list_items')
            .delete()
            .eq('shopping_list_id', selectedListId)

          if (deleteError) throw deleteError
        }

        // Insert all merged items
        if (finalMergedItems.length > 0) {
          const itemsWithListId = finalMergedItems.map(item => ({
            ...item,
            shopping_list_id: selectedListId
          }))
          
          const { error: insertError } = await supabase
            .from('shopping_list_items')
            .insert(itemsWithListId)

          if (insertError) throw insertError
        }
      } else {
        // Creating new list - just add the merged items
        if (mergedItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('shopping_list_items')
            .insert(mergedItems)

          if (itemsError) throw itemsError
        }
      }

      // Navigate to the shopping list
      navigate(`/shopping-list/${listId}`)
    } catch (error) {
      console.error('Error saving to shopping list:', error)
      
      // Handle duplicate key error - use existing list instead
      if (error.code === '23505' && error.message?.includes('unique_active_shopping_list')) {
        
        // Find the existing active list for this store
        const existingList = shoppingLists.find(list => 
          list.store_id === selectedStore && list.is_active
        )
        
        if (existingList) {
          navigate(`/shopping-list/${existingList.id}`)
          return
        }
      }
      
      alert('Failed to add items to shopping list')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Add Recipes to Shopping List</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* List Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {shoppingLists.length > 0 && (
                <>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!createNewList}
                      onChange={() => {
                        setCreateNewList(false)
                        if (shoppingLists.length > 0 && !selectedListId) {
                          setSelectedListId(shoppingLists[0].id)
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="font-medium">Add to existing shopping list</span>
                  </label>
                  
                  {!createNewList && (
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {shoppingLists.map(list => (
                        <option key={list.id} value={list.id}>
                          {list.store?.name || 'Shopping List'} - {new Date(list.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
              
              <label className={`flex items-center ${shoppingLists.length === 0 ? 'text-gray-800' : ''}`}>
                <input
                  type="radio"
                  checked={createNewList}
                  onChange={() => setCreateNewList(true)}
                  className="mr-2"
                  disabled={shoppingLists.length === 0}
                />
                <span className="font-medium">Create new shopping list</span>
              </label>
              
              {createNewList && (
                <div className="ml-6">
                  <StoreSelector
                    stores={stores}
                    selectedStore={selectedStore}
                    onChange={setSelectedStore}
                    showActiveListWarning={true}
                    autoFocus={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Review Ingredients</h3>
            {ingredients.map(ing => (
              <div key={ing.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {ing.quantity && `${ing.quantity} ${ing.unit || ''}`} {ing.description}
                    </p>
                    <p className="text-sm text-gray-600">from {ing.recipeTitle}</p>
                  </div>
                </div>

                {ing.product ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded mt-2">
                    <div>
                      <p className="font-medium text-green-800">{ing.product.name}</p>
                      <p className="text-sm text-green-600">
                        {ing.product.quantity} {ing.product.unit} - €{ing.product.unit_price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeProduct(ing.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : ing.customName ? (
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded mt-2">
                    <p className="font-medium text-blue-800">Custom: {ing.customName}</p>
                    <button
                      onClick={() => setCustomItem(ing.id, '')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={ing.searchQuery}
                        onChange={(e) => {
                          setIngredients(ingredients.map(i => 
                            i.id === ing.id ? { ...i, searchQuery: e.target.value } : i
                          ))
                          if (e.target.value.length > 2) {
                            searchProducts(ing.id, e.target.value)
                          }
                        }}
                        placeholder="Search products..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setCustomItem(ing.id, ing.description)}
                        className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Custom
                      </button>
                    </div>
                    
                    {ing.searchResults.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {ing.searchResults.map(product => (
                          <button
                            key={product.id}
                            onClick={() => selectProduct(ing.id, product)}
                            className="w-full p-2 hover:bg-gray-50 text-left border-b last:border-b-0"
                          >
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {product.quantity} {product.unit} - €{product.unit_price}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!createNewList && !selectedListId)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add to Shopping List'}
          </button>
        </div>
      </div>
    </div>
  )
}