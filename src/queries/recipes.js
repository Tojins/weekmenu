import { supabase } from '../supabaseClient'

// Fetch recipes with filters
export const fetchRecipes = async ({ limit = 100, orderColumn = 'created_at', orderOptions = { ascending: false } }) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order(orderColumn, orderOptions)
    .limit(limit)
  
  if (error) throw error
  return data || []
}

// Fetch recipe preview (4 recipes with seed-based ordering)
export const fetchRecipePreview = async (seed) => {
  if (!seed) return []
  
  const orderColumn = `random_order_${((seed - 1) % 20) + 1}`
  
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, image_url')
    .order(orderColumn)
    .limit(4)
  
  if (error) throw error
  return data || []
}