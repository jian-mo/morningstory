import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthCallback } from '../AuthCallback'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: vi.fn(),
      getUser: vi.fn()
    }
  }
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

const renderWithRouter = (component: React.ReactElement, hash = '', search = '') => {
  // Update URL - ensure hash is properly formatted
  const formattedHash = hash.startsWith('#') ? hash : (hash ? `#${hash}` : '')
  const formattedSearch = search.startsWith('?') ? search : (search ? `?${search}` : '')
  
  Object.defineProperty(window, 'location', {
    value: { 
      href: `http://localhost:3000/auth/callback${formattedSearch}${formattedHash}`,
      hash: formattedHash,
      search: formattedSearch,
      pathname: '/auth/callback'
    },
    writable: true,
  })
  window.history = { replaceState: vi.fn() } as any
  
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AuthCallback', () => {
  const mockSetSession = vi.fn()
  const mockGetUser = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Get the mocked supabase and assign the mock functions
    const { supabase } = require('../../lib/supabase')
    mockSetSession.mockClear()
    mockGetUser.mockClear()
    supabase.auth.setSession = mockSetSession
    supabase.auth.getUser = mockGetUser
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state', () => {
    renderWithRouter(<AuthCallback />)

    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we redirect you.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('handles successful OAuth callback with tokens', async () => {
    // Mock OAuth tokens in URL hash
    const hash = '#access_token=test_access_token&refresh_token=test_refresh_token&expires_at=1736466000&token_type=bearer'
    
    mockSetSession.mockResolvedValue({
      data: { session: { access_token: 'test_access_token', user: { id: 'user1' } } },
      error: null
    })

    renderWithRouter(<AuthCallback />, hash)

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token'
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles Invalid API key error with localStorage fallback', async () => {
    const hash = '#access_token=test_access_token&refresh_token=test_refresh_token&expires_at=1736466000&token_type=bearer'
    
    mockSetSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' }
    })

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'test@example.com' } },
      error: null
    })

    renderWithRouter(<AuthCallback />, hash)

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.stringContaining('test_access_token')
      )
    })

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith('test_access_token')
    })

    // Should redirect to dashboard
    expect(window.location.href).toBe('/dashboard')
  })

  it('handles OAuth error in URL', async () => {
    const search = '?error=access_denied'

    renderWithRouter(<AuthCallback />, '', search)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=oauth_error')
    })
  })

  it('handles missing tokens', async () => {
    const hash = '#state=random_state'

    renderWithRouter(<AuthCallback />, hash)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=no_tokens')
    })
  })

  it('handles session error (not Invalid API key)', async () => {
    const hash = '#access_token=test_access_token&refresh_token=test_refresh_token&expires_at=1736466000'
    
    mockSetSession.mockResolvedValue({
      data: null,
      error: { message: 'Some other error' }
    })

    renderWithRouter(<AuthCallback />, hash)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=session_error')
    })
  })

  it('creates proper session object for localStorage', async () => {
    const hash = '#access_token=test_access_token&refresh_token=test_refresh_token&expires_at=1736466000&token_type=bearer'
    
    mockSetSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' }
    })

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null
    })

    renderWithRouter(<AuthCallback />, hash)

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.stringContaining('"access_token":"test_access_token"')
      )
    })

    // Verify the stored data structure
    const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(storedData).toEqual({
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      expires_at: 1736466000,
      expires_in: expect.any(Number),
      token_type: 'bearer',
      user: null
    })
  })

  it('handles callback error gracefully', async () => {
    const hash = '#access_token=test_access_token&refresh_token=test_refresh_token'
    
    mockSetSession.mockRejectedValue(new Error('Network error'))

    renderWithRouter(<AuthCallback />, hash)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=callback_error')
    })
  })
})