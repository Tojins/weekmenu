import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../components/AuthProvider'
import { fetchShoppingLists } from '../queries/shoppingLists'

export function useShoppingLists() {
  const { subscription } = useAuth()

  const { data: lists, isLoading, error } = useQuery({
    queryKey: ['shopping-lists', subscription?.subscription_id],
    queryFn: () => fetchShoppingLists(subscription?.subscription_id),
    enabled: !!subscription?.subscription_id,
  })

  return {
    lists,
    isLoading,
    error
  }
}