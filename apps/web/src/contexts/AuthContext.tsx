import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      console.log('AuthContext: Initializing auth...')
      
      // Check if we have OAuth tokens in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken && mounted) {
        console.log('AuthContext: Found OAuth tokens in URL, will let Supabase handle them')
        // Don't try to manually set session - Supabase should handle it automatically
      }
      
      // Get the current session from Supabase (it handles its own persistence)
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('AuthContext: Current session:', session)
      console.log('AuthContext: Session error:', error)
      
      if (session) {
        console.log('AuthContext: Session found with user:', session.user)
        console.log('AuthContext: Access token present:', !!session.access_token)
        console.log('AuthContext: Session expires at:', new Date(session.expires_at! * 1000))
        
        // If session exists but user is null, try to refresh the session
        if (!session.user && session.access_token) {
          console.log('AuthContext: Session has no user, attempting to refresh...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          console.log('AuthContext: Refresh result:', refreshData, refreshError)
          
          if (refreshData.session && refreshData.session.user) {
            console.log('AuthContext: Refresh successful, using refreshed session')
            if (mounted) {
              setSession(refreshData.session)
              setUser(refreshData.session.user)
              setIsLoading(false)
            }
            return
          } else if (refreshError) {
            console.log('AuthContext: Refresh failed, clearing invalid session')
            await supabase.auth.signOut()
            if (mounted) {
              setSession(null)
              setUser(null)
              setIsLoading(false)
            }
            return
          }
        }
      }
      
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session)
      console.log('AuthContext: Event details - user:', session?.user, 'access_token present:', !!session?.access_token)
      
      // If we get a session without a user, try to refresh it
      if (session && !session.user && session.access_token && event !== 'SIGNED_OUT') {
        console.log('AuthContext: Auth state change has session but no user, attempting refresh...')
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          console.log('AuthContext: Auth state refresh result:', refreshData, refreshError)
          
          if (refreshData.session && refreshData.session.user && mounted) {
            console.log('AuthContext: Using refreshed session from auth state change')
            setSession(refreshData.session)
            setUser(refreshData.session.user)
            setIsLoading(false)
            return
          } else if (refreshError) {
            console.log('AuthContext: Auth state refresh failed, clearing session')
            await supabase.auth.signOut()
            if (mounted) {
              setSession(null)
              setUser(null)
              setIsLoading(false)
            }
            return
          }
        } catch (refreshErr) {
          console.error('AuthContext: Failed to refresh session:', refreshErr)
        }
      }
      
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}