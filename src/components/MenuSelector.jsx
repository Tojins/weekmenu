import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeekMenu } from '../contexts/WeekMenuContext'
import { useAuth } from './AuthProvider'
import { RecipeControls } from './RecipeControls'
import { RecipeDetailsModal } from './RecipeDetailsModal'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../queries/keys'
import { fetchRecipesBySeed, fetchRecipePreview } from '../queries/recipes'

export function MenuSelector() {
  const navigate = useNavigate()
  const { weekmenu, isLoading: menuLoading, isSyncing, isOffline, addRecipe, removeRecipe, updateServings } = useWeekMenu()
  const { subscription } = useAuth()
  const queryClient = useQueryClient()
  const [showSidebar, setShowSidebar] = useState(false)
  const [hasAutoShownSidebar, setHasAutoShownSidebar] = useState(false)
  const [showSyncToast, setShowSyncToast] = useState(false)
  const [selectedModalRecipe, setSelectedModalRecipe] = useState(null)
  const observerRef = useRef()
  const toastTimeoutRef = useRef()

  const recipesPerPage = 24

  // Use infinite query for paginated recipe loading
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingRecipes,
  } = useInfiniteQuery({
    queryKey: queryKeys.recipesBySeed(weekmenu?.seed, 'infinite'),
    queryFn: ({ pageParam = 0 }) => {
      console.log('[MenuSelector] Fetching recipes page:', pageParam)
      return fetchRecipesBySeed({ 
        seed: weekmenu?.seed, 
        page: pageParam, 
        pageSize: recipesPerPage 
      })
    },
    enabled: !!weekmenu?.seed,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length
      }
      return undefined
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  // Flatten all pages of recipes
  const recipes = data?.pages.flatMap(page => page.recipes) || []
  const totalRecipes = data?.pages[0]?.totalCount || 0

  // Infinite scroll observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0]
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, options)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Set up observer on last recipe
  useEffect(() => {
    if (isFetchingNextPage) return

    if (observerRef.current) {
      const recipeElements = document.querySelectorAll('.recipe-card')
      if (recipeElements.length > 0) {
        // Disconnect from all elements first
        recipeElements.forEach(el => observerRef.current.unobserve(el))
        // Observe only the last element
        const lastElement = recipeElements[recipeElements.length - 1]
        observerRef.current.observe(lastElement)
      }
    }
  }, [recipes, isFetchingNextPage])

  // Show sidebar only the very first time a recipe is selected
  useEffect(() => {
    if (weekmenu?.recipes?.length > 0 && !hasAutoShownSidebar) {
      setShowSidebar(true)
      setHasAutoShownSidebar(true)
    }
  }, [weekmenu?.recipes?.length, hasAutoShownSidebar])

  // Manage sync toast with minimum display time
  useEffect(() => {
    if (isSyncing) {
      setShowSyncToast(true)
      // Clear any existing timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    } else if (showSyncToast) {
      // Keep showing for at least 1 second after sync completes
      toastTimeoutRef.current = setTimeout(() => {
        setShowSyncToast(false)
      }, 1000)
    }

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [isSyncing, showSyncToast])

  const isRecipeSelected = (recipeId) => {
    return weekmenu?.recipes?.some(r => r.recipeId === recipeId) || false
  }

  const getSelectedRecipe = (recipeId) => {
    return weekmenu?.recipes?.find(r => r.recipeId === recipeId)
  }

  const handleAddRecipe = (recipeId) => {
    addRecipe(recipeId, subscription?.default_servings || 4)
    // Close the modal after adding recipe
    setSelectedModalRecipe(null)
  }

  const handleUpdateServings = (recipeId, delta) => {
    const selected = getSelectedRecipe(recipeId)
    if (selected) {
      const newServings = Math.max(1, selected.servings + delta)
      updateServings(recipeId, newServings)
    }
  }

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading recipes</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Main recipe browser */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 xl:p-8 transition-all duration-300 ${showSidebar && weekmenu?.recipes?.length > 0 ? 'lg:mr-80' : ''}`}>
        <div className="w-full mx-auto">
          {/* Back to Home button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>

          <div className="flex justify-end items-center mb-4">
            <div className="flex items-center space-x-4">
              {isOffline && (
                <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full" data-testid="offline-indicator">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                  Working offline
                </div>
              )}
            </div>
          </div>
          
          {/* Recipe grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 min-[1400px]:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {recipes.map((recipe, index) => {
              const isSelected = isRecipeSelected(recipe.id)
              const selectedRecipe = getSelectedRecipe(recipe.id)
              const isLastRecipe = index === recipes.length - 1
              
              return (
                <div 
                  key={recipe.id} 
                  className={`recipe-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${isLastRecipe ? 'last-recipe' : ''}`}
                  data-testid="recipe-card"
                  onClick={() => setSelectedModalRecipe(recipe)}
                >
                  <div className="relative">
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 sm:h-72 lg:h-80 xl:h-96 object-cover" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {recipe.seasonal && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        🍂 Seasonal
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 lg:p-6 xl:p-7">
                    <div className="flex justify-between items-start mb-3 lg:mb-4">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 pr-2">{recipe.title}</h3>
                      <span className="text-sm sm:text-base lg:text-lg text-gray-500 flex-shrink-0">{recipe.cookingTime}m</span>
                    </div>
                    
                    <RecipeControls
                      recipe={recipe}
                      isSelected={isSelected}
                      selectedRecipe={selectedRecipe}
                      onAdd={handleAddRecipe}
                      onRemove={removeRecipe}
                      onUpdateServings={handleUpdateServings}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Loading indicator for infinite scroll */}
          {isFetchingNextPage && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {/* No more recipes */}
          {!hasNextPage && recipes.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">You've reached the end of our recipes!</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar badge (collapsed state) */}
      {weekmenu?.recipes?.length > 0 && !showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white py-3 px-3 rounded-l-lg shadow-lg hover:bg-blue-700 hover:px-4 transition-all group"
          data-testid="sidebar-toggle-collapsed"
          title="Show selected recipes"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 transform rotate-180 group-hover:translate-x-[-4px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold">{weekmenu.recipes.length}</span>
              <span className="text-xs">recipes</span>
            </div>
          </div>
        </button>
      )}

      {/* Mobile backdrop */}
      {showSidebar && weekmenu?.recipes?.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar (expanded) */}
      {showSidebar && weekmenu?.recipes?.length > 0 && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-96 lg:w-80 bg-white shadow-xl transform transition-transform duration-300 z-40">
          <div className="h-full flex flex-col">
            <div className="relative">
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-10"
                data-testid="sidebar-close"
                title="Minimize sidebar"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
              
              <div className="p-4 pt-16 border-b">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Default servings:</span>
                  <button
                    onClick={() => {/* TODO: Update default servings */}}
                    className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="font-medium w-8 text-center">{subscription?.default_servings || 4}</span>
                  <button
                    onClick={() => {/* TODO: Update default servings */}}
                    className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {weekmenu.recipes.map(selected => {
                  const recipe = recipes.find(r => r.id === selected.recipeId)
                  if (!recipe) return null
                  
                  return (
                    <div key={selected.recipeId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <img 
                          src={recipe.imageUrl} 
                          alt={recipe.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 truncate pr-2">{recipe.title}</h4>
                            <button
                              onClick={() => removeRecipe(selected.recipeId)}
                              className="text-red-600 hover:text-red-700 flex-shrink-0"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateServings(selected.recipeId, -1)}
                              className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100 bg-white"
                            >
                              −
                            </button>
                            <span className="text-sm font-medium w-12 text-center">{selected.servings}</span>
                            <button
                              onClick={() => handleUpdateServings(selected.recipeId, 1)}
                              className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100 bg-white"
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-500">servings</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  if (!weekmenu?.recipes?.length) {
                    alert('No recipes selected')
                    return
                  }
                  navigate('/add-to-list')
                }}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate shopping list
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync toast notification */}
      <div 
        className={`fixed bottom-4 left-4 bg-gray-600 text-gray-100 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm transition-all duration-300 ${
          showSyncToast ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        data-testid="sync-indicator"
      >
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Saving changes...</span>
      </div>

      {/* Recipe Details Modal */}
      {selectedModalRecipe && (
        <RecipeDetailsModal
          recipe={selectedModalRecipe}
          isSelected={isRecipeSelected(selectedModalRecipe.id)}
          selectedRecipe={getSelectedRecipe(selectedModalRecipe.id)}
          onClose={() => setSelectedModalRecipe(null)}
          onAdd={handleAddRecipe}
          onRemove={removeRecipe}
          onUpdateServings={handleUpdateServings}
        />
      )}


    </div>
  )
}