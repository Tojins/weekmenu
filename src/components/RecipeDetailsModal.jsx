import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { RecipeControls } from './RecipeControls'

export function RecipeDetailsModal({ 
  recipe, 
  isSelected,
  selectedRecipe,
  onClose, 
  onAdd, 
  onRemove, 
  onUpdateServings 
}) {
  const [ingredients, setIngredients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (recipe?.id) {
      fetchIngredients()
    }
  }, [recipe?.id])

  const fetchIngredients = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .select(`
          quantity,
          unit,
          dutch_description,
          products (
            id,
            name
          )
        `)
        .eq('recipe_id', recipe.id)
        .order('ingredient_order')

      if (error) {
        console.error('Error fetching ingredients:', error)
        return
      }

      setIngredients(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!recipe) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      data-testid="recipe-modal-backdrop"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        data-testid="recipe-modal"
      >
        {/* Header with close button */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
            data-testid="modal-close"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Recipe image */}
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="w-full h-64 sm:h-80 object-cover"
          />
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-4 left-4 bg-green-500 text-white rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Seasonal badge */}
          {recipe.seasonal && (
            <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-3 py-1 rounded text-sm font-medium">
              🍂 Seasonal
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{recipe.title}</h2>
            <span className="text-lg text-gray-500 flex-shrink-0 ml-4">{recipe.cookingTime}m</span>
          </div>

          {/* Recipe link */}
          {recipe.url && (
            <div className="mb-6">
              <a 
                href={recipe.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="mr-2">View original recipe</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Ingredients section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingrediënten</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : ingredients.length > 0 ? (
              <ul className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></span>
                    <span>
                      {ingredient.quantity > 0 && `${ingredient.quantity} `}
                      {ingredient.unit && `${ingredient.unit} `}
                      {ingredient.dutch_description || ingredient.products?.name || 'Unknown ingredient'}
                      {ingredient.dutch_description && ingredient.products?.name && (
                        <span className="text-gray-500 text-sm ml-2">({ingredient.products.name})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No ingredients available</p>
            )}
          </div>

          {/* Cooking instructions section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bereidingswijze</h3>
            {recipe.cooking_instructions ? (
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {recipe.cooking_instructions}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Geen bereidingswijze beschikbaar</p>
            )}
          </div>
        </div>

        {/* Footer with controls */}
        <div className="border-t p-6">
          <RecipeControls
            recipe={recipe}
            isSelected={isSelected}
            selectedRecipe={selectedRecipe}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdateServings={onUpdateServings}
            size="large"
          />
        </div>
      </div>
    </div>
  )
}