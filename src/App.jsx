import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Initialize app data here
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Weekmenu</h1>
        
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto">
          {loading ? (
            <p className="text-gray-500 animate-pulse text-center">Loading...</p>
          ) : (
            <div className="text-center text-gray-600">
              <p>Welcome to Weekmenu</p>
              <p className="text-sm mt-2">Your weekly meal planning app</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App