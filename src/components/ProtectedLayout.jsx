import { useLocation } from 'react-router-dom'

export const ProtectedLayout = ({ children }) => {
  const location = useLocation()
  
  // Only apply max-width constraint on non-menu-selector pages
  const isMenuSelector = location.pathname === '/menu-selector'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      <main className={isMenuSelector ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {children}
      </main>
    </div>
  )
}