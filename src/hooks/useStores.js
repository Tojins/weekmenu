import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../queries/keys'
import { fetchStores, fetchStoreById } from '../queries/stores'

export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores(),
    queryFn: fetchStores,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useStore(storeId) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: () => fetchStoreById(storeId),
    enabled: !!storeId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}