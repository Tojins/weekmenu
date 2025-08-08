import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useWeekMenu } from '../contexts/WeekMenuContext'
import { useShoppingLists } from '../hooks/useShoppingLists'
import { useCreateShoppingListItems } from '../hooks/useShoppingListItems'
import { useCreateShoppingList } from '../hooks/useCreateShoppingList'
import { useRecipeIngredients } from '../hooks/useRecipeIngredients'
import { useStore } from '../hooks/useStores'
import { supabase } from '../supabaseClient'
import ProductSearchModal from './ProductSearchModal'
import { CachedImage } from './CachedImage'
import { useStores } from '../hooks/useStores'
import { ListSelectorModal } from './ListSelectorModal'
import { useRecipeIngredientOverrides, useSaveRecipeIngredientOverride } from '../hooks/useRecipeIngredientOverrides'

function IngredientRow({ ingredient, onProductChange }) {
  const [showSearch, setShowSearch] = useState(false)
  const saveOverride = useSaveRecipeIngredientOverride()

  const handleReplace = () => {
    setShowSearch(true)
  }

  const handleSelect = async (selection) => {
    // Update local state
    if (selection.custom) {
      onProductChange(ingredient.id, { customName: selection.name })
      // Save override to database
      await saveOverride.mutateAsync({
        recipeIngredientId: ingredient.id,
        customName: selection.name
      })
    } else {
      onProductChange(ingredient.id, { product: selection })
      // Save override to database
      await saveOverride.mutateAsync({
        recipeIngredientId: ingredient.id,
        productId: selection.id
      })
    }
    setShowSearch(false)
  }

  return (
    <>
      <div className="flex items-center gap-4 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
        {/* Fixed width for quantity info */}
        <div className="w-48 text-sm text-gray-700">
          {ingredient.quantity && (
            <>
              <span className="font-medium">{ingredient.quantity} {ingredient.unit || ''}</span>{' '}
            </>
          )}
          {ingredient.description}
        </div>
        
        {/* Product selection area */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {ingredient.product ? (
            <>
              <CachedImage 
                src={ingredient.product.image_url} 
                alt={ingredient.product.name}
                className="w-8 h-8 rounded object-cover"
                width={32}
                height={32}
              />
              <span className="text-sm text-gray-800">{ingredient.product.name}</span>
            </>
          ) : ingredient.customName ? (
            <span className="text-sm text-gray-600">Custom: {ingredient.customName}</span>
          ) : (
            <span className="text-sm text-gray-400 italic">No product selected</span>
          )}
          
          {/* Edit/Replace button */}
          <button
            onClick={handleReplace}
            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
            title="Replace product"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>
      
      <ProductSearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSelect}
        initialQuery={ingredient.description}
        title={`Search for: ${ingredient.quantity || ''} ${ingredient.unit || ''} ${ingredient.description}`}
      />
    </>
  )
}

