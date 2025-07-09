import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AuthCallback() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    const handleAuthCallback = () => {
      console.log('AuthCallback: Processing OAuth callback...')
      console.log('Current URL:', window.location.href)
      
      // Check for errors in URL
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const error = urlParams.get('error') || hashParams.get('error')
      
      if (error) {
        console.error('OAuth error in URL:', error)
        navigate('/login?error=oauth_error')
        return
      }

      // Check if we have tokens in the URL (indicates successful OAuth)
      const accessToken = hashParams.get('access_token')
      const code = urlParams.get('code')
      
      if (accessToken || code) {
        console.log('OAuth tokens found, redirecting to dashboard...')
        // Clear the URL hash to prevent issues
        window.history.replaceState({}, document.title, window.location.pathname)
        navigate('/dashboard')
        return
      }

      // If no tokens and no user, redirect to login
      if (!user && !isLoading) {
        console.log('No OAuth tokens and no user, redirecting to login')
        navigate('/login?error=auth_failed')
      }
    }

    // Process immediately if not loading
    if (!isLoading) {
      handleAuthCallback()
    }
  }, [navigate, isLoading, user])

  // If we have a user, redirect to dashboard
  useEffect(() => {
    if (user) {
      console.log('User found, redirecting to dashboard')
      navigate('/dashboard')
    }
  }, [user, navigate])

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