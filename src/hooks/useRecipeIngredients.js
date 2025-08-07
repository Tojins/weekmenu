import { useQuery, useQueries } from '@tanstack/react-query'
import { queryKeys } from '../queries/keys'
import { 
  fetchRecipesByIds, 
  fetchRecipeIngredientsWithProducts,
  fetchProductById 
} from '../queries/recipeIngredients'
import { useMemo } from 'react'

export function useRecipeIngredients(weekmenu) {
  const recipeIds = weekmenu?.recipes?.map(r => r.recipeId) || []
  
  // Fetch recipes data
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: queryKeys.recipesByIds(recipeIds),
    queryFn: () => fetchRecipesByIds(recipeIds),
    enabled: recipeIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4, now gcTime in v5)
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })
  
  // Fetch ingredients with their matched products
  const { data: ingredientsData = [], isLoading: ingredientsLoading } = useQuery({
    queryKey: queryKeys.recipeIngredients(recipeIds),
    queryFn: () => fetchRecipeIngredientsWithProducts(recipeIds),
    enabled: recipeIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4, now gcTime in v5)
    refetchOnMount: false, // Don't refetch if data exists in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })
  
  // Process the data
  const processedData = useMemo(() => {
    if (!recipes.length || !ingredientsData.length || !weekmenu?.recipes) {
      return { recipes: [], ingredients: [] }
    }
    
    // Create recipes with servings from weekmenu
    const recipesWithServings = recipes.map(recipe => {
      const weekmenuRecipe = weekmenu.recipes.find(r => r.recipeId === recipe.id)
      return {
        ...recipe,
        recipe_id: recipe.id,
        servings: weekmenuRecipe?.servings || 4,
        default_servings: recipe.default_servings || 4
      }
    })
    
    // Process ingredients with scaling
    const processedIngredients = ingredientsData.map(ing => {
      const recipe = recipesWithServings.find(r => r.recipe_id === ing.recipe_id)
      if (!recipe) return null
      
      const scaledQuantity = ing.quantity 
        ? (ing.quantity * recipe.servings / recipe.default_servings) 
        : null
      
      return {
        id: ing.id,
        recipe_id: ing.recipe_id,
        description: ing.dutch_description || ing.description,
        quantity: scaledQuantity,
        unit: ing.unit,
        product: ing.product || null,
        customName: null,
        recipeTitle: recipe.title
      }
    }).filter(Boolean)
    
    return {
      recipes: recipesWithServings,
      ingredients: processedIngredients
    }
  }, [recipes, ingredientsData, weekmenu])
  
  return {
    recipes: processedData.recipes,
    ingredients: processedData.ingredients,
    isLoading: recipesLoading || ingredientsLoading
  }
}