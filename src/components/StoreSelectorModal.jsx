import { StoreSelector } from './StoreSelector'

export function StoreSelectorModal({ 
  stores, 
  selectedStore, 
  onSelectStore, 
  onConfirm, 
  onCancel,
  creating = false
}) {
  const handleConfirm = () => {
    if (selectedStore) {
      onConfirm()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Select a Store</h2>
        
        <StoreSelector
          stores={stores}
          selectedStore={selectedStore}
          onChange={onSelectStore}
          showActiveListWarning={true}
        />
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStore || creating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Shopping List'}
          </button>
        </div>
      </div>
    </div>
  )
}