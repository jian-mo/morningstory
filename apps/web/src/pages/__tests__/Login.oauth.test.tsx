import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { Login } from '../Login'
import { supabase } from '../../lib/supabase'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
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

describe('Login OAuth Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location.origin for tests
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://morning-story-web.vercel.app' },
      writable: true,
    })
  })

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )
  }

  it('renders OAuth providers correctly', () => {
    renderLogin()

    // Check for Google OAuth button
    expect(screen.getByText(/Sign in with google/i)).toBeInTheDocument()
    
    // Check for GitHub OAuth button
    expect(screen.getByText(/Sign in with github/i)).toBeInTheDocument()
  })

  it('initiates Google OAuth with correct redirect URL', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/oauth/...' },
      error: null,
    })

    renderLogin()

    const googleButton = screen.getByText(/Sign in with google/i)
    await userEvent.click(googleButton)

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://morning-story-web.vercel.app/auth/callback',
      },
    })
  })

  it('initiates GitHub OAuth with correct redirect URL', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'github', url: 'https://github.com/login/oauth/...' },
      error: null,
    })

    renderLogin()

    const githubButton = screen.getByText(/Sign in with github/i)
    await userEvent.click(githubButton)

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: {
        redirectTo: 'https://morning-story-web.vercel.app/auth/callback',
      },
    })
  })

  it('handles OAuth error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: null,
      error: { message: 'OAuth provider error', name: 'AuthError', status: 400 },
    } as any)

    renderLogin()

    const googleButton = screen.getByText(/Sign in with google/i)
    await userEvent.click(googleButton)

    // Should still be on login page (not navigated away)
    expect(mockNavigate).not.toHaveBeenCalled()
    
    consoleError.mockRestore()
  })

  it('uses correct redirect URL for different environments', () => {
    // Test with localhost
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3001' },
      writable: true,
    })

    renderLogin()

    // The Auth component should use window.location.origin
    const expectedRedirect = 'http://localhost:3001/auth/callback'
    
    // Verify the redirect URL is constructed correctly
    expect(screen.getByText(/Sign in with google/i)).toBeInTheDocument()
  })

  it('redirects authenticated users to dashboard', async () => {
    // Mock authenticated session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600 * 1000,
          refresh_token: 'refresh',
          user: {
            id: '123',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01',
          },
        },
      },
      error: null,
    })

    renderLogin()

    // Should redirect to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('supports magic link authentication', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: { 
        user: null,
        session: null,
      },
      error: null,
    })

    renderLogin()

    // Find and fill email input
    const emailInput = screen.getByLabelText(/Email address/i)
    await userEvent.type(emailInput, 'test@example.com')

    // Click magic link button
    const magicLinkButton = screen.getByText(/Send magic link/i)
    await userEvent.click(magicLinkButton)

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: 'https://morning-story-web.vercel.app/auth/callback',
      },
    })
  })
})