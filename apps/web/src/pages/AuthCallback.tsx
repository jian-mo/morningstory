import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    console.log('AuthCallback: Processing OAuth callback...')
    console.log('AuthCallback: Current URL:', window.location.href)
    console.log('AuthCallback: Hash params:', window.location.hash)
    
    // Check for error in URL parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const error = hashParams.get('error')
    const errorDescription = hashParams.get('error_description')
    
    if (error) {
      console.error('AuthCallback: OAuth error:', error, errorDescription)
      navigate(`/login?error=${error}&description=${encodeURIComponent(errorDescription || '')}`)
      return
    }
    
    // The Supabase client is configured to automatically handle the OAuth callback.
    // Listen for auth state changes to know when to redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCallback: Auth state changed:', event, session)
      if (event === 'SIGNED_IN' && session) {
        console.log('AuthCallback: Sign in successful, redirecting to dashboard')
        navigate('/dashboard')
      } else if (event === 'USER_UPDATED' && !session) {
        console.log('AuthCallback: User updated but no session, redirecting to login')
        navigate('/login?error=auth_failed')
      }
    })

    // Also check if already signed in
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthCallback: Current session check:', session, error)
      if (session) {
        console.log('AuthCallback: Already signed in, redirecting to dashboard')
        navigate('/dashboard')
      } else if (error) {
        console.error('AuthCallback: Error getting session:', error)
      }
    })

    // Set a timeout to handle cases where auth state doesn't change
    const timeout = setTimeout(() => {
      console.log('AuthCallback: Timeout reached, checking final state')
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.log('AuthCallback: No session after timeout, redirecting to login')
          navigate('/login?error=auth_timeout')
        }
      })
    }, 10000) // 10 second timeout

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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