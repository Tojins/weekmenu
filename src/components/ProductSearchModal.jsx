import { useState, useEffect, useRef } from 'react'
import ProductSearch from './ProductSearch'

export default function ProductSearchModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialQuery = '',
  title = 'Search Products'
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery)
    }
  }, [isOpen, initialQuery])

  if (!isOpen) return null

  const handleSelect = (product) => {
    onSelect(product)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col" ref={modalRef}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ProductSearch
            onSelect={handleSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </div>
    </div>
  )
}