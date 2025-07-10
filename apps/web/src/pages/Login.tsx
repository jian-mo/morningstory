import React, { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Bot, AlertCircle } from 'lucide-react'

export function Login() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    // Check for error parameters in URL
    const error = searchParams.get('error')
    const description = searchParams.get('description')
    
    if (error) {
      let message = 'Authentication failed'
      switch (error) {
        case 'auth_failed':
          message = 'Authentication failed. Please try again.'
          break
        case 'auth_timeout':
          message = 'Authentication timed out. Please try again.'
          break
        case 'access_denied':
          message = 'Access denied. Authentication was cancelled or rejected.'
          break
        default:
          message = description ? decodeURIComponent(description) : `Authentication error: ${error}`
      }
      setErrorMessage(message)
      console.log('Login: Error from URL params:', error, description)
    } else {
      setErrorMessage(null)
    }
  }, [searchParams])

  // Listen for auth events to clear errors on new attempts
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setErrorMessage(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <Bot className="h-12 w-12 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Morning Story</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to automate your daily standup preparation
          </p>
        </div>
        
        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{errorMessage}</span>
            </div>
          </div>
        )}
        
        {/* Supabase Auth UI */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'w-full px-4 py-2 text-sm font-medium rounded-md transition-colors',
                input: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              },
            }}
            providers={['google', 'github']}
            redirectTo={`${window.location.origin}/auth/callback`}
            onlyThirdPartyProviders={false}
            magicLink={true}
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Create password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                  confirmation_text: 'Check your email for the confirmation link',
                },
                magic_link: {
                  email_input_label: 'Email address',
                  button_label: 'Send magic link',
                  loading_button_label: 'Sending magic link...',
                  link_text: 'Send a magic link email',
                  confirmation_text: 'Check your email for the magic link',
                },
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Connect GitHub, Jira, and other tools after signing in
          </p>
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  )
}