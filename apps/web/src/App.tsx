import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthCallback } from './pages/AuthCallback'
import { Integrations } from './pages/Integrations'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/dashboard" element={<Navigate to="/integrations" replace />} />
        <Route path="/" element={<Navigate to="/integrations" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App