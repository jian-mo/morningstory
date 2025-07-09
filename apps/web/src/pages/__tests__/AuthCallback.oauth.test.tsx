import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthCallback } from '../AuthCallback'
import { AuthProvider } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockUser = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
}

const mockSession = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600 * 1000,
  refresh_token: 'mock-refresh',
  user: mockUser,
}

describe('AuthCallback OAuth Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderAuthCallback = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </BrowserRouter>
    )
  }

  it('shows loading state initially', () => {
    vi.mocked(supabase.auth.getSession).mockReturnValue(
      new Promise(() => {}) // Never resolves to keep loading state
    )

    renderAuthCallback()

    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    expect(screen.getByText('Please wait while we redirect you.')).toBeInTheDocument()
  })

  it('redirects to dashboard when OAuth authentication succeeds', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to login with error when OAuth authentication fails', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=auth_failed')
    })
  })

  it('handles OAuth error from URL parameters', async () => {
    // Mock URL with error parameter (simulating OAuth provider error)
    Object.defineProperty(window, 'location', {
      value: {
        search: '?error=access_denied&error_description=User%20denied%20access',
        origin: 'https://morning-story-web.vercel.app',
      },
      writable: true,
    })

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=auth_failed')
    })
  })

  it('handles successful OAuth with user metadata', async () => {
    const userWithMetadata = {
      ...mockUser,
      user_metadata: {
        avatar_url: 'https://github.com/avatar.jpg',
        full_name: 'Test User',
        provider_id: '12345',
        sub: '12345',
      },
      app_metadata: {
        provider: 'google',
        providers: ['google'],
      },
    }

    const sessionWithMetadata = {
      ...mockSession,
      user: userWithMetadata,
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionWithMetadata },
      error: null,
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles session expiry during OAuth callback', async () => {
    // For expired sessions, Supabase typically returns null session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=auth_failed')
    })
  })

  it('handles network errors during OAuth callback', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(supabase.auth.getSession).mockRejectedValue(
      new Error('Network error')
    )

    renderAuthCallback()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=auth_failed')
    })

    consoleError.mockRestore()
  })

  it('does not redirect before auth state is determined', () => {
    // Mock loading state
    vi.mocked(supabase.auth.getSession).mockReturnValue(
      new Promise(() => {}) // Never resolves
    )

    renderAuthCallback()

    // Should not have navigated yet
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
  })
})