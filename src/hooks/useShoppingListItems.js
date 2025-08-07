import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'

export function useCreateShoppingListItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ items }) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert(items)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate shopping list queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
      if (data.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['shopping-list', data[0].shopping_list_id] 
        })
      }
    }
  })
}