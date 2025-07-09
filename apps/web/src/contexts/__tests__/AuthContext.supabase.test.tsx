import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '../../lib/supabase'
import { User, Session } from '@supabase/supabase-js'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
}

const mockSession: Session = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600 * 1000,
  refresh_token: 'mock-refresh',
  user: mockUser,
}

// Test component
function TestComponent() {
  const { user, session, isLoading, isAuthenticated, signOut } = useAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext with Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with no user when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('session')).toHaveTextContent('no-session')
  })

  it('initializes with user when authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('session')).toHaveTextContent('has-session')
  })

  it('responds to auth state changes', async () => {
    let authChangeCallback: any

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      } as any
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
    })

    // Simulate sign in
    act(() => {
      authChangeCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    // Simulate sign out
    act(() => {
      authChangeCallback('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  it('handles sign out correctly', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
    
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
    })

    act(() => {
      screen.getByText('Sign Out').click()
    })

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('unsubscribes from auth changes on unmount', () => {
    const unsubscribe = vi.fn()
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe,
        },
      },
    } as any)

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})