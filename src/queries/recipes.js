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
  console.log('[fetchRecipePreview] Called with seed:', seed)
  if (!seed) return []
  
  const orderColumn = `random_order_${((seed - 1) % 20) + 1}`
  
  console.log('[fetchRecipePreview] Starting query...')
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, title, image_url')
      .order(orderColumn)
      .limit(4)
    
    const elapsed = Date.now() - startTime
    console.log(`[fetchRecipePreview] Query completed in ${elapsed}ms, got ${data?.length || 0} recipes`)
    
    if (error) {
      console.error('[fetchRecipePreview] Query error:', error)
      throw error
    }
    
    return data || []
  } catch (e) {
    console.error('[fetchRecipePreview] Exception:', e)
    throw e
  }
}

// Fetch recipes with seed-based ordering and pagination
export const fetchRecipesBySeed = async ({ seed, page = 0, pageSize = 24 }) => {
  console.log('[fetchRecipesBySeed] Called with seed:', seed, 'page:', page)
  if (!seed) return { recipes: [], hasMore: false, totalCount: 0 }
  
  const orderColumn = `random_order_${((seed - 1) % 20) + 1}`
  
  try {
    // Get total count if first page
    let totalCount = 0
    if (page === 0) {
      const { count } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
      totalCount = count || 0
    }
    
    // Fetch recipes
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        time_estimation,
        image_url,
        url,
        cooking_instructions
      `)
      .order(orderColumn, { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    
    if (error) {
      console.error('[fetchRecipesBySeed] Query error:', error)
      throw error
    }
    
    const formattedRecipes = (data || []).map(recipe => {
      // Check for seasonal keywords in title
      const seasonalKeywords = ['pompoen', 'spruitjes', 'witloof', 'pastinaak', 'pompoene'];
      const isSeasonalRecipe = seasonalKeywords.some(keyword => 
        recipe.title.toLowerCase().includes(keyword)
      );
      
      return {
        id: recipe.id,
        title: recipe.title,
        cookingTime: recipe.time_estimation || 30,
        category: 'main',
        seasonal: isSeasonalRecipe,
        imageUrl: recipe.image_url || 'https://via.placeholder.com/300x200',
        url: recipe.url,
        cooking_instructions: recipe.cooking_instructions
      };
    })
    
    return {
      recipes: formattedRecipes,
      hasMore: data?.length === pageSize,
      totalCount
    }
  } catch (e) {
    console.error('[fetchRecipesBySeed] Exception:', e)
    throw e
  }
}