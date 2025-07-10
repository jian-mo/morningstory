import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, session } = useAuth()

  console.log('ProtectedRoute check:', {
    hasSession: !!session,
    isAuthenticated,
    isLoading,
    pathname: window.location.pathname,
    user: user ? { email: user.email, id: user.id } : undefined,
    sessionHasUser: !!session?.user,
    accessTokenPresent: !!session?.access_token
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" aria-label="Loading"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}