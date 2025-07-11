import { useAuth } from './AuthProvider'
import { useLocation } from 'react-router-dom'

export const ProtectedLayout = ({ children }) => {
  const { user, userProfile, signOut } = useAuth()
  const location = useLocation()
  
  // Only apply max-width constraint on non-menu-selector pages
  const isMenuSelector = location.pathname === '/menu-selector'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Weekmenu</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-gray-600 text-sm">
                  Welcome, {userProfile?.full_name || user?.email}
                </span>
                {userProfile?.avatar_url && (
                  <img
                    src={userProfile.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
              
              <button
                onClick={handleSignOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className={isMenuSelector ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {children}
      </main>
    </div>
  )
}