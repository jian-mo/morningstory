import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}))

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Test component that uses the auth context
const TestComponent = () => {
  const { user, session, isLoading, isAuthenticated, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="session">{session ? 'Has session' : 'No session'}</div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockGetSession = vi.fn()
  const mockGetUser = vi.fn()
  const mockSignOut = vi.fn()
  const mockOnAuthStateChange = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Get the mocked supabase and assign the mock functions
    const { supabase } = require('../../lib/supabase')
    mockGetSession.mockClear()
    mockGetUser.mockClear()
    mockSignOut.mockClear()
    mockOnAuthStateChange.mockClear()
    
    supabase.auth.getSession = mockGetSession
    supabase.auth.getUser = mockGetUser
    supabase.auth.signOut = mockSignOut
    supabase.auth.onAuthStateChange = mockOnAuthStateChange
    
    // Mock subscription object
    const mockSubscription = { unsubscribe: vi.fn() }
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    })
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { hash: '', search: '' },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('initializes with loading state', () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated')
  })

  it('handles successful session from Supabase', async () => {
    const mockSession = {
      access_token: 'test_token',
      user: { id: 'user1', email: 'test@example.com' }
    }

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('session')).toHaveTextContent('Has session')
    })
  })

  it('handles stored session from localStorage', async () => {
    const storedSession = {
      access_token: 'stored_token',
      refresh_token: 'stored_refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      token_type: 'bearer'
    }

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedSession))
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'stored@example.com' } },
      error: null
    })
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith('stored_token')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('stored@example.com')
    })
  })

  it('clears expired stored session', async () => {
    const expiredSession = {
      access_token: 'expired_token',
      refresh_token: 'expired_refresh',
      expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      token_type: 'bearer'
    }

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSession))
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated')
    })
  })

  it('handles invalid JSON in localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json')
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token')
      expect(consoleSpy).toHaveBeenCalledWith(
        'AuthContext: Error parsing stored session:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('handles OAuth tokens in URL hash', async () => {
    Object.defineProperty(window, 'location', {
      value: { 
        hash: '#access_token=url_token&refresh_token=url_refresh',
        search: '' 
      },
      writable: true
    })

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'AuthContext: Found OAuth tokens in URL, will let Supabase handle them'
      )
    })

    consoleSpy.mockRestore()
  })

  it('handles auth state changes', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const mockCallback = vi.fn()
    mockOnAuthStateChange.mockImplementation((callback) => {
      mockCallback.mockImplementation(callback)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate auth state change
    const newSession = {
      access_token: 'new_token',
      user: { id: 'user2', email: 'new@example.com' }
    }

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    // Trigger the auth state change
    mockCallback('SIGNED_IN', newSession)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('new@example.com')
    })
  })

  it('calls signOut correctly', async () => {
    const mockSession = {
      access_token: 'test_token',
      user: { id: 'user1', email: 'test@example.com' }
    }

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    const signOutButton = screen.getByText('Sign Out')
    signOutButton.click()

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('unsubscribes from auth changes on unmount', () => {
    const mockUnsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})