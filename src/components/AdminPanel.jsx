import { useNavigate } from 'react-router-dom'

export const AdminPanel = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Admin Tools</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Admin Only
        </span>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => navigate('/recipe-monitor')}
          className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Recipe Processing Monitor</h3>
              <p className="text-sm text-gray-600 mt-1">
                Monitor recipe search queries and URL candidate processing
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}