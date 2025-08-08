import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useAuth } from '../components/AuthProvider'
import { queryKeys } from '../queries/keys'

export function useCreateShoppingList() {
  const { userProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (storeId) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          store_id: storeId,
          subscription_id: userProfile.subscription_id,
          is_active: true
        })
        .select('*, store:stores(name, chain:store_chains(name, logo_url))')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate shopping lists query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists(userProfile?.subscription_id) })
    }
  })
}