import { useState } from 'react'
import { CachedImage } from './CachedImage'
import { useStores } from '../hooks/useStores'
import { NewListModal } from './NewListModal'

export function ListSelectorModal({ 
  lists, 
  selectedListId, 
  onSelectList, 
  onClose,
  promptText
}) {
  const { data: stores } = useStores()
  const [showCreateNew, setShowCreateNew] = useState(false)
  
  // Check if there are stores without active lists
  const activeStoreIds = new Set(
    lists?.filter(list => list.is_active && list.store_id)
      .map(list => list.store_id) || []
  )
  const hasAvailableStores = stores?.some(store => !activeStoreIds.has(store.id)) || false
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {promptText || 'Select Shopping List'}
          </h3>
          
          {!showCreateNew ? (
            <>
              {/* Existing lists */}
              {lists && lists.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Active shopping lists:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {lists.filter(l => l.is_active).map(list => (
                      <button
                        key={list.id}
                        onClick={() => onSelectList(list.id)}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          list.id === selectedListId 
                            ? 'bg-green-50 border-2 border-green-500' 
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          {list.store?.chain?.logo_url && (
                            <CachedImage 
                              src={list.store.chain.logo_url} 
                              alt={list.store.chain.name}
                              className="w-8 h-8 mr-3 object-contain"
                              width={32}
                              height={32}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{list.store?.name}</div>
                            <div className="text-sm text-gray-600">{list.items_count || 0} items</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Create new button */}
              {hasAvailableStores && (
                <button
                  onClick={() => setShowCreateNew(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-gray-50 transition-all text-gray-600 hover:text-gray-800"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create new list for another store
                  </span>
                </button>
              )}
            </>
          ) : (
            /* Embed NewListModal for store selection */
            <NewListModal
              stores={stores}
              shoppingLists={lists}
              onSelectStore={(storeId) => onSelectList(`new-${storeId}`)}
              onClose={() => setShowCreateNew(false)}
              embedded={true}
            />
          )}
        </div>
        
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}