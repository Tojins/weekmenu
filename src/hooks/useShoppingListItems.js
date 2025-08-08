import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { queryKeys } from '../queries/keys'
import { useAuth } from '../components/AuthProvider'

export function useCreateShoppingListItems() {
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()

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
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists(userProfile?.subscription_id) })
      if (data.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.shoppingList(data[0].shopping_list_id) 
        })
      }
    }
  })
}