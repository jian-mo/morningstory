import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Processing OAuth callback...')
      console.log('Current URL:', window.location.href)
      
      try {
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
          
          // Manually set the session since detectSessionInUrl isn't working
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            console.error('Error setting session:', sessionError)
            // If the error is "Invalid API key", try a different approach
            if (sessionError.message === 'Invalid API key') {
              console.log('Trying alternative approach - storing tokens and reloading')
              
              // Get user info from access token
              const expiresAt = parseInt(hashParams.get('expires_at') || '0')
              const tokenType = hashParams.get('token_type') || 'bearer'
              
              // Create session object matching Supabase format
              const session = {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                expires_in: expiresAt - Math.floor(Date.now() / 1000),
                token_type: tokenType,
                user: null // Will be populated by Supabase
              }
              
              // Store in the format Supabase expects
              localStorage.setItem('supabase.auth.token', JSON.stringify(session))
              
              // Also trigger auth state change manually
              try {
                const { data: user } = await supabase.auth.getUser(accessToken)
                console.log('User info:', user)
              } catch (userError) {
                console.log('Could not get user info:', userError)
              }
              
              // Clear hash and reload
              window.location.href = '/dashboard'
              return
            }
            navigate('/login?error=session_error')
            return
          }
          
          console.log('Session set successfully:', data)
          // Clear the URL hash
          window.history.replaceState({}, document.title, window.location.pathname)
          navigate('/dashboard')
          return
        }

        // No tokens found
        console.log('No OAuth tokens found')
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