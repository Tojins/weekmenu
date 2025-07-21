import { useAuth } from './AuthProvider'
import { useNavigate } from 'react-router-dom'
import { ShoppingListPanel } from './ShoppingListPanel'
import { RecipeSelectorPanel } from './RecipeSelectorPanel'
import { SettingsPanel } from './SettingsPanel'
import { AdminPanel } from './AdminPanel'

export const HomePage = () => {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <RecipeSelectorPanel />
        <ShoppingListPanel />
        <SettingsPanel />
        {userProfile?.is_admin && <AdminPanel />}
      </div>
    </div>
  )
}