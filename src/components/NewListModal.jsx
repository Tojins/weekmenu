import { CachedImage } from './CachedImage'

export function NewListModal({ 
  stores,           // All stores
  shoppingLists,    // All shopping lists to filter against
  onSelectStore, 
  onClose,
  embedded = false,
  title = "Create New Shopping List"
}) {
  // Filter stores to only show ones without active lists
  const activeStoreIds = new Set(
    shoppingLists?.filter(list => list.is_active && list.store_id)
      .map(list => list.store_id) || []
  )
  const availableStores = stores?.filter(store => !activeStoreIds.has(store.id)) || []
  
  const content = (
    <>
      {embedded && (
        <button
          onClick={onClose}
          className="text-sm text-gray-600 hover:text-gray-800 mb-3 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to lists
        </button>
      )}
      
      <p className="text-sm text-gray-600 mb-3">Select a store for your new list:</p>
      
      {availableStores && availableStores.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {availableStores.map(store => (
            <button
              key={store.id}
              onClick={() => onSelectStore(store.id)}
              className="w-full p-4 rounded-lg text-left transition-all bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-300"
            >
              <div className="flex items-center">
                {store.chain?.logo_url && (
                  <CachedImage 
                    src={store.chain.logo_url} 
                    alt={store.chain.name}
                    className="w-8 h-8 mr-3 object-contain"
                    width={32}
                    height={32}
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">{store.name}</div>
                  {store.chain?.name && store.chain.name !== store.name && (
                    <div className="text-sm text-gray-600">{store.chain.name}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">All stores already have active shopping lists.</p>
        </div>
      )}
    </>
  )
  
  // If embedded, return just the content
  if (embedded) {
    return content
  }
  
  // Otherwise, wrap in modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
          {content}
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