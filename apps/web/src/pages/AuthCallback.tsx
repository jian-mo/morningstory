import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const { user, isLoading, session } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Processing OAuth callback...')
      
      try {
        // Get the current session to see if OAuth worked
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        console.log('Current session:', currentSession)
        console.log('Session error:', error)
        
        if (error) {
          console.error('Session error:', error)
          navigate('/login?error=session_error')
          return
        }

        if (currentSession && currentSession.user) {
          console.log('User authenticated:', currentSession.user.email)
          navigate('/dashboard')
        } else {
          console.log('No session found, redirecting to login')
          navigate('/login?error=auth_failed')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        navigate('/login?error=callback_error')
      }
    }

    // Don't redirect immediately, wait a moment for Supabase to process the callback
    const timer = setTimeout(() => {
      if (!isLoading) {
        handleAuthCallback()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [navigate, isLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" role="status" aria-label="Loading"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Completing authentication...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we redirect you.
          </p>
        </div>
      </div>
    </div>
  )
}