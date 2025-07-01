import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Plus, Trash2, Eye, Download, Settings } from 'lucide-react'
import { API_ENDPOINTS } from '../config/env'

interface Standup {
  id: string
  content: string
  date: string
  generatedAt: string
  metadata: {
    tone?: string
    length?: string
    source?: string
  }
}

export function Dashboard() {
  const { token } = useAuth()
  const [standups, setStandups] = useState<Standup[]>([])
  const [todayStandup, setTodayStandup] = useState<Standup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStandup, setSelectedStandup] = useState<Standup | null>(null)

  useEffect(() => {
    if (token) {
      fetchStandups()
      fetchTodayStandup()
    }
  }, [token])

  const fetchStandups = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.standups.list, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setStandups(data)
      }
    } catch (error) {
      console.error('Failed to fetch standups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTodayStandup = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.standups.today, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setTodayStandup(data)
      }
    } catch (error) {
      console.error('Failed to fetch today\'s standup:', error)
    }
  }

  const generateStandup = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(API_ENDPOINTS.standups.generate, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tone: 'professional',
          length: 'medium'
        }),
      })
      
      if (response.ok) {
        const newStandup = await response.json()
        setStandups(prev => [newStandup, ...prev])
        setTodayStandup(newStandup)
      }
    } catch (error) {
      console.error('Failed to generate standup:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteStandup = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.standups.delete(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        setStandups(prev => prev.filter(s => s.id !== id))
        if (todayStandup?.id === id) {
          setTodayStandup(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete standup:', error)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your standups...</p>
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
              <p className="mt-2 text-gray-600">Automate your daily standup preparation</p>
            </div>
            <Link
              to="/integrations"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Integrations
            </Link>
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
                {isGenerating ? 'Generating...' : 'Generate New'}
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
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(todayStandup.content)}
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
                    {todayStandup.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No standup generated for today yet.</p>
                <p className="text-sm text-gray-400 mt-2">Click "Generate New" to create your daily standup.</p>
              </div>
            )}
          </div>
        </div>

        {/* Previous Standups */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Previous Standups</h2>
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
                          {standup.metadata.source && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {standup.metadata.source}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 line-clamp-3">
                          {standup.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(standup.content)}
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
                      <button
                        onClick={() => deleteStandup(standup.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete standup"
                      >
                        <Trash2 className="w-4 h-4" />
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
                {selectedStandup.metadata.tone && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedStandup.metadata.tone}
                  </span>
                )}
                {selectedStandup.metadata.length && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {selectedStandup.metadata.length}
                  </span>
                )}
              </div>
              
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {selectedStandup.content}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => copyToClipboard(selectedStandup.content)}
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