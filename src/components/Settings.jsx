import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function Settings() {
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back to Home button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {userProfile?.full_name || 'No name set'}
            </p>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  )
}