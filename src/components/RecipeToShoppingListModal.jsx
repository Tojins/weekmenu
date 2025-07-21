import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthProvider'
import { useNavigate } from 'react-router-dom'

export function RecipeToShoppingListModal({ recipes, onClose }) {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ingredients, setIngredients] = useState([])
  const [shoppingLists, setShoppingLists] = useState([])
  const [selectedListId, setSelectedListId] = useState('')
  const [createNewList, setCreateNewList] = useState(true)
  const [newListName, setNewListName] = useState('Recipe Shopping List')
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
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          *,
          recipe:recipes(title, default_servings),
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
        const servingRatio = recipe && ing.recipe ? recipe.servings / (ing.recipe.default_servings || 4) : 1
        
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

      // Fetch shopping lists
      const { data: listsData, error: listsError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('subscription_id', userProfile.subscription_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (listsError) throw listsError
      setShoppingLists(listsData || [])

      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .order('name')

      if (storesError) throw storesError
      setStores(storesData || [])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      let listId = selectedListId

      // Create new list if needed
      if (createNewList) {
        const { data: newList, error: listError } = await supabase
          .from('shopping_lists')
          .insert({
            name: newListName.trim(),
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

      // Add items to list
      if (itemsToAdd.length > 0) {
        const { error: itemsError } = await supabase
          .from('shopping_list_items')
          .insert(itemsToAdd)

        if (itemsError) throw itemsError
      }

      // Navigate to the shopping list
      navigate(`/shopping-list/${listId}`)
    } catch (error) {
      console.error('Error saving to shopping list:', error)
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
            <h3 className="font-semibold text-gray-800 mb-3">Select Shopping List</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={createNewList}
                  onChange={() => setCreateNewList(true)}
                  className="mr-2"
                />
                <span>Create new list</span>
              </label>
              
              {createNewList && (
                <div className="ml-6 space-y-3">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select store (optional)</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {shoppingLists.length > 0 && (
                <>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!createNewList}
                      onChange={() => {
                        setCreateNewList(false)
                        setSelectedListId(shoppingLists[0].id)
                      }}
                      className="mr-2"
                    />
                    <span>Add to existing list</span>
                  </label>
                  
                  {!createNewList && (
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {shoppingLists.map(list => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                      ))}
                    </select>
                  )}
                </>
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
            disabled={saving || (!createNewList && !selectedListId) || (createNewList && !newListName.trim())}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add to Shopping List'}
          </button>
        </div>
      </div>
    </div>
  )
}