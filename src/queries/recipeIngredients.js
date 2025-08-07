import { supabase } from '../supabaseClient'

// Fetch recipes by IDs
export const fetchRecipesByIds = async (recipeIds) => {
  if (!recipeIds || recipeIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds)
  
  if (error) throw error
  return data || []
}

// Fetch recipe ingredients with products
export const fetchRecipeIngredientsWithProducts = async (recipeIds) => {
  if (!recipeIds || recipeIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select(`
      *,
      product:products(*)
    `)
    .in('recipe_id', recipeIds)
  
  if (error) throw error
  return data || []
}

// Fetch individual product by ID
export const fetchProductById = async (productId) => {
  if (!productId) return null
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // Ignore "not found" errors
  return data
}