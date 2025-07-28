import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function Settings() {
  const navigate = useNavigate()
  const { user, userProfile, signOut, subscription } = useAuth()
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    if (subscription?.default_store_id) {
      setSelectedStoreId(subscription.default_store_id)
    }
  }, [subscription])

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, chain:store_chains(name)')
        .order('name')

      if (error) throw error
      setStores(data || [])
    } catch (err) {
      console.error('Error fetching stores:', err)
      setError('Failed to load stores')
    }
  }

  const handleDefaultStoreChange = async (e) => {
    const newStoreId = e.target.value
    setSelectedStoreId(newStoreId)
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (!subscription?.id) {
      setError('No subscription found')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ default_store_id: newStoreId || null })
        .eq('id', subscription.id)

      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error updating default store:', err)
      setError('Failed to update default store')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back to Home button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {userProfile?.full_name || 'No name set'}
            </p>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Default Store Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Store</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Select your preferred store for new shopping lists
        </p>

        <select
          value={selectedStoreId}
          onChange={handleDefaultStoreChange}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No default store</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.chain?.name} - {store.name}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        
        {success && (
          <p className="mt-2 text-sm text-green-600">Default store updated successfully</p>
        )}
      </div>

      {/* Account Actions Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  )
}