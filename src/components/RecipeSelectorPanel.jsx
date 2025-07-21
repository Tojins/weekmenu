import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useWeekMenu } from '../contexts/WeekMenuContext'

export const RecipeSelectorPanel = () => {
  const navigate = useNavigate()
  const { weekmenu } = useWeekMenu()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [weekmenu])

  const fetchRecipes = async () => {
    try {
      // Always fetch the first 4 recipes that would be shown in the recipe selector
      // using the same seed-based ordering as MenuSelector
      if (!weekmenu?.seed) {
        setLoading(false)
        return
      }

      // Calculate which random_order column to use based on seed
      const orderColumn = `random_order_${((weekmenu.seed - 1) % 20) + 1}`
      
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, image_url')
        .order(orderColumn)
        .limit(4)
      
      if (!error && data) {
        setRecipes(data)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = weekmenu?.recipes?.length || 0

  return (
    <button
      onClick={() => navigate('/menu-selector')}
      className="w-full bg-white rounded-lg shadow-lg p-8 transition-all hover:shadow-xl border-2 border-transparent hover:border-green-500 cursor-pointer text-left group"
    >
      <div className="flex gap-6">
        {/* Recipe Grid Preview */}
        <div className="flex-shrink-0">
          <div className="grid grid-cols-2 gap-1 w-52 h-52">
            {[0, 1, 2, 3].map((idx) => {
              const recipe = recipes[idx];
              return (
                <div key={idx} className="relative bg-gray-100 rounded overflow-hidden">
                  {loading ? (
                    <div className="w-full h-full animate-pulse bg-gray-200" />
                  ) : recipe ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              Recipe Selector
            </p>
            {selectedCount > 0 && (
              <p className="text-gray-600">
                {selectedCount} {selectedCount === 1 ? 'recipe' : 'recipes'} selected
              </p>
            )}
          </div>
          
          {/* Click indicator */}
          <div className="flex items-center text-sm text-gray-500 group-hover:text-green-600 transition-colors">
            <span>Click to browse recipes</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  )
}