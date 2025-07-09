import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthCallback } from '../AuthCallback'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn()
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
  const mockOnAuthStateChange = vi.fn()
  const mockGetSession = vi.fn()
  const mockUnsubscribe = vi.fn()
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Set up the mock subscription
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
    
    // Get the mocked supabase and assign the mock functions
    const supabaseModule = await vi.importMock('../../lib/supabase')
    supabaseModule.supabase.auth.onAuthStateChange = mockOnAuthStateChange
    supabaseModule.supabase.auth.getSession = mockGetSession
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    
    renderWithRouter(<AuthCallback />)

    expect(screen.getByText('Completing authentication...')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we redirect you.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('redirects to dashboard when session exists', async () => {
    const mockSession = { access_token: 'token', user: { id: 'user1' } }
    mockGetSession.mockResolvedValue({ data: { session: mockSession } })

    renderWithRouter(<AuthCallback />)

    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('listens for auth state changes', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    renderWithRouter(<AuthCallback />)

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    // Simulate successful sign in
    const authCallback = mockOnAuthStateChange.mock.calls[0][0]
    const mockSession = { access_token: 'token', user: { id: 'user1' } }
    authCallback('SIGNED_IN', mockSession)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to login on auth failure', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    renderWithRouter(<AuthCallback />)

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    // Simulate auth failure
    const authCallback = mockOnAuthStateChange.mock.calls[0][0]
    authCallback('USER_UPDATED', null)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=auth_failed')
    })
  })

  it('unsubscribes from auth changes on unmount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { unmount } = renderWithRouter(<AuthCallback />)

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})