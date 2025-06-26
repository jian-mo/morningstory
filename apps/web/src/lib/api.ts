import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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

export interface AuthResponse {
  access_token: string
  user: User
}

// Auth API
export const authApi = {
  me: () => api.get<User>('/auth/me'),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),
}

// Integrations API
export const integrationsApi = {
  list: () => api.get<Integration[]>('/integrations'),
  remove: (type: string) => api.delete(`/integrations/${type}`),
}

// Standups API
export const standupsApi = {
  list: () => api.get('/standups'),
  today: () => api.get('/standups/today'),
  generate: (data: any) => api.post('/standups/generate', data),
}