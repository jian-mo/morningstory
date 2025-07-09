import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
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
        console.log('AuthContext: Found OAuth tokens in URL, setting session...')
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('AuthContext: Error setting session from URL:', error)
          } else {
            console.log('AuthContext: Successfully set session from URL:', data)
            // Clear the hash to prevent issues
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } catch (err) {
          console.error('AuthContext: Failed to set session:', err)
        }
      }
      
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('AuthContext: Current session:', session)
      console.log('AuthContext: Session error:', error)
      
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
    isAuthenticated: !!user,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}