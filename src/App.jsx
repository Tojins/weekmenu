import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
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
  
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
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
  
  return user ? <Navigate to="/" /> : children
}

function App() {
  return (
    <Router basename="/weekmenu">
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
    </Router>
  )
}

export default App