export default function AddToShoppingList() {
  const navigate = useNavigate()
  const { user, subscription, loading: authLoading } = useAuth()
  
  console.log('[AddToShoppingList] Component render, subscription:', subscription?.subscription_id, 'authLoading:', authLoading)
  
  const { weekmenu, isLoading: weekmenuLoading } = useWeekMenu()
  const { lists, isLoading: listsLoading } = useShoppingLists()
  
  console.log('[AddToShoppingList] After hooks:', {
    subscription_id: subscription?.subscription_id,
    authLoading,
    listsLoading,
    listsCount: lists?.length || 0,
    lists: lists?.map(l => l.id)
  })
  
  const createItemsMutation = useCreateShoppingListItems()
  const createListMutation = useCreateShoppingList()
  
  const { recipes, ingredients: fetchedIngredients, isLoading } = useRecipeIngredients(weekmenu)
  const [ingredients, setIngredients] = useState([])
  const [selectedListId, setSelectedListId] = useState(null)
  const [showStoreSelector, setShowStoreSelector] = useState(false)
  const [showDefaultStorePrompt, setShowDefaultStorePrompt] = useState(false)
  
  // Load overrides for all recipe ingredients
  const recipeIngredientIds = useMemo(() => 
    fetchedIngredients.map(ing => ing.id),
    [fetchedIngredients]
  )
  const { overrides, isLoading: overridesLoading } = useRecipeIngredientOverrides(recipeIngredientIds)

  useEffect(() => {
    // Wait for weekmenu and auth to load before checking
    if (weekmenuLoading || authLoading) {
      return
    }
    
    // Only redirect if weekmenu is loaded and has no recipes
    if (!weekmenu?.recipes?.length) {
      navigate('/menu-selector')
      return
    }

    // Smart default selection logic
    if (lists && subscription) {
      if (subscription.default_store_id) {
        // Look for active list for default store
        const defaultStoreList = lists.find(l => 
          l.store_id === subscription.default_store_id && l.is_active
        )
        
        if (defaultStoreList) {
          setSelectedListId(defaultStoreList.id)
        } else {
          // No active list for default store, will create one when saving
          setSelectedListId(`new-${subscription.default_store_id}`)
        }
      } else {
        // No default store set, show prompt
        setShowDefaultStorePrompt(true)
      }
    }
  }, [weekmenuLoading, weekmenu?.recipes?.length, lists, subscription, navigate, authLoading])
  
  // Initialize ingredients from fetched data and apply overrides
  useEffect(() => {
    if (fetchedIngredients.length > 0) {
      // Apply overrides to the fetched ingredients
      const ingredientsWithOverrides = fetchedIngredients.map(ing => {
        const override = overrides[ing.id]
        if (override) {
          return {
            ...ing,
            product: override.product || null,
            customName: override.custom_name || null
          }
        }
        return ing
      })
      setIngredients(ingredientsWithOverrides)
    }
  }, [fetchedIngredients, overrides])


  // Group ingredients by recipe
  const groupedIngredients = useMemo(() => {
    return recipes.map(recipe => ({
      recipe: {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.image_url,
        servings: recipe.servings
      },
      ingredients: ingredients.filter(ing => ing.recipe_id === recipe.id)
    })).filter(group => group.ingredients.length > 0)
  }, [recipes, ingredients])

  const handleProductChange = (ingredientId, change) => {
    setIngredients(ingredients.map(ing => 
      ing.id === ingredientId 
        ? { ...ing, ...change, customName: change.customName || null, product: change.product || null }
        : ing
    ))
  }

  const handleSave = async () => {
    if (!selectedListId) {
      alert('Please select a shopping list')
      return
    }

    let listId = selectedListId
    
    // If it's a new list, create it first
    if (selectedListId.startsWith('new-')) {
      const storeId = selectedListId.replace('new-', '')
      try {
        const newList = await createListMutation.mutateAsync(storeId)
        listId = newList.id
        
        // If this was for the default store and user didn't have default store set, update it
        if (!subscription?.default_store_id && storeId) {
          await supabase
            .from('subscriptions')
            .update({ default_store_id: storeId })
            .eq('subscription_id', subscription.subscription_id)
        }
      } catch (error) {
        console.error('Error creating list:', error)
        alert('Failed to create shopping list')
        return
      }
    }

    const items = ingredients.map(ing => ({
      shopping_list_id: listId,
      product_id: ing.product?.id || null,
      custom_name: ing.customName || null,
      quantity: ing.quantity || 1,
      unit: ing.unit || 'st',
      is_checked: false
    }))

    createItemsMutation.mutate(
      { items },
      {
        onSuccess: () => {
          navigate(`/shopping-list/${listId}`)
        },
        onError: (error) => {
          console.error('Error adding items:', error)
          alert('Failed to add items to shopping list')
        }
      }
    )
  }

  const selectedList = selectedListId?.startsWith('new-') 
    ? null
    : lists?.find(l => l.id === selectedListId)
  
  const selectedStoreId = selectedListId?.startsWith('new-') 
    ? selectedListId.replace('new-', '')
    : selectedList?.store_id || subscription?.default_store_id
    
  const { data: selectedStore } = useStore(selectedStoreId)
  
  // Get store from list if available (includes chain data)
  const displayStore = selectedList?.store || selectedStore
  
  const itemCount = ingredients.filter(ing => ing.product || ing.customName).length

  if (isLoading || weekmenuLoading || authLoading || overridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/menu-selector')}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Menu Selector
        </button>
      </div>

      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
          Add to Shopping List
        </h1>
        
        {/* Store selector as sub-header */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Adding items to:</span>
          {displayStore?.chain?.logo_url && (
            <CachedImage 
              src={displayStore.chain.logo_url} 
              alt={displayStore.chain.name}
              className="w-5 h-5 object-contain"
              width={20}
              height={20}
            />
          )}
          <span className="font-medium text-gray-900">{displayStore?.name || 'Default store'} list</span>
          <button
            onClick={() => setShowStoreSelector(true)}
            className="ml-auto px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Change list
          </button>
        </div>
      </div>

      {/* Grouped Ingredients */}
      <div className="space-y-6">
        {groupedIngredients.map(({ recipe, ingredients }) => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-lg p-6">
            {/* Recipe Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <CachedImage 
                src={recipe.imageUrl || 'https://via.placeholder.com/48'} 
                alt={recipe.title}
                className="w-12 h-12 rounded-lg object-cover"
                width={48}
                height={48}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{recipe.title}</h3>
                <p className="text-sm text-gray-600">
                  {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'} • {recipe.servings} servings
                </p>
              </div>
            </div>
            
            {/* Ingredients for this recipe */}
            <div className="space-y-2">
              {ingredients.map(ingredient => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onProductChange={handleProductChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add to List Button */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Ready to add</p>
            <p className="text-lg font-medium text-gray-800">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} to your list
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={createItemsMutation.isPending || itemCount === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors shadow-md hover:shadow-lg"
          >
            {createItemsMutation.isPending ? 'Adding...' : 'Add to List'}
          </button>
        </div>
      </div>

      {/* Store Selector Modal */}
      {(showStoreSelector || showDefaultStorePrompt) && (
        <ListSelectorModal
          lists={lists || []}
          selectedListId={selectedListId}
          onSelectList={async (listIdOrStoreId) => {
            if (listIdOrStoreId.startsWith('new-')) {
              // New list for a store
              setSelectedListId(listIdOrStoreId)
              
              // If user didn't have default store, set it
              const storeId = listIdOrStoreId.replace('new-', '')
              if (!subscription?.default_store_id && showDefaultStorePrompt) {
                await supabase
                  .from('subscriptions')
                  .update({ default_store_id: storeId })
                  .eq('id', subscription.id)
              }
            } else {
              // Existing list
              setSelectedListId(listIdOrStoreId)
            }
            
            setShowStoreSelector(false)
            setShowDefaultStorePrompt(false)
          }}
          onClose={() => {
            setShowStoreSelector(false)
            setShowDefaultStorePrompt(false)
          }}
          promptText={showDefaultStorePrompt ? "Select your default store to continue" : null}
        />
      )}
    </>
  )
}