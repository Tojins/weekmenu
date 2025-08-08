import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { WeekMenuProvider } from './contexts/WeekMenuContext'
import { LoginScreen } from './components/LoginScreen'
import { ProtectedLayout } from './components/ProtectedLayout'
import { HomePage } from './components/HomePage'
import { AuthCallback } from './components/AuthCallback'
import { MenuSelector } from './components/MenuSelector'
import { ShoppingListDetail } from './components/ShoppingListDetail'
import RecipeMonitor from './components/RecipeMonitor'
import { Settings } from './components/Settings'
import AddToShoppingList from './components/AddToShoppingList'

function ProtectedRoute({ children }) {
  const { user, loading, error } = useAuth()
  
  // Don't block on loading - if we have a user, show the content
  // This prevents the timeout issue where auth loading blocks the entire UI
  if (!loading && !user) {
    return <Navigate to="/login" />
  }
  
  // Show content immediately if we have a user, don't wait for loading to complete
  if (user) {
    return children
  }
  
  // Show error state if auth failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Only show loading screen if we don't have user info yet
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait while we load your account.</p>
          </div>
        </div>
      </div>
    )
  }
  
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  // Only redirect if we're sure there's a user (not loading)
  if (!loading && user) {
    return <Navigate to="/" />
  }
  
  // Show login screen even while checking auth status
  return children
}

// Create a query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 1,
      // Refetch on window focus
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <Router basename="/weekmenu">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WeekMenuProvider>
            <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <LoginScreen />
              </PublicRoute>
            } />
            
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <HomePage />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/menu-selector" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <MenuSelector />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/add-to-list" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <AddToShoppingList />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/shopping-list/:id" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <ShoppingListDetail />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/recipe-monitor" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <RecipeMonitor />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Settings />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </WeekMenuProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  )
}

export default App