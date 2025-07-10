import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Plus, Eye, Download, Settings, LogOut } from 'lucide-react'
import { api } from '../lib/api'

interface Standup {
  id: string
  content: string
  date: string
  generatedAt: string
  metadata: {
    tone?: string
    length?: string
    source?: string
    replaced_count?: number
  }
}

export function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const [standups, setStandups] = useState<Standup[]>([])
  const [todayStandup, setTodayStandup] = useState<Standup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStandup, setSelectedStandup] = useState<Standup | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStandups()
      fetchTodayStandup()
    } else if (!authLoading && !user) {
      setIsLoading(false)
    }
  }, [user, isAuthenticated, authLoading])

  const fetchStandups = async () => {
    try {
      const data = await api.getStandups()
      setStandups(data)
    } catch (error) {
      console.error('Failed to fetch standups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTodayStandup = async () => {
    try {
      const data = await api.getTodayStandup()
      setTodayStandup(data)
    } catch (error) {
      console.error('Failed to fetch today\'s standup:', error)
    }
  }

  const generateStandup = async () => {
    setIsGenerating(true)
    try {
      const newStandup = await api.generateStandup({
        tone: 'professional',
        length: 'medium'
      })
      // Remove any existing standup with the same ID to prevent duplicates
      setStandups(prev => {
        const filtered = prev.filter(s => s.id !== newStandup.id)
        return [newStandup, ...filtered]
      })
      setTodayStandup(newStandup)
    } catch (error) {
      console.error('Failed to generate standup:', error)
    } finally {
      setIsGenerating(false)
    }
  }


  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Loading your standups...'}
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Standups</h1>
              <p className="mt-2 text-gray-600">Action-focused standup generation with blocker identification</p>
              <p className="text-sm text-gray-500 mt-1">One standup per day • Regenerate anytime to get fresh insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.email || user?.user_metadata?.name || 'User'}
              </div>
              <Link
                to="/integrations"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </Link>
              <button
                onClick={signOut}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Today's Standup */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Standup</h2>
              <button
                onClick={generateStandup}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : todayStandup ? 'Regenerate' : 'Generate New'}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {todayStandup ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(todayStandup.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(todayStandup.generatedAt).toLocaleTimeString()}
                    </span>
                    {todayStandup.metadata && todayStandup.metadata.replaced_count && todayStandup.metadata.replaced_count > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Updated {todayStandup.metadata.replaced_count} time{todayStandup.metadata.replaced_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(todayStandup.content || '')}
                      className="text-blue-600 hover:text-blue-800"
                      title="Copy to clipboard"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedStandup(todayStandup)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-md">
                    {todayStandup.content || 'No content available'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No standup generated for today yet.</p>
                <p className="text-sm text-gray-400 mt-2">Click "Generate New" to create your daily standup.</p>
                <p className="text-xs text-gray-400 mt-1">Your standup will focus on next steps and blockers to keep you moving forward.</p>
              </div>
            )}
          </div>
        </div>

        {/* Previous Standups */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Previous Standups</h2>
            <p className="text-sm text-gray-500 mt-1">One standup per day • Most recent version shown</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {standups.length > 0 ? (
              standups.map((standup) => (
                <div key={standup.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(standup.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(standup.generatedAt).toLocaleTimeString()}
                          </span>
                          {standup.metadata?.source && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {standup.metadata.source}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 line-clamp-3">
                          {standup.content?.substring(0, 200) || 'No content available'}...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(standup.content || '')}
                        className="text-blue-600 hover:text-blue-800"
                        title="Copy to clipboard"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedStandup(standup)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No previous standups found.</p>
                <p className="text-sm text-gray-400 mt-2">Generate your first standup to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Standup Detail Modal */}
      {selectedStandup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Standup Details - {new Date(selectedStandup.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => setSelectedStandup(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Generated: {new Date(selectedStandup.generatedAt).toLocaleString()}
                </span>
                {selectedStandup.metadata?.tone && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedStandup.metadata.tone}
                  </span>
                )}
                {selectedStandup.metadata?.length && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {selectedStandup.metadata.length}
                  </span>
                )}
              </div>
              
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {selectedStandup.content || 'No content available'}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => copyToClipboard(selectedStandup.content || '')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setSelectedStandup(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}