import { useState, useEffect } from 'react'

const mockRecipes = [
  { id: '1', title: 'Pasta Carbonara', cookingTime: 30, ingredients: ['Pasta', 'Eggs', 'Bacon', 'Parmesan'], imageUrl: 'https://via.placeholder.com/300x200' },
  { id: '2', title: 'Greek Salad', cookingTime: 15, ingredients: ['Tomatoes', 'Cucumber', 'Feta', 'Olives', 'Onions'], imageUrl: 'https://via.placeholder.com/300x200' },
  { id: '3', title: 'Chicken Tikka', cookingTime: 45, ingredients: ['Chicken', 'Yogurt', 'Spices', 'Rice'], imageUrl: 'https://via.placeholder.com/300x200' },
  { id: '4', title: 'Vegetable Soup', cookingTime: 40, ingredients: ['Carrots', 'Celery', 'Onions', 'Potatoes', 'Broth'], imageUrl: 'https://via.placeholder.com/300x200' },
  { id: '5', title: 'Apple Pie', cookingTime: 60, ingredients: ['Apples', 'Flour', 'Butter', 'Sugar', 'Cinnamon'], imageUrl: 'https://via.placeholder.com/300x200' },
  { id: '6', title: 'Caesar Salad', cookingTime: 20, ingredients: ['Lettuce', 'Croutons', 'Parmesan', 'Caesar Dressing'], imageUrl: 'https://via.placeholder.com/300x200' }
]

export function MenuSelector() {
  const [selectedRecipes, setSelectedRecipes] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('weekmenu')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.recipes || []
      } catch (e) {
        return []
      }
    }
    return []
  })
  const [showSidebar, setShowSidebar] = useState(() => {
    // Show sidebar if we have saved recipes
    const saved = localStorage.getItem('weekmenu')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.recipes && parsed.recipes.length > 0
      } catch (e) {
        return false
      }
    }
    return false
  })
  const [defaultServings] = useState(4)
  const [seed] = useState(() => {
    // Generate or load seed
    const saved = localStorage.getItem('weekmenu')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.seed || Math.floor(Math.random() * 999999) + 1
      } catch (e) {
        return Math.floor(Math.random() * 999999) + 1
      }
    }
    return Math.floor(Math.random() * 999999) + 1
  })


  useEffect(() => {
    // Save to localStorage whenever selectedRecipes changes
    const weekmenu = {
      subscriptionId: 'mock-subscription-id', // Will come from auth context later
      seed: seed,
      version: 1,
      recipes: selectedRecipes,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem('weekmenu', JSON.stringify(weekmenu))
  }, [selectedRecipes, seed])

  const addRecipe = (recipeId) => {
    const recipe = mockRecipes.find(r => r.id === recipeId)
    if (recipe && !selectedRecipes.find(r => r.recipeId === recipeId)) {
      const newRecipe = { recipeId, servings: defaultServings }
      setSelectedRecipes([...selectedRecipes, newRecipe])
      
      // Show sidebar on first recipe
      if (selectedRecipes.length === 0) {
        setShowSidebar(true)
      }
    }
  }

  const removeRecipe = (recipeId) => {
    setSelectedRecipes(selectedRecipes.filter(r => r.recipeId !== recipeId))
  }

  const updateServings = (recipeId, servings) => {
    setSelectedRecipes(selectedRecipes.map(r => 
      r.recipeId === recipeId ? { ...r, servings } : r
    ))
  }

  const isRecipeSelected = (recipeId) => {
    return selectedRecipes.some(r => r.recipeId === recipeId)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main recipe browser */}
      <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${showSidebar && selectedRecipes.length > 0 ? 'mr-80' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Select Recipes for Your Week</h1>
          
          {/* Recipe grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRecipes.map(recipe => {
              const isSelected = isRecipeSelected(recipe.id)
              const selectedRecipe = selectedRecipes.find(r => r.recipeId === recipe.id)
              
              return (
                <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-48 object-cover" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{recipe.title}</h3>
                      <span className="text-sm text-gray-500">{recipe.cookingTime}m</span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        {recipe.ingredients.slice(0, 3).join(' • ')}
                        {recipe.ingredients.length > 3 && '...'}
                      </p>
                    </div>
                    
                    {!isSelected ? (
                      <button
                        onClick={() => addRecipe(recipe.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add to menu
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateServings(recipe.id, Math.max(1, selectedRecipe.servings - 1))}
                            className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{selectedRecipe.servings}</span>
                          <button
                            onClick={() => updateServings(recipe.id, selectedRecipe.servings + 1)}
                            className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeRecipe(recipe.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sidebar badge (collapsed state) */}
      {selectedRecipes.length > 0 && !showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white py-4 px-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <div className="text-sm font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            {selectedRecipes.length} recipes selected →
          </div>
        </button>
      )}

      {/* Sidebar (expanded) */}
      {showSidebar && selectedRecipes.length > 0 && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Selected Recipes ({selectedRecipes.length})</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {selectedRecipes.map(selected => {
                  const recipe = mockRecipes.find(r => r.id === selected.recipeId)
                  return (
                    <div key={selected.recipeId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{recipe.title}</h4>
                        <button
                          onClick={() => removeRecipe(selected.recipeId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateServings(selected.recipeId, Math.max(1, selected.servings - 1))}
                          className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100 bg-white"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium w-12 text-center">{selected.servings}</span>
                        <button
                          onClick={() => updateServings(selected.recipeId, selected.servings + 1)}
                          className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-100 bg-white"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-500">servings</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => {}}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate shopping list
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}