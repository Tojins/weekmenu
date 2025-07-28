import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../queries/keys'
import { fetchShoppingLists, createShoppingList } from '../queries/shoppingLists'
import { StoreSelectorModal } from './StoreSelectorModal'

export const ShoppingListPanel = () => {
  const navigate = useNavigate()
  const { user, userProfile, subscription } = useAuth()
  const queryClient = useQueryClient()
  
  // Fetch shopping lists
  const { data: shoppingLists = [], isLoading } = useQuery({
    queryKey: queryKeys.shoppingLists(userProfile?.subscription_id),
    queryFn: () => fetchShoppingLists(userProfile?.subscription_id),
    enabled: !!userProfile?.subscription_id,
  })
  
  // Create shopping list mutation
  const createMutation = useMutation({
    mutationFn: (storeId) => createShoppingList({ 
      subscriptionId: userProfile.subscription_id, 
      storeId 
    }),
    onSuccess: (newList) => {
      // Add the new list to the cache
      queryClient.setQueryData(
        queryKeys.shoppingLists(userProfile?.subscription_id),
        (old = []) => [newList, ...old]
      )
    },
  })
  
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState('')
  const [allStores, setAllStores] = useState([])

  // Extract active store IDs from shopping lists
  const activeStoreIds = new Set(
    shoppingLists
      .filter(list => list.is_active && list.store_id)
      .map(list => list.store_id)
  )

  // Only fetch all stores when store modal is opened
  const fetchAllStores = async () => {
    try {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('id, name, chain:store_chains(name)')
        .order('name')

      if (error) throw error

      // Mark stores that have active lists
      const storesWithStatus = storesData?.map(store => ({
        ...store,
        hasActiveList: activeStoreIds.has(store.id)
      })) || []

      setAllStores(storesWithStatus)
    } catch (error) {
      console.error('Error fetching all stores:', error)
    }
  }

  const handleOpenStoreModal = () => {
    setShowStoreModal(true)
    // Fetch all stores only when modal opens
    if (allStores.length === 0) {
      fetchAllStores()
    }
  }

  const handleCreateList = async () => {
    console.log('handleCreateList called, subscription:', subscription)
    
    // Check if we have subscription data
    if (!subscription) {
      console.error('No subscription data available')
      alert('Unable to create shopping list. Please try refreshing the page.')
      return
    }
    
    // Check if we need to show store selection
    if (!subscription.default_store_id) {
      handleOpenStoreModal()
    } else {
      // Check if list exists for default store
      const existingList = shoppingLists.find(list => 
        list.store_id === subscription.default_store_id && list.is_active
      )
      
      if (existingList) {
        handleOpenStoreModal()
      } else {
        await createList(subscription.default_store_id)
      }
    }
  }

  const createList = async (storeId) => {
    try {
      // If no default store is set and a store is selected, set it as default
      if (!subscription?.default_store_id && storeId) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ default_store_id: storeId })
          .eq('id', subscription.id)
        
        if (updateError) {
          console.error('Error setting default store:', updateError)
        }
      }

      // Create the shopping list using the mutation
      createMutation.mutate(storeId, {
        onSuccess: (data) => {
          // Navigate to the new list
          navigate(`/shopping-list/${data.id}`)
          setShowStoreModal(false)
        },
        onError: (error) => {
          console.error('Error creating list:', error)
          if (error.code === '23505') {
            alert('A shopping list for this store already exists')
          } else {
            alert('Failed to create shopping list')
          }
        }
      })
    } catch (error) {
      console.error('Error in createList:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const displayLists = shoppingLists.slice(0, 3)
  const hasMore = shoppingLists.length > 3

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-transparent">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Shopping Lists</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayLists.map((list) => (
            <button
              key={list.id}
              onClick={() => navigate(`/shopping-list/${list.id}`)}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                list.is_active 
                  ? 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-lg' 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              {list.is_active && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
              <div className="flex items-center space-x-3">
                {list.store?.chain?.logo_url ? (
                  <img 
                    src={list.store.chain.logo_url} 
                    alt={list.store.chain.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {list.store?.name || 'No store'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {list.items?.[0]?.count || 0} items
                  </p>
                </div>
              </div>
            </button>
          ))}

          <button
            onClick={handleCreateList}
            disabled={createMutation.isLoading}
            className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-gray-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">New List</span>
          </button>
        </div>

        {hasMore && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">And {shoppingLists.length - 3} more...</p>
          </div>
        )}
      </div>

      {showStoreModal && (
        <StoreSelectorModal
          stores={allStores}
          selectedStore={selectedStore}
          onSelectStore={setSelectedStore}
          onConfirm={() => createList(selectedStore)}
          onCancel={() => {
            setShowStoreModal(false)
          }}
          creating={createMutation.isLoading}
        />
      )}
    </>
  )
}