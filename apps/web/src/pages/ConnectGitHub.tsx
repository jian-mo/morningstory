import React, { useState, useEffect } from 'react'
import { Github, Key, ExternalLink, CheckCircle, AlertCircle, Zap, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { API_ENDPOINTS } from '../config/env'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export function ConnectGitHub() {
  const { isAuthenticated, isLoading } = useAuth()
  const [selectedMethod, setSelectedMethod] = useState<'app' | 'token'>('app')
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null)
  const [githubAppConfigured, setGithubAppConfigured] = useState<boolean | null>(null)

  // Check if GitHub App is configured on component mount
  useEffect(() => {
    const checkGitHubAppConfig = async () => {
      // Wait for authentication to be ready
      if (!isAuthenticated || isLoading) {
        return
      }
      
      try {
        const data = await api.request(API_ENDPOINTS.integrations.github.appInstall)
        setGithubAppConfigured(data.configured)
        
        // If GitHub App is not configured, default to token method
        if (!data.configured) {
          setSelectedMethod('token')
        }
      } catch (error) {
        console.error('Error checking GitHub App configuration:', error)
        setGithubAppConfigured(false)
        setSelectedMethod('token')
      }
    }
    
    checkGitHubAppConfig()
  }, [isAuthenticated, isLoading])

  const handleConnect = async () => {
    if (!token.trim()) return
    
    setIsValidating(true)
    try {
      await api.request(API_ENDPOINTS.integrations.github.connect, {
        method: 'POST',
        body: JSON.stringify({ personalAccessToken: token }),
      })
      
      setValidationResult('success')
      // Redirect back to integrations page
      setTimeout(() => window.location.href = '/integrations', 2000)
    } catch (error) {
      setValidationResult('error')
    } finally {
      setIsValidating(false)
    }
  }

  const handleGitHubAppConnect = async () => {
    try {
      const data = await api.request(API_ENDPOINTS.integrations.github.appInstall)
      
      if (data.configured && data.installationUrl) {
        window.location.href = data.installationUrl
      } else {
        // GitHub App not configured
        alert(data.message || 'GitHub App integration is not set up yet. Please use Personal Access Token instead.')
      }
    } catch (error) {
      console.error('Error getting GitHub App installation URL:', error)
      alert('Failed to connect to GitHub App. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Github className="h-12 w-12 mx-auto text-gray-900 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Connect GitHub</h1>
          <p className="text-gray-600 mt-2">
            Choose how you want to connect your GitHub account
          </p>
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card 
            className={`transition-all ${
              githubAppConfigured === false 
                ? 'opacity-60 cursor-not-allowed border-gray-200' 
                : `cursor-pointer ${
                    selectedMethod === 'app' 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:border-gray-300'
                  }`
            }`}
            onClick={() => {
              if (githubAppConfigured !== false) {
                setSelectedMethod('app')
              }
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Zap className={`h-5 w-5 ${githubAppConfigured === false ? 'text-gray-400' : 'text-blue-500'}`} />
                  <span>GitHub App</span>
                </CardTitle>
                {githubAppConfigured === false ? (
                  <Badge variant="secondary">Not Set Up</Badge>
                ) : (
                  <Badge variant="default">Recommended</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {githubAppConfigured === false ? (
                <div className="text-sm text-gray-500 space-y-1">
                  <p>GitHub App integration requires additional setup by the developer.</p>
                  <p>Please use Personal Access Token for now.</p>
                </div>
              ) : (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ One-click installation</li>
                  <li>✓ Automatic token management</li>
                  <li>✓ Fine-grained repository access</li>
                  <li>✓ Higher rate limits</li>
                </ul>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${
              selectedMethod === 'token' 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedMethod('token')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-gray-500" />
                <span>Personal Access Token</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Full control over permissions</li>
                <li>✓ Works with all GitHub accounts</li>
                <li>✓ No installation required</li>
                <li>• Manual token management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Connection Method Content */}
        {selectedMethod === 'app' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Install GitHub App</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {githubAppConfigured === false ? (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">GitHub App Not Configured</h4>
                    <p className="text-sm text-yellow-800 mb-3">
                      The GitHub App integration requires additional setup by the developer. 
                      This involves creating a GitHub App and configuring environment variables.
                    </p>
                    <p className="text-sm text-yellow-800">
                      Please use the Personal Access Token method below for now.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedMethod('token')}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 flex items-center justify-center space-x-2"
                  >
                    <Key className="h-5 w-5" />
                    <span>Switch to Personal Access Token</span>
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Installing our GitHub App is the easiest and most secure way to connect. 
                    You'll be able to select exactly which repositories Morning Story can access.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>You'll be redirected to GitHub</li>
                      <li>Choose repositories to grant access</li>
                      <li>Click "Install" to complete setup</li>
                      <li>You'll be redirected back here</li>
                    </ol>
                  </div>
                  
                  <button
                    onClick={handleGitHubAppConnect}
                    disabled={!githubAppConfigured}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Github className="h-5 w-5" />
                    <span>
                      {githubAppConfigured === null ? 'Checking...' : 'Install GitHub App'}
                    </span>
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Personal Access Token</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll use this to securely access your GitHub activity
                </p>
              </div>
              
              {validationResult === 'success' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Successfully connected! Redirecting...</span>
                </div>
              )}
              
              {validationResult === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Invalid token. Please check and try again.</span>
                </div>
              )}
              
              <button
                onClick={handleConnect}
                disabled={!token.trim() || isValidating}
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Validating...' : 'Connect GitHub'}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to create a Personal Access Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  1. Go to GitHub Settings → Developer settings → Personal access tokens
                </p>
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Create new token</span>
                </a>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Required permissions:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• <code className="bg-gray-100 px-1 rounded">repo</code> - Access to your repositories</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">user:email</code> - Access to your email address</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">read:org</code> - Read your organization membership</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your token is encrypted and stored securely. We only use it to fetch your development activity for standup generation.
                </p>
              </div>
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </div>
  )
}