import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi, User } from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
  refetch: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('authToken')
  )

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then((res) => res.data),
    enabled: !!token,
    retry: false,
  })

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
  }

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('authToken')
      if (newToken !== token) {
        setToken(newToken)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [token])

  const value: AuthContextType = {
    user: user || null,
    token,
    isLoading: !!token && isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}