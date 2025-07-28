import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../queries/keys'
import { updateShoppingList } from '../queries/shoppingLists'

export const ShoppingListDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const queryClient = useQueryClient()
  const searchInputRef = useRef(null)
  
  // Update shopping list mutation
  const updateListMutation = useMutation({
    mutationFn: updateShoppingList,
    onSuccess: (updatedList) => {
      // Update the list in the cache
      queryClient.setQueryData(
        queryKeys.shoppingLists(userProfile?.subscription_id),
        (old = []) => old.map(list => list.id === updatedList.id ? updatedList : list)
      )
    },
  })
  
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [showCustomItemForm, setShowCustomItemForm] = useState(false)

  useEffect(() => {
    fetchListData()
  }, [id])


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchProducts()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const fetchListData = async () => {
    console.log('Fetching list data...');
    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('*, store:stores(name, chain:store_chains(name, logo_url))')
        .eq('id', id)
        .single()

      if (listError) throw listError
      setList(listData)

      // Fetch list items with product details and store category
      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          products:product_id(
            *,
            store_categories:store_category_id(category_name)
          ),
          recipe_id(*)
        `)
        .eq('shopping_list_id', id)
        .order('display_order', { ascending: true })

      if (itemsError) throw itemsError
      
      // Sort items: unchecked first, then by display_order
      const sortedItems = (itemsData || []).sort((a, b) => {
        if (a.is_checked !== b.is_checked) {
          return a.is_checked ? 1 : -1
        }
        return (a.display_order || 0) - (b.display_order || 0)
      })
      
      setItems(sortedItems)
    } catch (error) {
      console.error('Error fetching list data:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async () => {
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, store_category:store_categories(category_name)')
        .ilike('name', `%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      
      // Check which products are already in the list
      const existingProductIds = items
        .filter(item => item.product_id)
        .map(item => item.product_id)
      
      const resultsWithStatus = data.map(product => ({
        ...product,
        isInList: existingProductIds.includes(product.id),
        existingItem: items.find(item => item.product_id === product.id)
      }))
      
      setSearchResults(resultsWithStatus)
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setSearching(false)
    }
  }

  const addProductToList = async (product, quantity = 1, unit = null) => {
    try {
      const productUnit = unit || product.unit || 'st'
      
      // Check if this product with this unit already exists in the list
      const existingItem = items.find(item => 
        item.product_id === product.id && 
        (item.unit || 'st') === productUnit
      )
      
      if (existingItem) {
        // Update quantity instead of adding duplicate
        const newQuantity = existingItem.quantity + quantity
        await updateItemQuantity(existingItem.id, newQuantity, productUnit)
        setSearchQuery('')
        setSearchResults([])
        return
      }
      
      // Get display order from store_ordering if available
      let displayOrder = 999 // Default order - store_categories doesn't have display_order
      
      if (list.store_id && product.store_category_id) {
        const { data: orderData } = await supabase
          .from('store_ordering')
          .select('display_order')
          .eq('store_id', list.store_id)
          .eq('store_category_id', product.store_category_id)
          .single()
        
        if (orderData) {
          displayOrder = orderData.display_order
        }
      }

      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          shopping_list_id: id,
          product_id: product.id,
          quantity,
          unit: productUnit,
          display_order: displayOrder
        })
        .select(`
          *,
          product:products(
            *,
            store_category:store_categories(category_name)
          )
        `)
        .single()

      if (error) throw error
      
      setItems([...items, data])
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product to list')
    }
  }

  const updateItemQuantity = async (itemId, quantity, unit) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ quantity, unit })
        .eq('id', itemId)

      if (error) throw error
      
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity, unit } : item
      ))
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const toggleItemChecked = async (itemId, isChecked) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: isChecked })
        .eq('id', itemId)

      if (error) throw error
      
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, is_checked: isChecked } : item
      ).sort((a, b) => {
        if (a.is_checked !== b.is_checked) {
          return a.is_checked ? 1 : -1
        }
        return (a.display_order || 0) - (b.display_order || 0)
      })
      
      setItems(updatedItems)
      
      // Check if all items are checked and the list has items
      if (updatedItems.length > 0 && updatedItems.every(item => item.is_checked)) {
        // Mark the list as complete
        try {
          const { error } = await supabase
            .from('shopping_lists')
            .update({ 
              is_active: false,
              completed_at: new Date().toISOString()
            })
            .eq('id', id)
          
          if (error) throw error
          
          // Update local state to reflect completion
          setList(prev => ({ ...prev, is_active: false, completed_at: new Date().toISOString() }))
          
          // Update the list using the mutation
          updateListMutation.mutate({
            id,
            updates: { is_active: false, completed_at: new Date().toISOString() }
          })
        } catch (listError) {
          console.error('Error auto-completing list:', listError)
        }
      }
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const removeItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      
      setItems(items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const addCustomItem = async () => {
    if (!customItemName.trim()) return

    try {
      // Check if this custom item already exists in the list
      const existingItem = items.find(item => 
        item.custom_name === customItemName.trim()
      )
      
      if (existingItem) {
        // Update quantity instead of adding duplicate
        await updateItemQuantity(existingItem.id, existingItem.quantity + 1, existingItem.unit)
        setCustomItemName('')
        setShowCustomItemForm(false)
        return
      }
      
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          shopping_list_id: id,
          custom_name: customItemName.trim(),
          quantity: 1,
          display_order: 999
        })
        .select()
        .single()

      if (error) throw error
      
      setItems([...items, data])
      setCustomItemName('')
      setShowCustomItemForm(false)
    } catch (error) {
      console.error('Error adding custom item:', error)
      alert('Failed to add custom item')
    }
  }


  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-800 flex items-center mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              {list?.store?.chain?.logo_url && (
                <img 
                  src={list.store.chain.logo_url} 
                  alt={list.store.chain.name}
                  className="w-8 h-8 mr-3 object-contain"
                />
              )}
              {list?.store ? (
                list.store.name?.replace(list.store.chain?.name + ' ', '') || list.store.name
              ) : (
                'Shopping List'
              )}
            </h1>
          </div>
          <div className="text-base sm:text-lg font-medium text-gray-700">
            {items.length > 0 && items.every(item => item.is_checked) ? (
              <span className="text-green-600">All items checked! ✓</span>
            ) : (
              <span>{items.filter(item => !item.is_checked).length} of {items.length} remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-lg"
          />
          <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="p-3 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.quantity} {product.unit} - €{product.unit_price}
                    </p>
                  </div>
                  
                  {product.isInList ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={product.existingItem?.quantity || 1}
                        onChange={(e) => updateItemQuantity(
                          product.existingItem.id,
                          parseFloat(e.target.value) || 1,
                          product.existingItem.unit
                        )}
                        className="w-16 px-2 py-1 border border-gray-300 rounded"
                        min="0.1"
                        step="0.1"
                      />
                      {product.isweightarticle && (
                        <select
                          value={product.existingItem?.unit || product.unit}
                          onChange={(e) => updateItemQuantity(
                            product.existingItem.id,
                            product.existingItem.quantity,
                            e.target.value
                          )}
                          className="px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="st">st</option>
                        </select>
                      )}
                      <span className="text-green-600 text-sm">In list</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => addProductToList(product)}
                      className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Item Button */}
        <button
          onClick={() => setShowCustomItemForm(true)}
          className="mt-3 text-blue-600 hover:text-blue-700 text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add custom item
        </button>

        {/* Custom Item Form */}
        {showCustomItemForm && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Enter item name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                onClick={addCustomItem}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowCustomItemForm(false)
                  setCustomItemName('')
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shopping List Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            data-testid="shopping-list-item"
            className={`bg-white rounded-lg shadow p-4 transition-all ${
              item.is_checked ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => toggleItemChecked(item.id, !item.is_checked)}
                className="flex-shrink-0 p-1"
              >
                <div className={`w-8 h-8 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center ${
                  item.is_checked
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300 hover:border-green-600'
                }`}>
                  {item.is_checked && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <p data-testid="product-name" className={`font-medium text-gray-800 text-base sm:text-base truncate ${
                  item.is_checked ? 'line-through' : ''
                }`}>
                  {item.products ? item.products.name : item.custom_name}
                </p>
                {item.products && (
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {item.products.store_categories?.category_name}
                    {item.recipe_id && ` • From ${item.recipe_id.name}`}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(
                    item.id,
                    parseFloat(e.target.value) || 1,
                    item.unit
                  )}
                  className="w-14 sm:w-16 px-1 sm:px-2 py-1 border border-gray-300 rounded text-center text-sm sm:text-base"
                  min="0.1"
                  step="0.1"
                />
                
                {item.products?.isweightarticle ? (
                  <select
                    data-testid="unit"
                    value={item.unit}
                    onChange={(e) => updateItemQuantity(
                      item.id,
                      item.quantity,
                      e.target.value
                    )}
                    className="px-1 sm:px-2 py-1 border border-gray-300 rounded text-sm sm:text-base"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="st">st</option>
                  </select>
                ) : (
                  <span data-testid="unit" className="text-gray-600 text-xs sm:text-sm w-8 sm:w-12 text-center">
                    {item.unit || 'st'}
                  </span>
                )}

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-1 sm:p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your list is empty</h2>
          <p className="text-gray-600">Start adding items using the search bar above</p>
        </div>
      )}
    </div>
  )
}