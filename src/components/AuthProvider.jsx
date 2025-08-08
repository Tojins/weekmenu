import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  console.log('[AuthProvider] Current state:', {
    user: user?.id,
    userProfile: userProfile?.id,
    subscription_id: subscription?.subscription_id,
    loading,
    timestamp: new Date().toISOString()
  })

  useEffect(() => {
    let isCancelled = false
    
    // Get initial session
    const getSession = async () => {
      if (isCancelled) return
      console.time('AuthProvider:getSession')
      try {
        // Let Supabase handle session restoration from localStorage
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!error && session) {
          setUser(session.user)
          // Don't fetch profile here - let INITIAL_SESSION handle it
        } else {
          setUser(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error in getSession:', error)
        setLoading(false)
      }
      console.timeEnd('AuthProvider:getSession')
    }

    // No timeout - if auth fails, it should fail properly

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthProvider] Auth state change: ${event}`)
        setUser(session?.user ?? null)
        
        // Fetch profile on auth events that indicate a new session
        // But avoid duplicate fetches
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
          // Don't await here to avoid blocking auth completion
          fetchUserProfile(session.user.id).catch(err => 
            console.error('[AuthProvider] Profile fetch error:', err)
          )
        } else if (!session?.user) {
          setUserProfile(null)
          setSubscription(null)
          console.log('[AuthProvider] Cleared user data - no session')
        }
        
        // Set loading false when auth state is determined
        setLoading(false)
      }
    )

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    console.time('AuthProvider:fetchUserProfile')
    try {
      console.time('AuthProvider:profileQuery')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.timeEnd('AuthProvider:profileQuery')
      
      if (error) {
        console.error('[AuthProvider] Error fetching profile:', error)
        setError(`Failed to load user profile: ${error.message}`)
        // This is a critical error - user exists but profile doesn't
        return
      }

        setUserProfile(data)
        
        // Fetch subscription if user has subscription_id
        if (data?.subscription_id) {
          const { data: subscriptionData, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', data.subscription_id)
            .single()
          
          if (subError) {
            console.error('[AuthProvider] Error fetching subscription:', subError)
            setError(`Failed to load subscription: ${subError.message}`)
            return
          }
          
          setSubscription({
            ...subscriptionData,
            subscription_id: subscriptionData?.id // Add subscription_id for backward compatibility
          })
        }
        
        console.log('[AuthProvider] fetchUserProfile completed:', {
          userId,
          userProfile: data?.id,
          subscription_id: data?.subscription_id
        })
    } catch (error) {
      console.error('[AuthProvider] Error in fetchUserProfile:', error)
      setError(`Failed to load user data: ${error.message}`)
    }
    console.timeEnd('AuthProvider:fetchUserProfile')
  }

  const signInWithEmail = async (email, password) => {
    console.time('AuthProvider:signInWithEmail')
    console.time('AuthProvider:signInWithPassword')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.timeEnd('AuthProvider:signInWithPassword')
    
    // Don't fetch profile here - the auth state change listener will handle it
    // This prevents duplicate requests
    console.timeEnd('AuthProvider:signInWithEmail')
    
    return { data, error }
  }

  const signUpWithEmail = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/weekmenu/auth/callback`
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    userProfile,
    subscription,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}