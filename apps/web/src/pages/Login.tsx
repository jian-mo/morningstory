import React, { useState } from 'react'
import { User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/env'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showTestLogin, setShowTestLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleTestLogin = async () => {
    setIsLoading(true)
    try {
      // Call the test login API endpoint
      const response = await fetch(API_ENDPOINTS.auth.testLogin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        login(data.access_token)
        navigate('/integrations')
      } else {
        console.error('Test login failed')
      }
    } catch (error) {
      console.error('Test login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Morning Story
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Automate your daily standup preparation
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Primary Login Button */}
          <button
            onClick={handleTestLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <User className="h-5 w-5 mr-2" />
            {isLoading ? 'Signing in...' : 'Get Started'}
          </button>
          
          {/* Development Note */}
          <div className="text-center">
            <button
              onClick={() => setShowTestLogin(!showTestLogin)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-1"
            >
              {showTestLogin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showTestLogin ? 'Hide' : 'Show'} development info</span>
            </button>
          </div>
          
          {showTestLogin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                <strong>Development Mode:</strong> This creates a test user account. In production, this would integrate with your organization's SSO or user management system.
              </p>
            </div>
          )}
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            After login, you can connect your GitHub, Jira, and other tools
          </p>
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  )
}