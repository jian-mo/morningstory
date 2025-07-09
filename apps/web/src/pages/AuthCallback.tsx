import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Processing OAuth callback...')
      console.log('Current URL:', window.location.href)
      
      try {
        // First, let Supabase try to handle the OAuth callback automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Supabase detected OAuth session:', session)
          navigate('/dashboard')
          return
        }
        
        // If Supabase didn't detect the session, try manual processing
        console.log('No session detected by Supabase, trying manual processing...')
        
        // Check for errors in URL
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const error = urlParams.get('error') || hashParams.get('error')
        
        if (error) {
          console.error('OAuth error in URL:', error)
          navigate('/login?error=oauth_error')
          return
        }

        // Get tokens from URL hash
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          console.log('OAuth tokens found, manually processing...')
          
          // Try to exchange the tokens for a session
          const { data, error: exchangeError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (exchangeError) {
            console.error('Error setting session:', exchangeError)
            
            // If Supabase rejects the tokens, it means they might be from a different auth provider
            // In this case, we should redirect to login with an error
            navigate('/login?error=invalid_tokens')
            return
          }
          
          if (data?.session) {
            console.log('Session set successfully:', data.session)
            // Clear the URL hash
            window.history.replaceState({}, document.title, window.location.pathname)
            navigate('/dashboard')
            return
          }
        }

        // No tokens found or unable to process
        console.log('No OAuth tokens found or unable to process')
        navigate('/login?error=no_tokens')
      } catch (err) {
        console.error('Auth callback error:', err)
        navigate('/login?error=callback_error')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [navigate])

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