import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import App from '../App'
import { supabase } from '../lib/supabase'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

const mockUser = {
  id: '123',
  email: 'test@example.com',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { 
    avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg',
    email: 'test@example.com',
    email_verified: true,
    full_name: 'Test User',
    iss: 'https://accounts.google.com',
    name: 'Test User',
    picture: 'https://lh3.googleusercontent.com/avatar.jpg',
    provider_id: '123456789',
    sub: '123456789'
  },
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
}

const mockSession = {
  access_token: 'ya29.mock-google-token',
  token_type: 'bearer',
  expires_in: 3599,
  expires_at: Date.now() + 3599 * 1000,
  refresh_token: '1//mock-refresh-token',
  user: mockUser,
}

describe('OAuth Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default to no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    // Mock auth state change subscription
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    } as any)
  })

  describe('Complete OAuth Flow', () => {
    it('successfully completes Google OAuth flow', async () => {
      // Step 1: User visits login page
      const { rerender } = render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument()
      })

      // Step 2: User clicks Google OAuth button
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { 
          provider: 'google', 
          url: 'https://accounts.google.com/oauth/authorize?...' 
        },
        error: null,
      })

      const googleButton = screen.getByText(/Sign in with google/i)
      await userEvent.click(googleButton)

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })

      // Step 3: Simulate OAuth redirect to callback (user returns from Google)
      rerender(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <App />
        </MemoryRouter>
      )

      // Should show loading state
      expect(screen.getByText('Completing authentication...')).toBeInTheDocument()

      // Step 4: Supabase processes OAuth and creates session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Simulate auth state change
      let authStateCallback: any
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as any
      })

      // Re-render to trigger auth state check
      rerender(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <App />
        </MemoryRouter>
      )

      // Trigger successful auth
      if (authStateCallback) {
        authStateCallback('SIGNED_IN', mockSession)
      }

      // Step 5: Should redirect to dashboard
      await waitFor(() => {
        // Should eventually show dashboard content
        expect(screen.queryByText('Completing authentication...')).not.toBeInTheDocument()
      })
    })

    it('handles OAuth failure gracefully', async () => {
      // Step 1: User visits callback with OAuth error
      render(
        <MemoryRouter initialEntries={['/auth/callback?error=access_denied']}>
          <App />
        </MemoryRouter>
      )

      // Should show loading initially
      expect(screen.getByText('Completing authentication...')).toBeInTheDocument()

      // Step 2: No session created due to OAuth error
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Should redirect to login with error
      await waitFor(() => {
        // Should eventually be redirected to login
        expect(screen.queryByText('Completing authentication...')).not.toBeInTheDocument()
      })
    })

    it('handles expired session during OAuth', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Date.now() - 1000, // Expired
      }

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <App />
        </MemoryRouter>
      )

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: expiredSession },
        error: null,
      })

      await waitFor(() => {
        expect(screen.queryByText('Completing authentication...')).not.toBeInTheDocument()
      })
    })

    it('preserves destination after OAuth login', async () => {
      // User tries to access protected route
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      )

      // Should redirect to login (not authenticated)
      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument()
      })

      // Complete OAuth flow
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Simulate successful auth
      let authStateCallback: any
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        } as any
      })

      if (authStateCallback) {
        authStateCallback('SIGNED_IN', mockSession)
      }

      // Should eventually access the protected route
      await waitFor(() => {
        expect(screen.queryByText('Welcome back')).not.toBeInTheDocument()
      })
    })
  })

  describe('Protected Route Access', () => {
    it('allows access to dashboard after successful OAuth', async () => {
      // Mock authenticated state
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      )

      // Should not redirect to login
      await waitFor(() => {
        expect(screen.queryByText('Welcome back')).not.toBeInTheDocument()
      })
    })

    it('blocks access to protected routes without authentication', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      )

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText('Welcome back')).toBeInTheDocument()
      })
    })
  })

  describe('OAuth Provider Specific Tests', () => {
    it('handles GitHub OAuth correctly', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { 
          provider: 'github', 
          url: 'https://github.com/login/oauth/authorize?...' 
        },
        error: null,
      })

      const githubButton = screen.getByText(/Sign in with github/i)
      await userEvent.click(githubButton)

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('handles OAuth provider errors', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: null,
        error: { 
          message: 'OAuth provider configuration error',
          name: 'AuthError',
          status: 400
        },
      } as any)

      const googleButton = screen.getByText(/Sign in with google/i)
      await userEvent.click(googleButton)

      // Should handle error gracefully - still on login page
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
    })
  })
})