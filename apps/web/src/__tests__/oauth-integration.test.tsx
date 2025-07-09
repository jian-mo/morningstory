import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthProvider } from '../contexts/AuthContext'
import { AuthCallback } from '../pages/AuthCallback'
import { Login } from '../pages/Login'

// Mock the supabase client
const mockSetSession = vi.fn()
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: mockSetSession,
      getSession: mockGetSession,
      getUser: mockGetUser,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange
    }
  }
}))

// Mock Supabase Auth UI
vi.mock('@supabase/auth-ui-react', () => ({
  Auth: ({ onlyThirdPartyProviders, providers, redirectTo, ...props }: any) => (
    <div data-testid="auth-ui">
      <div data-testid="providers">{providers?.join(',')}</div>
      <div data-testid="redirect-to">{redirectTo}</div>
      <div data-testid="third-party-only">{onlyThirdPartyProviders ? 'true' : 'false'}</div>
      <button onClick={() => {
        // Simulate OAuth redirect
        window.location.href = `${redirectTo}#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000`
      }}>
        Sign in with Google
      </button>
    </div>
  )
}))

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('OAuth Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock subscription object
    const mockSubscription = { unsubscribe: vi.fn() }
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    })
    
    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/login',
        hash: '',
        search: '',
        pathname: '/login',
        origin: 'http://localhost:3000'
      },
      writable: true
    })
    
    window.history = { replaceState: vi.fn() } as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completes full OAuth flow from login to authenticated state', async () => {
    // Step 1: User visits login page
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Verify login page renders with correct OAuth config
    expect(screen.getByTestId('auth-ui')).toBeInTheDocument()
    expect(screen.getByTestId('providers')).toHaveTextContent('google')
    expect(screen.getByTestId('redirect-to')).toHaveTextContent('http://localhost:3000/auth/callback')

    // Step 2: User clicks Google sign in (simulated)
    // This would normally redirect to Google, then back to our callback
    // We'll simulate the callback directly
    
    // Step 3: OAuth callback with tokens in URL hash
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/auth/callback#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000&token_type=bearer',
        hash: '#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000&token_type=bearer',
        search: '',
        pathname: '/auth/callback'
      },
      writable: true
    })

    // Step 4: AuthCallback processes tokens
    mockSetSession.mockResolvedValue({
      data: { session: { access_token: 'test_token', user: { id: 'user1', email: 'test@example.com' } } },
      error: null
    })

    rerender(
      <BrowserRouter>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </BrowserRouter>
    )

    // Verify callback processing
    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'test_token',
        refresh_token: 'test_refresh'
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles OAuth failure with localStorage fallback', async () => {
    // Simulate OAuth callback with Invalid API key error
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/auth/callback#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000&token_type=bearer',
        hash: '#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000&token_type=bearer',
        search: '',
        pathname: '/auth/callback'
      },
      writable: true
    })

    mockSetSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' }
    })

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'test@example.com' } },
      error: null
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.stringContaining('test_token')
      )
    })

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith('test_token')
    })

    // Should redirect to dashboard with fallback storage
    expect(window.location.href).toBe('/dashboard')
  })

  it('handles OAuth error in callback URL', async () => {
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/auth/callback?error=access_denied',
        hash: '',
        search: '?error=access_denied',
        pathname: '/auth/callback'
      },
      writable: true
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=oauth_error')
    })
  })

  it('handles session persistence after page reload', async () => {
    // Simulate stored session from previous OAuth
    const storedSession = {
      access_token: 'stored_token',
      refresh_token: 'stored_refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      token_type: 'bearer'
    }

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedSession))
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'test@example.com' } },
      error: null
    })

    // User visits any page after successful OAuth
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/dashboard',
        hash: '',
        search: '',
        pathname: '/dashboard'
      },
      writable: true
    })

    const TestComponent = () => {
      const { AuthProvider } = require('../contexts/AuthContext')
      const { useAuth } = require('../contexts/AuthContext')
      
      const TestChild = () => {
        const { isAuthenticated, user } = useAuth()
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <div data-testid="user-email">{user?.email || 'no-email'}</div>
          </div>
        )
      }
      
      return (
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
    }

    render(<TestComponent />)

    // Should load user from stored session
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith('stored_token')
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('validates localStorage session format', async () => {
    // Test that the session stored in localStorage has the correct format
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/auth/callback#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000&token_type=bearer',
        hash: '#access_token=test_token&refresh_token=test_refresh&expires_at=1736466000&token_type=bearer',
        search: '',
        pathname: '/auth/callback'
      },
      writable: true
    })

    mockSetSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' }
    })

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.stringContaining('"access_token":"test_token"')
      )
    })

    // Verify the stored session structure
    const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(storedData).toEqual({
      access_token: 'test_token',
      refresh_token: 'test_refresh',
      expires_at: 1736466000,
      expires_in: expect.any(Number),
      token_type: 'bearer',
      user: null
    })
  })
})