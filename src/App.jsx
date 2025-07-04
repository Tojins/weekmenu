import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHelloWorld()
  }, [])

  async function fetchHelloWorld() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('hello_world')
        .select('message')
        .single()
      
      if (error) throw error
      setMessage(data?.message || 'No message found')
    } catch (error) {
      console.error('Error fetching message:', error)
      setMessage('Error loading message from Supabase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Weekmenu</h1>
        
        <div className="text-center">
          {loading ? (
            <p className="text-gray-500 animate-pulse">Loading...</p>
          ) : (
            <p className="text-xl text-gray-700">{message}</p>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Powered by Supabase + GitHub Pages</p>
        </div>
      </div>
    </div>
  )
}

export default App