import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthProvider'

export const ShoppingListPanel = () => {
  const navigate = useNavigate()
  const { userProfile, subscription } = useAuth()
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState([])
  const [stores, setStores] = useState([])
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (userProfile?.subscription_id) {
      fetchLists()
      fetchStores()
    }
  }, [userProfile])

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          store:stores(name, chain:store_chains(name, logo_url)),
          items:shopping_list_items(count)
        `)
        .eq('subscription_id', userProfile.subscription_id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4) // Get 4 to check if there are more than 3

      if (error) throw error
      setLists(data || [])
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, chain:store_chains(name)')
        .order('name')

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const handleCreateList = async () => {
    // Check if we need to show store selection
    if (!subscription?.default_store_id) {
      setShowStoreModal(true)
    } else {
      // Check if list exists for default store
      const existingList = lists.find(list => 
        list.store_id === subscription.default_store_id && list.is_active
      )
      
      if (existingList) {
        setShowStoreModal(true)
      } else {
        await createList(subscription.default_store_id)
      }
    }
  }

  const createList = async (storeId) => {
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          name: 'Shopping List',
          subscription_id: userProfile.subscription_id,
          store_id: storeId
        })
        .select()
        .single()

      if (error) throw error
      
      // Navigate to the new list
      navigate(`/shopping-list/${data.id}`)
    } catch (error) {
      console.error('Error creating list:', error)
      if (error.code === '23505') {
        alert('A shopping list for this store already exists')
        fetchLists()
      } else {
        alert('Failed to create shopping list')
      }
    } finally {
      setCreating(false)
      setShowStoreModal(false)
    }
  }


  if (loading) {
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

  const displayLists = lists.slice(0, 3)
  const hasMore = lists.length > 3

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
              className="relative group"
            >
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-all border-2 border-transparent hover:border-green-500 hover:shadow-md">
                <div className="mb-2 text-center">
                  {list.store?.chain?.logo_url ? (
                    <img 
                      src={list.store.chain.logo_url} 
                      alt={list.store.chain.name}
                      className="w-12 h-12 mx-auto object-contain"
                    />
                  ) : (
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {list.store?.name?.replace(list.store?.chain?.name + ' ', '') || list.store?.name || 'No store'}
                </p>
                <p className="text-xs text-gray-500">
                  {list.items?.[0]?.count || 0} items
                </p>
                {list.is_active && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            </button>
          ))}
          
          {/* Create new list button */}
          <button
            onClick={handleCreateList}
            className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-all border-2 border-dashed border-gray-300 hover:border-green-500 hover:shadow-md group"
          >
            <div className="text-4xl mb-2 text-center text-gray-400 group-hover:text-green-600">
              +
            </div>
            <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
              New List
            </p>
          </button>
          
          {/* More indicator */}
          {hasMore && (
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
              <span className="text-2xl text-gray-400">...</span>
            </div>
          )}
        </div>
      </div>

      {/* Store Selection Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Store</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              >
                <option value="">Select a store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStoreModal(false)
                  setSelectedStore('')
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedStore && createList(selectedStore)}
                disabled={!selectedStore || creating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}