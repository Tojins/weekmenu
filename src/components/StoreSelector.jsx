export function StoreSelector({ 
  stores, 
  selectedStore, 
  onChange, 
  showActiveListWarning = false,
  autoFocus = false,
  className = ''
}) {
  return (
    <>
      <select
        value={selectedStore}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
        autoFocus={autoFocus}
      >
        <option value="">Select a store...</option>
        {stores.map((store) => (
          <option 
            key={store.id} 
            value={store.id}
            disabled={store.hasActiveList}
          >
            {store.name}{store.hasActiveList ? ' (Active list exists)' : ''}
          </option>
        ))}
      </select>
      {showActiveListWarning && (
        <p className="mt-2 text-sm text-gray-500">
          Stores with existing active lists are disabled. You can only have one active list per store.
        </p>
      )}
    </>
  )
}