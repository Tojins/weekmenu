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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        console.log('Checking auth session...')
        
        // Check if there's a session in localStorage
        const storedSession = localStorage.getItem('sb-padeskjkdetesmfuicvm-auth-token')
        console.log('Stored session exists:', !!storedSession)
        
        // If we have a stored session, parse it and use it directly
        if (storedSession) {
          try {
            const sessionData = JSON.parse(storedSession)
            if (sessionData && sessionData.access_token) {
              console.log('Using stored session directly')
              
              // Get user data using the stored token
              const { data: { user }, error: userError } = await supabase.auth.getUser(sessionData.access_token)
              
              if (!userError && user) {
                console.log('Got user from stored session:', user.email)
                setUser(user)
                // Don't fetch profile here - let onAuthStateChange handle it
                setLoading(false)
                return
              }
            }
          } catch (parseError) {
            console.error('Error parsing stored session:', parseError)
          }
        }
        
        // Fallback to regular session check with shorter timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 2000)
        )
        
        try {
          const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
          
          if (!error && session) {
            console.log('Session check complete: User logged in')
            setUser(session.user)
            await fetchUserProfile(session.user.id)
          } else {
            console.log('No active session')
            setUser(null)
          }
        } catch (timeoutError) {
          console.error('Session check timed out')
          setUser(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error in getSession:', error)
        setLoading(false)
      }
    }

    // Add timeout fallback - reduced to 3 seconds since we handle timeouts internally
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
      }
    }, 3000)

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        
        if (session?.user && !userProfile) {
          // Only fetch profile if we don't have it yet
          await fetchUserProfile(session.user.id)
        } else if (!session?.user) {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      console.log('Fetching user profile for:', userId)
      
      // Add timeout to profile fetch
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
      )
      
      try {
        const { data, error } = await Promise.race([profilePromise, timeoutPromise])
        
        if (error) {
          console.error('Error fetching user profile:', error)
          // Profile is optional, don't block auth
          return
        }

        console.log('User profile fetched successfully')
        setUserProfile(data)
      } catch (timeoutError) {
        console.error('Profile fetch timed out - continuing without profile')
        // Profile is optional, don't block auth
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
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
    loading,
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