import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ProductSearch({ 
  onSelect, 
  searchQuery,
  setSearchQuery,
  placeholder = "Search products...",
  showCustomOption = true
}) {
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchProducts()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const searchProducts = async () => {
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, store_category:store_categories(category_name)')
        .ilike('name', `%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching products:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {showCustomOption && searchQuery.trim() && (
        <button
          onClick={() => onSelect({ custom: true, name: searchQuery.trim() })}
          className="mt-3 w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
        >
          Add as custom item: "{searchQuery.trim()}"
        </button>
      )}

      {searching ? (
        <div className="mt-4 text-center py-8 text-gray-500">Searching...</div>
      ) : searchResults.length > 0 ? (
        <div className="mt-4 space-y-2">
          {searchResults.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-left"
            >
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">
                  {product.quantity} {product.unit}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))}
        </div>
      ) : searchQuery.trim() ? (
        <div className="mt-4 text-center py-8 text-gray-500">No products found</div>
      ) : null}
    </>
  )
}