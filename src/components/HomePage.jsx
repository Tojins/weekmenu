import { useAuth } from './AuthProvider'

export const HomePage = () => {
  const { user, userProfile } = useAuth()

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Weekmenu
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Plan your weekly meals and organize your shopping lists.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Weekly Menu</h2>
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Select recipes for each day of the week. Build your perfect meal plan from our recipe collection.
          </p>
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
            Plan This Week
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Shopping Lists</h2>
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Manage your shopping lists. Generate lists from your weekly menu or create custom lists.
          </p>
          <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
            Manage Lists
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Your Account</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-gray-700">{user?.email}</div>
            <div className="text-sm text-gray-500">Account</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-700">Free</div>
            <div className="text-sm text-gray-500">Plan</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-700">{new Date(user?.created_at).toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">Member Since</div>
          </div>
        </div>
      </div>
    </div>
  )
}