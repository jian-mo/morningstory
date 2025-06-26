import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthCallback } from './pages/AuthCallback'
import { Login } from './pages/Login'
import { Integrations } from './pages/Integrations'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/integrations" element={
          <ProtectedRoute>
            <Integrations />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<Navigate to="/integrations" replace />} />
        <Route path="/" element={<Navigate to="/integrations" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App