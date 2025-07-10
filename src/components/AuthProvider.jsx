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
    let timeoutId = null
    
    // Get initial session
    const getSession = async () => {
      try {
        // Check if there's a session in localStorage
        const storedSession = localStorage.getItem('sb-padeskjkdetesmfuicvm-auth-token')
        
        // If we have a stored session, parse it and use it directly
        if (storedSession) {
          try {
            const sessionData = JSON.parse(storedSession)
            if (sessionData && sessionData.access_token) {
              // Get user data using the stored token
              const { data: { user }, error: userError } = await supabase.auth.getUser(sessionData.access_token)
              
              if (!userError && user) {
                setUser(user)
                // Don't fetch profile here - let onAuthStateChange handle it
                // Don't set loading false here, let onAuthStateChange do it
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
            setUser(session.user)
            // Don't fetch profile here - let INITIAL_SESSION handle it
          } else {
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

    // Add timeout fallback
    timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 3000)

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        // Only fetch profile on INITIAL_SESSION to avoid duplicate calls
        if (event === 'INITIAL_SESSION' && session?.user && !userProfile) {
          await fetchUserProfile(session.user.id)
        } else if (!session?.user) {
          setUserProfile(null)
        }
        
        // Clear timeout when auth completes
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        setLoading(false)
      }
    )

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
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
          // Profile is optional, don't block auth
          return
        }

        setUserProfile(data)
      } catch (timeoutError) {
        // Profile is optional, continue without it
      }
    } catch (error) {
      // Silent fail - profile is optional
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