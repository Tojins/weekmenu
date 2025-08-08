import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useAuth } from '../components/AuthProvider'

export function useRecipeIngredientOverrides(recipeIngredientIds = []) {
  const { subscription } = useAuth()
  
  const { data: overrides, isLoading } = useQuery({
    queryKey: ['recipe-ingredient-overrides', subscription?.id, recipeIngredientIds],
    queryFn: async () => {
      if (!subscription?.id || recipeIngredientIds.length === 0) return {}
      
      const { data, error } = await supabase
        .from('recipe_ingredient_overrides')
        .select(`
          id,
          recipe_ingredient_id,
          product_id,
          custom_name,
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('subscription_id', subscription.id)
        .in('recipe_ingredient_id', recipeIngredientIds)
      
      if (error) throw error
      
      // Convert to a map for easy lookup by recipe_ingredient_id
      return data.reduce((acc, override) => {
        acc[override.recipe_ingredient_id] = override
        return acc
      }, {})
    },
    enabled: !!subscription?.id && recipeIngredientIds.length > 0
  })
  
  return { overrides: overrides || {}, isLoading }
}

export function useSaveRecipeIngredientOverride() {
  const queryClient = useQueryClient()
  const { subscription } = useAuth()
  
  return useMutation({
    mutationFn: async ({ recipeIngredientId, productId, customName }) => {
      if (!subscription?.id) {
        throw new Error('No subscription found')
      }
      
      // First check if an override already exists
      const { data: existing } = await supabase
        .from('recipe_ingredient_overrides')
        .select('id')
        .eq('recipe_ingredient_id', recipeIngredientId)
        .eq('subscription_id', subscription.id)
        .single()
      
      if (existing) {
        // Update existing override
        const { data, error } = await supabase
          .from('recipe_ingredient_overrides')
          .update({
            product_id: productId || null,
            custom_name: customName || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) throw error
        return data
      } else {
        // Create new override
        const { data, error } = await supabase
          .from('recipe_ingredient_overrides')
          .insert({
            recipe_ingredient_id: recipeIngredientId,
            subscription_id: subscription.id,
            product_id: productId || null,
            custom_name: customName || null
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['recipe-ingredient-overrides'] })
    }
  })
}