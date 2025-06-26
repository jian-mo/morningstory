import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthCallback } from '../AuthCallback'

// Mock the auth context
const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(window.location.search)],
  }
})

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

const renderWithRouter = (component: React.ReactElement, search = '') => {
  // Update URL search params
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true,
  })
  
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    renderWithRouter(<AuthCallback />)

    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we redirect you.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('handles successful OAuth with token', async () => {
    renderWithRouter(<AuthCallback />, '?token=test-jwt-token')

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test-jwt-token')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles OAuth error', async () => {
    renderWithRouter(<AuthCallback />, '?error=access_denied')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=oauth_failed')
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  it('handles missing token', async () => {
    renderWithRouter(<AuthCallback />, '')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=no_token')
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  it('logs OAuth error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    renderWithRouter(<AuthCallback />, '?error=server_error')

    expect(consoleSpy).toHaveBeenCalledWith('OAuth error:', 'server_error')
    
    consoleSpy.mockRestore()
  })

  it('prioritizes error over token in URL params', async () => {
    renderWithRouter(<AuthCallback />, '?token=test-token&error=access_denied')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=oauth_failed')
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })
})