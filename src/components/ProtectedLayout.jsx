import { useLocation } from 'react-router-dom'

export const ProtectedLayout = ({ children }) => {
  const location = useLocation()
  
  // Only apply max-width constraint on non-menu-selector pages
  const isMenuSelector = location.pathname === '/menu-selector'
  
  // Build identifier - update this when making changes
  const buildId = '2025-01-27-1445'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Build ID display in top right */}
      <div className="absolute top-4 right-4 text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-lg shadow-sm font-mono">
        Build: {buildId}
      </div>

      <main className={isMenuSelector ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {children}
      </main>
    </div>
  )
}