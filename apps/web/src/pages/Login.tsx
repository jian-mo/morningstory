import React from 'react'
import { Github } from 'lucide-react'

export function Login() {
  const handleGitHubLogin = () => {
    // Redirect to GitHub OAuth
    window.location.href = 'http://localhost:3000/auth/github'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Morning Story
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect with GitHub to get started
          </p>
        </div>
        <div>
          <button
            onClick={handleGitHubLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Github className="h-5 w-5 mr-2" />
            Continue with GitHub
          </button>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  )
}