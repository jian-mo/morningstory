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
      console.log('Current URL:', window.location.href)
      console.log('URL search params:', window.location.search)
      
      try {
        // Check if there's an OAuth callback in the URL (both query params and hash)
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        const code = urlParams.get('code')
        const accessToken = hashParams.get('access_token')
        const error = urlParams.get('error') || hashParams.get('error')
        
        console.log('OAuth code from URL:', code ? 'Found' : 'Not found')
        console.log('OAuth access_token from hash:', accessToken ? 'Found' : 'Not found')
        console.log('OAuth error from URL:', error)
        
        if (error) {
          console.error('OAuth error in URL:', error)
          navigate('/login?error=oauth_error')
          return
        }

        if (code || accessToken) {
          console.log('OAuth tokens found, waiting for Supabase to process...')
          // Wait a bit longer for Supabase to process the OAuth callback
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        // If there are tokens in the URL, manually set the session
        if (accessToken) {
          console.log('Manually setting session from URL tokens...')
          const refreshToken = hashParams.get('refresh_token')
          const expiresAt = hashParams.get('expires_at')
          
          if (refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            console.log('Set session result:', sessionData, sessionError)
          }
        }
        
        // Get the current session to see if OAuth worked
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Current session:', currentSession)
        console.log('Session error:', sessionError)
        
        if (sessionError) {
          console.error('Session error:', sessionError)
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

    // Wait a moment before processing to ensure the page is fully loaded
    const timer = setTimeout(() => {
      if (!isLoading) {
        handleAuthCallback()
      }
    }, 500)

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