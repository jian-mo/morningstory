import { supabase } from './supabase'

class ApiClient {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    return response.json()
  }

  // Standup methods
  async getStandups() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return this.request(`${apiUrl}/standups`)
  }

  async getTodayStandup() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return this.request(`${apiUrl}/standups/today`)
  }

  async generateStandup(data: { tone: string; length: string; customPrompt?: string }) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return this.request(`${apiUrl}/standups/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteStandup(id: string) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return this.request(`${apiUrl}/standups/${id}`, {
      method: 'DELETE',
    })
  }

  // Integrations
  async getIntegrations() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return this.request(`${apiUrl}/integrations`)
  }
}

export const api = new ApiClient()

// Legacy API for compatibility
export const integrationsApi = {
  list: () => api.getIntegrations(),
  remove: (type: string) => api.request(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/integrations/${type}`, { method: 'DELETE' })
}

// Legacy exports for compatibility
export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface Integration {
  id: string
  type: 'GITHUB' | 'ASANA' | 'JIRA' | 'TRELLO' | 'GITLAB' | 'SLACK'
  isActive: boolean
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}